/**
 * Email Templates for QubitPage Demo Store
 * All transactional email templates with Romanian language support
 */

import { 
  OrderEmailData, 
  RegistrationEmailData, 
  ContactEmailData 
} from './brevo-service';

const STORE_NAME = 'QubitPage Demo Store';
const STORE_URL = 'https://www.YOUR_PNI_USERNAMEtrafic.ro';
const SUPPORT_EMAIL = 'admin@example.com';

// Base email wrapper
function baseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; line-height: 1.6; color: #333; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .btn { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .btn:hover { background: #0056b3; }
    .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .order-table th, .order-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .order-table th { background: #f8f9fa; font-weight: 600; }
    .total-row { font-weight: bold; background: #f0f7ff; }
    .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .info { background: #cce5ff; color: #004085; padding: 15px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${STORE_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
      <p>
        <a href="${STORE_URL}">Visit the store</a> | 
        <a href="mailto:${SUPPORT_EMAIL}">Contact</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Registration / Welcome Email
export function registrationEmail(data: RegistrationEmailData): { subject: string; html: string; text: string } {
  const subject = `Welcome to ${STORE_NAME}!`;
  
  const content = `
    <h2>Welcome, ${data.customerName}!</h2>
    <p>Your account has been created successfully. We are delighted to have you with us!</p>
    
    <div class="success">
      <strong>Account details:</strong><br>
      Email: ${data.customerEmail}
    </div>
    
    <p>With your account you can:</p>
    <ul>
      <li>Track the status of your orders</li>
      <li>Save favorite products</li>
      <li>View order history</li>
      <li>Update delivery details</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="${STORE_URL}/ro/account" class="btn">Access Your Account</a>
    </p>
    
    <p>If you have any questions, don't hesitate to contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
    
    <p>Best regards,<br>${STORE_NAME}</p>
  `;
  
  const text = `
Welcome, ${data.customerName}!

Your account has been created successfully on ${STORE_NAME}.

Email: ${data.customerEmail}

Access your account: ${STORE_URL}/ro/account

Best regards,
${STORE_NAME}
  `.trim();
  
  return { subject, html: baseTemplate(content, subject), text };
}

// Account Confirmation Email
export function accountConfirmationEmail(data: RegistrationEmailData & { confirmationUrl: string }): { subject: string; html: string; text: string } {
  const subject = `Confirm your email address - ${STORE_NAME}`;
  
  const content = `
    <h2>Hello, ${data.customerName}!</h2>
    <p>Please confirm your email address to complete account creation.</p>
    
    <p style="text-align: center;">
      <a href="${data.confirmationUrl}" class="btn">Confirm Email</a>
    </p>
    
    <p style="font-size: 12px; color: #666;">
      If the button doesn't work, copy this link into your browser:<br>
      <a href="${data.confirmationUrl}">${data.confirmationUrl}</a>
    </p>
    
    <div class="highlight">
      <strong>Note:</strong> The link expires in 24 hours.
    </div>
    
    <p>If you did not create this account, you can ignore this email.</p>
  `;
  
  const text = `
Hello, ${data.customerName}!

Confirm your email address: ${data.confirmationUrl}

The link expires in 24 hours.

${STORE_NAME}
  `.trim();
  
  return { subject, html: baseTemplate(content, subject), text };
}

// Order Confirmation Email
export function orderConfirmationEmail(data: OrderEmailData): { subject: string; html: string; text: string } {
  const subject = `Order confirmed #${data.orderNumber} - ${STORE_NAME}`;
  
  const itemsHtml = data.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${item.price.toFixed(2)} RON</td>
    </tr>
  `).join('');
  
  const content = `
    <div class="success">
      <h2 style="margin: 0;">✓ Order has been confirmed!</h2>
    </div>
    
    <p>Hello ${data.customerName},</p>
    <p>Thank you for your order! We have received it and are processing it now.</p>
    
    <div class="info">
      <strong>Order number:</strong> #${data.orderNumber}
    </div>
    
    <h3>Ordered products:</h3>
    <table class="order-table">
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align: center;">Quantity</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr class="total-row">
          <td colspan="2"><strong>TOTAL</strong></td>
          <td style="text-align: right;"><strong>${data.total.toFixed(2)} RON</strong></td>
        </tr>
      </tbody>
    </table>
    
    <h3>Shipping address:</h3>
    <p>${data.shippingAddress.replace(/\n/g, '<br>')}</p>
    
    <p style="text-align: center;">
      <a href="${STORE_URL}/ro/account/orders" class="btn">View Order</a>
    </p>
    
    <p>We will notify you when the order is shipped.</p>
    
    <p>Best regards,<br>${STORE_NAME}</p>
  `;
  
  const itemsText = data.items.map(item => 
    `- ${item.name} x${item.quantity} = ${item.price.toFixed(2)} RON`
  ).join('\n');
  
  const text = `
Order has been confirmed!

Order number: #${data.orderNumber}

Products:
${itemsText}

TOTAL: ${data.total.toFixed(2)} RON

Shipping address:
${data.shippingAddress}

View order: ${STORE_URL}/ro/account/orders

${STORE_NAME}
  `.trim();
  
  return { subject, html: baseTemplate(content, subject), text };
}

// Order Shipped Email
export function orderShippedEmail(data: OrderEmailData): { subject: string; html: string; text: string } {
  const subject = `Order #${data.orderNumber} has been shipped! - ${STORE_NAME}`;
  
  const content = `
    <div class="success">
      <h2 style="margin: 0;">📦 Your order is on its way!</h2>
    </div>
    
    <p>Hello ${data.customerName},</p>
    <p>Good news! Your order #${data.orderNumber} has been shipped and is on its way to you.</p>
    
    ${data.trackingNumber ? `
    <div class="info">
      <strong>AWB Number:</strong> ${data.trackingNumber}<br>
      <a href="https://www.fancourier.ro/awb-tracking/?metession=${data.trackingNumber}">Track your package</a>
    </div>
    ` : ''}
    
    <h3>Shipping address:</h3>
    <p>${data.shippingAddress.replace(/\n/g, '<br>')}</p>
    
    <p style="text-align: center;">
      <a href="${STORE_URL}/ro/account/orders" class="btn">View Order Details</a>
    </p>
    
    <p>You will receive the package within the next 1-3 business days.</p>
    
    <p>Best regards,<br>${STORE_NAME}</p>
  `;
  
  const text = `
Order #${data.orderNumber} has been shipped!

${data.trackingNumber ? `AWB Number: ${data.trackingNumber}` : ''}

Shipping to:
${data.shippingAddress}

Estimated delivery: 1-3 business days

${STORE_NAME}
  `.trim();
  
  return { subject, html: baseTemplate(content, subject), text };
}

// Password Reset Email
export function passwordResetEmail(data: { email: string; resetUrl: string }): { subject: string; html: string; text: string } {
  const subject = `Reset your password - ${STORE_NAME}`;
  
  const content = `
    <h2>You requested a password reset</h2>
    <p>We received a password reset request for the account associated with ${data.email}.</p>
    
    <p style="text-align: center;">
      <a href="${data.resetUrl}" class="btn">Reset Password</a>
    </p>
    
    <p style="font-size: 12px; color: #666;">
      If the button doesn't work, copy this link:<br>
      <a href="${data.resetUrl}">${data.resetUrl}</a>
    </p>
    
    <div class="highlight">
      <strong>Important:</strong> The link expires in 1 hour.
    </div>
    
    <p>If you did not request a password reset, ignore this email. Your account is safe.</p>
    
    <p>Best regards,<br>${STORE_NAME}</p>
  `;
  
  const text = `
Reset your password

Link: ${data.resetUrl}

The link expires in 1 hour.

If you did not request this, ignore this email.

${STORE_NAME}
  `.trim();
  
  return { subject, html: baseTemplate(content, subject), text };
}

// Contact Form Email (sent to admin)
export function contactFormEmail(data: ContactEmailData): { subject: string; html: string; text: string } {
  const subject = `[Contact] ${data.subject} - from ${data.name}`;
  
  const content = `
    <h2>New message from website</h2>
    
    <table style="width: 100%; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; background: #f8f9fa; font-weight: bold; width: 120px;">Name:</td>
        <td style="padding: 10px;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">Email:</td>
        <td style="padding: 10px;"><a href="mailto:${data.email}">${data.email}</a></td>
      </tr>
      ${data.phone ? `
      <tr>
        <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">Phone:</td>
        <td style="padding: 10px;"><a href="tel:${data.phone}">${data.phone}</a></td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">Subject:</td>
        <td style="padding: 10px;">${data.subject}</td>
      </tr>
    </table>
    
    <h3>Message:</h3>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; white-space: pre-wrap;">
${data.message}
    </div>
    
    <p style="margin-top: 30px;">
      <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" class="btn">Reply</a>
    </p>
  `;
  
  const text = `
New message from website

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
Subject: ${data.subject}

Message:
${data.message}
  `.trim();
  
  return { subject, html: baseTemplate(content, subject), text };
}

// Contact Form Confirmation (sent to user)
export function contactConfirmationEmail(data: ContactEmailData): { subject: string; html: string; text: string } {
  const subject = `We received your message - ${STORE_NAME}`;
  
  const content = `
    <h2>Thank you for your message!</h2>
    <p>Hello ${data.name},</p>
    <p>We received your message and will respond as soon as possible, usually within 24 hours.</p>
    
    <div class="info">
      <strong>Subject:</strong> ${data.subject}
    </div>
    
    <h3>Your message:</h3>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-style: italic;">
      ${data.message.replace(/\n/g, '<br>')}
    </div>
    
    <p>If you have an urgent matter, you can contact us directly at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
    
    <p>Best regards,<br>${STORE_NAME}</p>
  `;
  
  const text = `
Thank you for your message!

We received your message: "${data.subject}"

We will respond within 24 hours.

${STORE_NAME}
  `.trim();
  
  return { subject, html: baseTemplate(content, subject), text };
}

export default {
  registrationEmail,
  accountConfirmationEmail,
  orderConfirmationEmail,
  orderShippedEmail,
  passwordResetEmail,
  contactFormEmail,
  contactConfirmationEmail,
};
