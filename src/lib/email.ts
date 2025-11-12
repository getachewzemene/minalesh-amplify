/**
 * Email service for sending transactional emails
 * This is a basic implementation that logs emails to console in development
 * In production, integrate with services like SendGrid, AWS SES, or Mailgun
 */

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send an email (logs to console in development, should use real service in production)
 */
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    // In development, log the email
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email would be sent:');
      console.log('To:', template.to);
      console.log('Subject:', template.subject);
      console.log('---');
      console.log(template.text);
      console.log('---');
      return true;
    }

    // TODO: Integrate with email service provider
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: template.to,
    //   from: process.env.EMAIL_FROM,
    //   subject: template.subject,
    //   text: template.text,
    //   html: template.html,
    // });

    console.warn('Email service not configured for production');
    return false;
  } catch (error) {
    console.error('Error sending email:', error);
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
