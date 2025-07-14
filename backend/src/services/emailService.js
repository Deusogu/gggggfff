const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@fail.ac',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Thank you for registering with Fail.ac!</p>
            <p>Please click the button below to verify your email address:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Fail.ac',
      html,
      text: `Please verify your email by visiting: ${verificationUrl}`
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #ff9800; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>You requested to reset your password.</p>
            <p>Click the button below to set a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 30 minutes.</p>
          </div>
          <div class="footer">
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Fail.ac',
      html,
      text: `Reset your password by visiting: ${resetUrl}`
    });
  }

  async sendOrderConfirmation(email, order) {
    const orderUrl = `${process.env.FRONTEND_URL}/order/${order.orderId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; }
          .order-details { background-color: white; padding: 20px; margin-top: 20px; border-radius: 5px; }
          .key-box { background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px; font-family: monospace; font-size: 16px; text-align: center; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .order-link { background-color: #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
          .order-link a { color: white; text-decoration: none; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <p>Thank you for your purchase!</p>
            
            <div class="order-link">
              <p style="color: white; margin: 5px 0;">Access your order anytime at:</p>
              <a href="${orderUrl}">${orderUrl}</a>
            </div>
            
            <div class="order-details">
              <h2>${order.productSnapshot.name} for ${order.productSnapshot.game}</h2>
              <p><strong>Duration:</strong> ${order.productSnapshot.duration}</p>
              <p><strong>Order ID:</strong> ${order.orderId}</p>
              <p><strong>Amount:</strong> ${order.amount}</p>
              <p><strong>Total:</strong> ${order.total} LTC</p>
              <p><strong>Time of purchase:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
              <p><strong>Payment method:</strong> Litecoin</p>
              <p><strong>Payment status:</strong> ✓ paid</p>
              
              <h3>Your License Key:</h3>
              <div class="key-box">${order.license_key}</div>
              
              <div style="text-align: center;">
                <a href="${orderUrl}" class="button">View Full Order Details</a>
                <a href="${order.productSnapshot.instruction_url}" class="button">Instructions & Loader</a>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>Save this email or bookmark the order link above to access your purchase anytime.</p>
            <p>Support contact: ${order.productSnapshot.support_contact}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Order Confirmation - ${order.productSnapshot.name}`,
      html,
      text: `Order confirmed! Access your order at: ${orderUrl}\nYour license key is: ${order.license_key}`
    });
  }

  async sendSellerNotification(sellerEmail, order) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; }
          .sale-details { background-color: white; padding: 20px; margin-top: 20px; border-radius: 5px; }
          .earnings { background-color: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Sale!</h1>
          </div>
          <div class="content">
            <p>Congratulations! You've made a new sale.</p>
            <div class="sale-details">
              <h2>${order.productSnapshot.name}</h2>
              <p><strong>Order ID:</strong> ${order.orderId}</p>
              <p><strong>Buyer:</strong> ${order.email}</p>
              <p><strong>Sale Price:</strong> ${order.total} LTC</p>
              <p><strong>Commission:</strong> ${order.commission} LTC</p>
              <div class="earnings">
                <h3>Your Earnings: ${order.sellerEarnings} LTC</h3>
              </div>
              <p><strong>Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
              <p><strong>License Key Issued:</strong> ${order.license_key}</p>
            </div>
          </div>
          <div class="footer">
            <p>View your dashboard for more details.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: sellerEmail,
      subject: `New Sale - ${order.productSnapshot.name}`,
      html,
      text: `New sale! Product: ${order.productSnapshot.name}, Earnings: ${order.sellerEarnings} LTC`
    });
  }

  async sendSellerApproval(email, approved, reason) {
    const subject = approved ? 'Seller Account Approved' : 'Seller Account Application';
    const headerColor = approved ? '#4CAF50' : '#f44336';
    const message = approved 
      ? 'Congratulations! Your seller account has been approved.'
      : 'Your seller account application requires additional information.';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${headerColor}; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; }
          .button { display: inline-block; padding: 10px 20px; background-color: ${headerColor}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <p>${message}</p>
            ${reason ? `<p><strong>Note:</strong> ${reason}</p>` : ''}
            ${approved ? `
              <p>You can now:</p>
              <ul>
                <li>List your products on the marketplace</li>
                <li>Manage your inventory and license keys</li>
                <li>Track your sales and earnings</li>
                <li>Request payouts</li>
              </ul>
              <a href="${process.env.FRONTEND_URL}/seller/dashboard" class="button">Go to Dashboard</a>
            ` : `
              <p>Please contact support for more information.</p>
            `}
          </div>
          <div class="footer">
            <p>Thank you for choosing Fail.ac.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `${message} ${reason || ''}`
    });
  }

  async sendPayoutNotification(email, amount, transactionId, status) {
    const headerColor = status === 'completed' ? '#4CAF50' : '#ff9800';
    const statusText = status === 'completed' ? 'Payout Completed' : 'Payout Processing';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${headerColor}; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; }
          .payout-details { background-color: white; padding: 20px; margin-top: 20px; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusText}</h1>
          </div>
          <div class="content">
            <div class="payout-details">
              <h2>Payout Details</h2>
              <p><strong>Amount:</strong> ${amount} LTC</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Status:</strong> ${status}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              ${status === 'completed' ? 
                '<p>The funds have been sent to your registered Litecoin address.</p>' :
                '<p>Your payout is being processed and will be sent to your registered Litecoin address shortly.</p>'
              }
            </div>
          </div>
          <div class="footer">
            <p>Thank you for using Fail.ac.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `${statusText} - ${amount} LTC`,
      html,
      text: `${statusText}: ${amount} LTC, Transaction ID: ${transactionId}`
    });
  }

  async sendProductApprovalNotification(email, productName, approvalStatus, reason) {
    const approved = approvalStatus === 'approved';
    const subject = approved ? 'Product Approved' : 'Product Rejected';
    const headerColor = approved ? '#4CAF50' : '#f44336';
    const message = approved 
      ? `Your product "${productName}" has been approved and is now live on the marketplace!`
      : `Your product "${productName}" has been rejected.`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${headerColor}; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; }
          .product-details { background-color: white; padding: 20px; margin-top: 20px; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background-color: ${headerColor}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <div class="product-details">
              <p>${message}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              ${approved ? `
                <p>Your product is now:</p>
                <ul>
                  <li>Visible to all buyers on the marketplace</li>
                  <li>Available for purchase</li>
                  <li>Searchable in the marketplace</li>
                </ul>
                <a href="${process.env.FRONTEND_URL}/seller/dashboard" class="button">View in Dashboard</a>
              ` : `
                <p>Please review the reason above and make necessary changes before resubmitting.</p>
                <p>If you have questions, please contact our support team.</p>
              `}
            </div>
          </div>
          <div class="footer">
            <p>Thank you for using Fail.ac.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `${subject} - ${productName}`,
      html,
      text: `${message} ${reason || ''}`
    });
  }
}

module.exports = new EmailService();
