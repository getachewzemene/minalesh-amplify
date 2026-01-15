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

/**
 * Email template for data export ready notification
 */
export function createDataExportReadyEmail(
  to: string,
  downloadUrl: string,
  expiresAt: Date,
  format: string
): EmailTemplate {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    to,
    subject: 'Your Data Export is Ready',
    template: 'data_export_ready',
    text: `
Your data export is ready!

We've prepared your requested data export in ${format.toUpperCase()} format.

Download your data:
${downloadUrl}

Important: This download link will expire on ${expiryDate}.

If you did not request this export, please contact our support team immediately.

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
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .info-box { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2196F3; }
    .warning { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; color: #856404; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Data Export is Ready</h1>
    </div>
    <div class="content">
      <p>Great news! We've prepared your requested data export.</p>
      <div class="info-box">
        <p><strong>Format:</strong> ${format.toUpperCase()}</p>
        <p><strong>Expires:</strong> ${expiryDate}</p>
      </div>
      <a href="${downloadUrl}" class="button">Download Your Data</a>
      <div class="warning">
        <p><strong>⏰ Important:</strong> This download link will expire on ${expiryDate}. Please download your data before this date.</p>
      </div>
      <p><small>If you did not request this export, please contact our support team immediately.</small></p>
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
 * Email template for data export expiring soon
 */
export function createDataExportExpiringEmail(
  to: string,
  downloadUrl: string,
  expiresAt: Date,
  hoursRemaining: number
): EmailTemplate {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  return {
    to,
    subject: `⏰ Your Data Export Expires in ${hoursRemaining} Hours`,
    template: 'data_export_expiring',
    text: `
Your data export is expiring soon!

Your data export will expire in ${hoursRemaining} hours (${expiryDate}).

Download your data now:
${downloadUrl}

After expiration, you'll need to request a new export.

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
    .urgent-box { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #FF9800; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Data Export Expiring Soon</h1>
    </div>
    <div class="content">
      <div class="urgent-box">
        <p><strong>Reminder:</strong> Your data export will expire in <strong>${hoursRemaining} hours</strong> (${expiryDate}).</p>
      </div>
      <p>Please download your data before it expires. After expiration, you'll need to request a new export.</p>
      <a href="${downloadUrl}" class="button">Download Your Data Now</a>
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
 * Email template for account deletion confirmation
 */
export function createAccountDeletionConfirmationEmail(
  to: string,
  displayName: string
): EmailTemplate {
  return {
    to,
    subject: 'Account Deletion Confirmation',
    template: 'account_deletion_confirmation',
    text: `
Hello ${displayName},

This email confirms that your Minalesh account has been permanently deleted.

Your personal data has been removed from our systems in accordance with GDPR and data privacy regulations.

We're sorry to see you go. If you change your mind, you're always welcome to create a new account.

If you did not request this deletion, please contact our support team immediately.

Thank you for being part of Minalesh,
Minalesh Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #757575; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .info-box { background-color: #e0e0e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Account Deletion Confirmation</h1>
    </div>
    <div class="content">
      <p>Hello ${displayName},</p>
      <div class="info-box">
        <p>This email confirms that your Minalesh account has been <strong>permanently deleted</strong>.</p>
        <p>Your personal data has been removed from our systems in accordance with GDPR and data privacy regulations.</p>
      </div>
      <p>We're sorry to see you go. If you change your mind, you're always welcome to create a new account.</p>
      <p><small><strong>Security Note:</strong> If you did not request this deletion, please contact our support team immediately.</small></p>
    </div>
    <div class="footer">
      <p>Thank you for being part of Minalesh,<br>Minalesh Team</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Email template for vendor verification status change
 */
export function createVerificationStatusEmail(
  to: string,
  vendorName: string,
  status: string,
  rejectionReason?: string
): EmailTemplate {
  const statusMessages = {
    approved: {
      subject: '✅ Your Vendor Verification is Approved',
      message: 'Congratulations! Your vendor verification has been approved. You can now start selling on Minalesh.',
      color: '#4CAF50',
    },
    rejected: {
      subject: '❌ Vendor Verification Update',
      message: 'Unfortunately, your vendor verification has been rejected.',
      color: '#f44336',
    },
    under_review: {
      subject: '🔍 Your Vendor Verification is Under Review',
      message: 'Your verification documents are currently being reviewed by our team.',
      color: '#2196F3',
    },
    suspended: {
      subject: '⚠️ Vendor Account Suspended',
      message: 'Your vendor account has been suspended.',
      color: '#FF9800',
    },
  };

  const statusInfo = statusMessages[status as keyof typeof statusMessages] || statusMessages.under_review;

  return {
    to,
    subject: statusInfo.subject,
    template: 'verification_status_change',
    text: `
Hello ${vendorName},

${statusInfo.message}

Status: ${status.toUpperCase().replace(/_/g, ' ')}
${rejectionReason ? `\nReason: ${rejectionReason}` : ''}

${status === 'approved' ? 'You can now access your vendor dashboard and start listing products.' : ''}
${status === 'rejected' ? 'You can resubmit your verification documents after addressing the issues mentioned above.' : ''}

If you have any questions, please contact our support team.

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
    .header { background-color: ${statusInfo.color}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .status-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${statusInfo.color}; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verification Status Update</h1>
    </div>
    <div class="content">
      <p>Hello ${vendorName},</p>
      <div class="status-box">
        <p>${statusInfo.message}</p>
        <p><strong>Status:</strong> ${status.toUpperCase().replace(/_/g, ' ')}</p>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
      </div>
      ${status === 'approved' ? '<p>You can now access your vendor dashboard and start listing products.</p>' : ''}
      ${status === 'rejected' ? '<p>You can resubmit your verification documents after addressing the issues mentioned above.</p>' : ''}
      <p>If you have any questions, please contact our support team.</p>
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
 * Email template for dispute filed notification
 */
export function createDisputeFiledEmail(
  to: string,
  recipientName: string,
  disputeId: string,
  orderNumber: string,
  disputeType: string,
  isVendor: boolean
): EmailTemplate {
  return {
    to,
    subject: `${isVendor ? '⚠️ New' : '✓ Your'} Dispute Filed - Order ${orderNumber}`,
    template: 'dispute_filed',
    text: `
Hello ${recipientName},

${isVendor 
  ? 'A customer has filed a dispute for one of your orders.' 
  : 'Your dispute has been successfully filed.'}

Order Number: ${orderNumber}
Dispute Type: ${disputeType.replace(/_/g, ' ').toUpperCase()}
Dispute ID: ${disputeId}

${isVendor 
  ? 'Please review the dispute and respond within 48 hours to avoid escalation to admin review.' 
  : 'We will notify you when the vendor responds. You can track the dispute status in your account.'}

View dispute details in your ${isVendor ? 'vendor' : 'account'} dashboard.

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
    .header { background-color: ${isVendor ? '#FF9800' : '#2196F3'}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .dispute-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${isVendor ? '#FF9800' : '#2196F3'}; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isVendor ? '⚠️ New Dispute Filed' : '✓ Dispute Filed Successfully'}</h1>
    </div>
    <div class="content">
      <p>Hello ${recipientName},</p>
      <p>${isVendor 
        ? 'A customer has filed a dispute for one of your orders.' 
        : 'Your dispute has been successfully filed.'}</p>
      <div class="dispute-box">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Dispute Type:</strong> ${disputeType.replace(/_/g, ' ').toUpperCase()}</p>
        <p><strong>Dispute ID:</strong> ${disputeId}</p>
      </div>
      <p>${isVendor 
        ? 'Please review the dispute and respond within 48 hours to avoid escalation to admin review.' 
        : 'We will notify you when the vendor responds. You can track the dispute status in your account.'}</p>
      <p>View dispute details in your ${isVendor ? 'vendor' : 'account'} dashboard.</p>
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
 * Email template for dispute response notification
 */
export function createDisputeRespondedEmail(
  to: string,
  recipientName: string,
  disputeId: string,
  orderNumber: string,
  responderName: string
): EmailTemplate {
  return {
    to,
    subject: `💬 New Response on Dispute - Order ${orderNumber}`,
    template: 'dispute_responded',
    text: `
Hello ${recipientName},

${responderName} has responded to your dispute.

Order Number: ${orderNumber}
Dispute ID: ${disputeId}

Please review the response and continue the conversation if needed.

View the dispute in your account dashboard.

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
    .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .message-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #9C27B0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 New Dispute Response</h1>
    </div>
    <div class="content">
      <p>Hello ${recipientName},</p>
      <p>${responderName} has responded to your dispute.</p>
      <div class="message-box">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Dispute ID:</strong> ${disputeId}</p>
      </div>
      <p>Please review the response and continue the conversation if needed.</p>
      <p>View the dispute in your account dashboard.</p>
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
 * Email template for dispute escalated notification
 */
export function createDisputeEscalatedEmail(
  to: string,
  recipientName: string,
  disputeId: string,
  orderNumber: string,
  isAdmin: boolean
): EmailTemplate {
  return {
    to,
    subject: `🔺 Dispute Escalated ${isAdmin ? 'for Review' : ''} - Order ${orderNumber}`,
    template: 'dispute_escalated',
    text: `
Hello ${recipientName},

${isAdmin 
  ? 'A dispute has been escalated and requires admin review.' 
  : 'Your dispute has been escalated to admin review due to no response from the vendor.'}

Order Number: ${orderNumber}
Dispute ID: ${disputeId}

${isAdmin 
  ? 'Please review and resolve the dispute as soon as possible.' 
  : 'Our admin team will review the dispute and make a decision. You will be notified of the outcome.'}

${isAdmin ? 'View the dispute in the admin dashboard.' : 'You can track the status in your account dashboard.'}

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
    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .escalation-box { background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f44336; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔺 Dispute Escalated</h1>
    </div>
    <div class="content">
      <p>Hello ${recipientName},</p>
      <div class="escalation-box">
        <p>${isAdmin 
          ? 'A dispute has been escalated and requires admin review.' 
          : 'Your dispute has been escalated to admin review due to no response from the vendor.'}</p>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Dispute ID:</strong> ${disputeId}</p>
      </div>
      <p>${isAdmin 
        ? 'Please review and resolve the dispute as soon as possible.' 
        : 'Our admin team will review the dispute and make a decision. You will be notified of the outcome.'}</p>
      <p>${isAdmin ? 'View the dispute in the admin dashboard.' : 'You can track the status in your account dashboard.'}</p>
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
 * Email template for dispute resolved notification
 */
export function createDisputeResolvedEmail(
  to: string,
  recipientName: string,
  disputeId: string,
  orderNumber: string,
  resolution: string,
  outcome: 'customer_favor' | 'vendor_favor' | 'partial_refund' | 'other'
): EmailTemplate {
  const outcomeMessages = {
    customer_favor: 'The dispute has been resolved in your favor.',
    vendor_favor: 'The dispute has been resolved.',
    partial_refund: 'The dispute has been resolved with a partial refund.',
    other: 'The dispute has been resolved.',
  };

  return {
    to,
    subject: `✓ Dispute Resolved - Order ${orderNumber}`,
    template: 'dispute_resolved',
    text: `
Hello ${recipientName},

${outcomeMessages[outcome]}

Order Number: ${orderNumber}
Dispute ID: ${disputeId}

Resolution:
${resolution}

If you have any questions about this resolution, please contact our support team.

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
    .resolution-box { background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Dispute Resolved</h1>
    </div>
    <div class="content">
      <p>Hello ${recipientName},</p>
      <p>${outcomeMessages[outcome]}</p>
      <div class="resolution-box">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Dispute ID:</strong> ${disputeId}</p>
        <p><strong>Resolution:</strong></p>
        <p>${resolution}</p>
      </div>
      <p>If you have any questions about this resolution, please contact our support team.</p>
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
 * Email template for price drop alert notification
 */
export function createPriceDropAlertEmail(
  to: string,
  productName: string,
  currentPrice: number,
  targetPrice: number,
  originalPrice: number,
  discountPercent: number,
  productUrl: string,
  imageUrl?: string
): EmailTemplate {
  const formattedCurrentPrice = currentPrice.toLocaleString();
  const formattedTargetPrice = targetPrice.toLocaleString();
  const formattedOriginalPrice = originalPrice.toLocaleString();

  return {
    to,
    subject: `🎉 Price Drop Alert: ${productName} is now ${formattedCurrentPrice} ETB!`,
    template: 'price_drop_alert',
    text: `
Great news! A product you've been watching has dropped to your target price!

Product: ${productName}
Current Price: ${formattedCurrentPrice} ETB
Your Target Price: ${formattedTargetPrice} ETB
Original Price: ${formattedOriginalPrice} ETB
Discount: ${discountPercent}% off

View Product: ${productUrl}

Hurry! Prices can change at any time.

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
    .product-card { background-color: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .product-image { width: 100%; max-width: 200px; height: auto; border-radius: 8px; display: block; margin: 0 auto 15px; }
    .price-box { background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .current-price { font-size: 28px; color: #4CAF50; font-weight: bold; }
    .original-price { text-decoration: line-through; color: #999; font-size: 16px; }
    .discount-badge { display: inline-block; background-color: #FF5722; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; }
    .button { display: inline-block; padding: 14px 28px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
    .button:hover { background-color: #45a049; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .urgency { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; color: #856404; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Price Drop Alert!</h1>
    </div>
    <div class="content">
      <p>Great news! A product you've been watching has dropped to your target price!</p>
      
      <div class="product-card">
        ${imageUrl ? `<img src="${imageUrl}" alt="${productName}" class="product-image" />` : ''}
        <h2 style="margin: 0 0 10px 0;">${productName}</h2>
        <div class="price-box">
          <p style="margin: 0;">
            <span class="original-price">${formattedOriginalPrice} ETB</span>
            <span class="discount-badge">${discountPercent}% OFF</span>
          </p>
          <p class="current-price" style="margin: 10px 0 0 0;">${formattedCurrentPrice} ETB</p>
          <p style="margin: 5px 0 0 0; color: #666;">Your target: ${formattedTargetPrice} ETB ✓</p>
        </div>
        <a href="${productUrl}" class="button">View Product →</a>
      </div>
      
      <div class="urgency">
        <strong>⏰ Act Fast!</strong> Prices can change at any time.
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this email because you set a price alert for this product.</p>
      <p>Thank you for shopping with Minalesh!</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Email template for saved search digest with new matching products
 */
export function createSavedSearchDigestEmail(
  to: string,
  searchName: string,
  searchQuery: string,
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    imageUrl?: string;
  }>,
  searchUrl: string,
  appUrl: string
): EmailTemplate {
  const productCount = products.length;
  const productListText = products
    .map(
      (p) =>
        `- ${p.name}: ${p.salePrice ? p.salePrice.toLocaleString() : p.price.toLocaleString()} ETB`
    )
    .join('\n');

  const productListHtml = products
    .map(
      (p) => `
        <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
          ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />` : '<div style="width: 60px; height: 60px; background-color: #f0f0f0; border-radius: 4px; margin-right: 15px;"></div>'}
          <div style="flex: 1;">
            <a href="${appUrl}/product/${p.slug}" style="color: #333; text-decoration: none; font-weight: 500;">${p.name}</a>
            <p style="margin: 5px 0 0 0; color: #4CAF50; font-weight: bold;">
              ${p.salePrice ? `<span style="text-decoration: line-through; color: #999; font-weight: normal;">${p.price.toLocaleString()} ETB</span> ` : ''}
              ${p.salePrice ? p.salePrice.toLocaleString() : p.price.toLocaleString()} ETB
            </p>
          </div>
          <a href="${appUrl}/product/${p.slug}" style="padding: 8px 16px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">View</a>
        </div>
      `
    )
    .join('');

  return {
    to,
    subject: `🔔 ${productCount} new product${productCount > 1 ? 's' : ''} matching "${searchName}"`,
    template: 'saved_search_digest',
    text: `
New products matching your saved search!

Search: "${searchName}"
Query: ${searchQuery}
New Products Found: ${productCount}

Products:
${productListText}

View all matching products: ${searchUrl}

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
    .search-info { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2196F3; }
    .products-list { background-color: white; border-radius: 8px; overflow: hidden; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .button { display: inline-block; padding: 14px 28px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Products Found!</h1>
    </div>
    <div class="content">
      <p>Great news! We found ${productCount} new product${productCount > 1 ? 's' : ''} matching your saved search.</p>
      
      <div class="search-info">
        <p style="margin: 0;"><strong>Saved Search:</strong> ${searchName}</p>
        <p style="margin: 5px 0 0 0;"><strong>Search Query:</strong> "${searchQuery}"</p>
      </div>
      
      <div class="products-list">
        ${productListHtml}
      </div>
      
      <div style="text-align: center;">
        <a href="${searchUrl}" class="button">View All Matching Products →</a>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this email because you enabled notifications for this saved search.</p>
      <p>To manage your saved searches, visit your profile settings.</p>
      <p>Thank you for shopping with Minalesh!</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Email template for enhanced order tracking updates
 * Supports all 7 order stages with courier info and estimated delivery
 */
export function createEnhancedTrackingEmail(
  to: string,
  orderNumber: string,
  stage: string,
  extras?: {
    courierName?: string;
    courierPhone?: string;
    estimatedDeliveryStart?: Date;
    estimatedDeliveryEnd?: Date;
    deliveryProofUrl?: string;
    trackingUrl?: string;
  }
): EmailTemplate {
  const stageInfo: Record<string, { title: string; message: string; color: string; icon: string }> = {
    pending: {
      title: 'Order Placed',
      message: 'Your order has been received and is being processed.',
      color: '#FFC107',
      icon: '📦',
    },
    confirmed: {
      title: 'Vendor Confirmed',
      message: 'Great news! The vendor has confirmed your order and is preparing it.',
      color: '#00BCD4',
      icon: '✅',
    },
    packed: {
      title: 'Order Packed',
      message: 'Your order has been packed and is ready for pickup by our delivery partner.',
      color: '#9C27B0',
      icon: '📦',
    },
    picked_up: {
      title: 'Picked Up by Courier',
      message: 'Your order has been picked up by our courier and is on its way!',
      color: '#673AB7',
      icon: '🚴',
    },
    in_transit: {
      title: 'In Transit',
      message: 'Your order is on the move and heading towards your location.',
      color: '#E91E63',
      icon: '🚚',
    },
    out_for_delivery: {
      title: 'Out for Delivery',
      message: 'Exciting! Your order is out for delivery and will arrive soon.',
      color: '#FF5722',
      icon: '🏃',
    },
    delivered: {
      title: 'Delivered',
      message: 'Your order has been delivered. Thank you for shopping with us!',
      color: '#4CAF50',
      icon: '🎉',
    },
  };

  const info = stageInfo[stage] || {
    title: 'Order Update',
    message: `Your order status has been updated to: ${stage.replace(/_/g, ' ')}`,
    color: '#2196F3',
    icon: '📋',
  };

  const courierHtml = extras?.courierName ? `
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 0; font-weight: bold;">🧑‍💼 Your Delivery Person</p>
      <p style="margin: 5px 0 0 0;">${extras.courierName}${extras.courierPhone ? ` • ${extras.courierPhone}` : ''}</p>
    </div>
  ` : '';

  const estimatedDeliveryHtml = extras?.estimatedDeliveryEnd ? `
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 0; font-weight: bold;">⏰ Estimated Delivery</p>
      <p style="margin: 5px 0 0 0;">${new Date(extras.estimatedDeliveryEnd).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}</p>
    </div>
  ` : '';

  const deliveryProofHtml = extras?.deliveryProofUrl ? `
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 0; font-weight: bold;">📸 Proof of Delivery</p>
      <p style="margin: 5px 0 0 0;"><a href="${extras.deliveryProofUrl}" style="color: #4CAF50;">View delivery photo</a></p>
    </div>
  ` : '';

  const trackingButtonHtml = extras?.trackingUrl ? `
    <div style="text-align: center; margin: 20px 0;">
      <a href="${extras.trackingUrl}" style="display: inline-block; padding: 12px 24px; background-color: ${info.color}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Your Order</a>
    </div>
  ` : '';

  return {
    to,
    subject: `${info.icon} ${info.title} - Order ${orderNumber}`,
    template: 'enhanced_tracking',
    text: `
${info.title}

Order Number: ${orderNumber}

${info.message}

${extras?.courierName ? `Delivery Person: ${extras.courierName}${extras.courierPhone ? ` (${extras.courierPhone})` : ''}` : ''}
${extras?.estimatedDeliveryEnd ? `Estimated Delivery: ${new Date(extras.estimatedDeliveryEnd).toLocaleString()}` : ''}

Track your order at any time in your Minalesh account.

Thank you for shopping with Minalesh!
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${info.color}; color: white; padding: 30px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .order-box { background-color: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 48px;">${info.icon}</h1>
      <h2 style="margin: 10px 0 0 0;">${info.title}</h2>
    </div>
    <div class="content">
      <div class="order-box">
        <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
        <p style="margin: 5px 0 15px 0; font-size: 20px; font-weight: bold;">#${orderNumber}</p>
        <p style="margin: 0;">${info.message}</p>
      </div>
      ${courierHtml}
      ${estimatedDeliveryHtml}
      ${deliveryProofHtml}
      ${trackingButtonHtml}
    </div>
    <div class="footer">
      <p>Thank you for shopping with Minalesh!</p>
      <p style="color: #999;">You're receiving this email because you placed an order on Minalesh.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}
