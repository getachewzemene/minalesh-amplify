/**
 * Email service for sending transactional emails
 * Supports Resend email service with queue and retry logic
 */

import { Resend } from 'resend';
import prisma from './prisma';
import { logError, logEvent } from './logger';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
  template?: string;
  metadata?: Record<string, unknown>;
}

// Initialize Resend client
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Queue an email for sending
 * Emails are added to the queue and processed by a background worker
 */
export async function queueEmail(
  template: EmailTemplate,
  scheduledFor?: Date
): Promise<string> {
  try {
    const email = await prisma.emailQueue.create({
      data: {
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        template: template.template,
        metadata: template.metadata as any,
        status: 'pending',
        scheduledFor: scheduledFor || new Date(),
      },
    });

    logEvent('email_queued', {
      emailId: email.id,
      to: template.to,
      template: template.template,
    });

    return email.id;
  } catch (error) {
    logError(error, { operation: 'queueEmail', to: template.to });
    throw error;
  }
}

/**
 * Send an email immediately (bypasses queue)
 * Use this for critical emails that need to be sent synchronously
 */
export async function sendEmailImmediate(template: EmailTemplate): Promise<boolean> {
  try {
    const resend = getResendClient();
    const emailFrom = process.env.EMAIL_FROM || 'noreply@minalesh.et';

    // In development, log the email
    if (process.env.NODE_ENV !== 'production' || !resend) {
      console.log('📧 Email would be sent:');
      console.log('To:', template.to);
      console.log('Subject:', template.subject);
      console.log('---');
      console.log(template.text);
      console.log('---');
      
      if (!resend) {
        console.warn('Resend API key not configured. Set RESEND_API_KEY environment variable.');
      }
      return true;
    }

    // Send email via Resend
    const result = await resend.emails.send({
      from: emailFrom,
      to: template.to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (result.error) {
      logError(new Error(result.error.message), {
        operation: 'sendEmailImmediate',
        to: template.to,
      });
      return false;
    }

    logEvent('email_sent', {
      emailId: result.data?.id,
      to: template.to,
      template: template.template,
    });

    return true;
  } catch (error) {
    logError(error, { operation: 'sendEmailImmediate', to: template.to });
    return false;
  }
}

/**
 * Legacy function for backwards compatibility
 * Now queues email by default
 */
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    await queueEmail(template);
    return true;
  } catch (error) {
    logError(error, { operation: 'sendEmail', to: template.to });
    return false;
  }
}

/**
 * Process pending emails from the queue
 * Called by the email worker/cron job
 */
export async function processEmailQueue(batchSize = 10): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  try {
    // Get pending emails that are ready to be sent
    const emails = await prisma.emailQueue.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: new Date(),
        },
        attempts: {
          lt: prisma.emailQueue.fields.maxAttempts,
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      take: batchSize,
    });

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await sendQueuedEmail(email.id);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    logEvent('email_queue_processed', {
      processed: emails.length,
      sent,
      failed,
    });

    return {
      processed: emails.length,
      sent,
      failed,
    };
  } catch (error) {
    logError(error, { operation: 'processEmailQueue' });
    throw error;
  }
}

/**
 * Send a specific queued email
 */
async function sendQueuedEmail(emailId: string): Promise<boolean> {
  try {
    // Mark as processing
    const email = await prisma.emailQueue.update({
      where: { id: emailId },
      data: {
        status: 'processing',
        lastAttemptAt: new Date(),
      },
    });

    const resend = getResendClient();
    const emailFrom = process.env.EMAIL_FROM || 'noreply@minalesh.et';

    // In development or if Resend is not configured, mark as sent
    if (process.env.NODE_ENV !== 'production' || !resend) {
      console.log('📧 Queued email would be sent:');
      console.log('To:', email.to);
      console.log('Subject:', email.subject);
      
      await prisma.emailQueue.update({
        where: { id: emailId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          attempts: email.attempts + 1,
        },
      });
      return true;
    }

    // Send email via Resend
    const result = await resend.emails.send({
      from: emailFrom,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    if (result.error) {
      // Mark as failed if max attempts reached
      const newAttempts = email.attempts + 1;
      const shouldRetry = newAttempts < email.maxAttempts;
      
      await prisma.emailQueue.update({
        where: { id: emailId },
        data: {
          status: shouldRetry ? 'pending' : 'failed',
          attempts: newAttempts,
          lastError: result.error.message,
        },
      });

      logError(new Error(result.error.message), {
        operation: 'sendQueuedEmail',
        emailId,
        shouldRetry,
      });

      return false;
    }

    // Mark as sent
    await prisma.emailQueue.update({
      where: { id: emailId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        attempts: email.attempts + 1,
      },
    });

    logEvent('queued_email_sent', {
      emailId,
      to: email.to,
      resendId: result.data?.id,
    });

    return true;
  } catch (error) {
    // Handle transient failures with retry
    const email = await prisma.emailQueue.findUnique({
      where: { id: emailId },
    });

    if (email) {
      const newAttempts = email.attempts + 1;
      const shouldRetry = newAttempts < email.maxAttempts;
      
      await prisma.emailQueue.update({
        where: { id: emailId },
        data: {
          status: shouldRetry ? 'pending' : 'failed',
          attempts: newAttempts,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    logError(error, { operation: 'sendQueuedEmail', emailId });
    return false;
  }
}

/**
 * Email template for order confirmation
 */
export function createOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  totalAmount: string,
  orderItems: Array<{ name: string; quantity: number; price: number }>
): EmailTemplate {
  const itemsList = orderItems
    .map(item => `- ${item.name} x${item.quantity} - ${item.price} ETB`)
    .join('\n');

  const itemsHtml = orderItems
    .map(item => `<li>${item.name} x${item.quantity} - ${item.price} ETB</li>`)
    .join('');

  return {
    to,
    subject: `Order Confirmation - ${orderNumber}`,
    text: `
Thank you for your order!

Order Number: ${orderNumber}
Total Amount: ${totalAmount} ETB

Items:
${itemsList}

You can track your order status in your account dashboard.

Thank you for shopping with Minalesh!
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
    </div>
    <div class="content">
      <p>Thank you for your order!</p>
      <div class="order-details">
        <h2>Order #${orderNumber}</h2>
        <p><strong>Total Amount:</strong> ${totalAmount} ETB</p>
        <h3>Items:</h3>
        <ul>${itemsHtml}</ul>
      </div>
      <p>You can track your order status in your account dashboard.</p>
    </div>
    <div class="footer">
      <p>Thank you for shopping with Minalesh!</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Email template for shipping update
 */
export function createShippingUpdateEmail(
  to: string,
  orderNumber: string,
  status: string,
  trackingNumber?: string
): EmailTemplate {
  const trackingInfo = trackingNumber 
    ? `\nTracking Number: ${trackingNumber}` 
    : '';
  
  const trackingHtml = trackingNumber
    ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>`
    : '';

  return {
    to,
    subject: `Shipping Update - Order ${orderNumber}`,
    text: `
Your order has been updated!

Order Number: ${orderNumber}
Status: ${status}${trackingInfo}

You can track your order status in your account dashboard.

Thank you for shopping with Minalesh!
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .status-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Shipping Update</h1>
    </div>
    <div class="content">
      <p>Your order has been updated!</p>
      <div class="status-box">
        <h2>Order #${orderNumber}</h2>
        <p><strong>Status:</strong> ${status}</p>
        ${trackingHtml}
      </div>
      <p>You can track your order status in your account dashboard.</p>
    </div>
    <div class="footer">
      <p>Thank you for shopping with Minalesh!</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Email template for password reset
 */
export function createPasswordResetEmail(
  to: string,
  resetToken: string,
  appUrl: string
): EmailTemplate {
  const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;

  return {
    to,
    subject: 'Password Reset Request',
    text: `
You have requested to reset your password.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Thank you,
Minalesh Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .warning { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>You have requested to reset your password.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <div class="warning">
        <p><strong>Important:</strong> This link will expire in 1 hour.</p>
      </div>
      <p>If you did not request this password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>Thank you,<br>Minalesh Team</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Email template for email verification
 */
export function createEmailVerificationEmail(
  to: string,
  verificationToken: string,
  appUrl: string
): EmailTemplate {
  const verificationUrl = `${appUrl}/auth/verify-email?token=${verificationToken}`;

  return {
    to,
    subject: 'Verify Your Email Address',
    text: `
Welcome to Minalesh!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

Thank you,
Minalesh Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Minalesh!</h1>
    </div>
    <div class="content">
      <p>Thank you for registering with us.</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" class="button">Verify Email</a>
      <p><small>This link will expire in 24 hours.</small></p>
    </div>
    <div class="footer">
      <p>Thank you,<br>Minalesh Team</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}
