const nodemailer = require('nodemailer');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) env[key.trim()] = values.join('=').trim();
});

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - FluxFit</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">FluxFit</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Order Confirmation</h2>
        <p>Hello Customer,</p>
        <p>Thank you for your order! We are processing it and will ship it out soon.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
          <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> #12345</p>
          <p style="margin: 0 0 10px 0;"><strong>Date:</strong> Today</p>
          <p style="margin: 0; font-size: 18px;"><strong>Total Amount:</strong> ₹1000</p>
        </div>
        
        <p>You can track your order status in your account dashboard.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="http://localhost:3000/dashboard/orders/12345" style="background: #667eea; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; display: inline-block;">View Order</a>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
`;

transporter.sendMail({
  from: 'bbhupender100@gmail.com',
  to: 'singhashish1361@gmail.com',
  subject: 'Test HTML Order Confirmation - FluxFit',
  html: html
}).then((info) => {
  console.log('✅ Email sent:', info.messageId);
}).catch((err) => {
  console.error('❌ Failed to send:', err);
});
