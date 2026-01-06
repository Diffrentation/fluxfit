WWWWWW# Setup Guide - MongoDB, Email, and Cloudinary

This guide explains how to use the MongoDB, Email, and Cloudinary services that have been set up for FluxFit.

## 📋 Prerequisites

All required packages are already installed:

- `mongoose` - MongoDB ODM
- `nodemailer` - Email sending
- `cloudinary` - Image/file upload service

## 🔧 Environment Variables

Make sure your `.env` file contains all the required variables (already set up from `.env copy`):

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
SENDER_EMAIL=...
EMAIL_USER=...
EMAIL_PASS=...
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
```

## 🗄️ MongoDB Setup

### Connection Utility

The MongoDB connection is handled by `src/lib/db.js`. It uses connection caching to prevent multiple connections in development.

### Usage in API Routes

```javascript
import connectDB from "@/lib/db";
import { User } from "@/models";

export async function GET() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Now you can use your models
    const users = await User.find({});

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Test Connection

Visit: `http://localhost:3000/api/test-db`

This will test the MongoDB connection and return a success message if connected.

## 📧 Email Setup

### Email Utility

The email service is located at `src/lib/email.js` and uses Brevo (formerly Sendinblue) SMTP.

### Available Functions

1. **sendEmail** - Generic email sending
2. **sendOTPEmail** - Send OTP verification emails
3. **sendPasswordResetEmail** - Send password reset links
4. **sendOrderConfirmationEmail** - Send order confirmations

### Usage Examples

#### Send OTP Email

```javascript
import { sendOTPEmail } from "@/lib/email";

// In your API route
const result = await sendOTPEmail(
  "user@example.com",
  "123456",
  "email-verification"
);

if (result.success) {
  console.log("OTP email sent successfully!");
} else {
  console.error("Failed to send email:", result.error);
}
```

#### Send Custom Email

```javascript
import { sendEmail } from "@/lib/email";

const result = await sendEmail({
  to: "user@example.com",
  subject: "Welcome to FluxFit",
  html: "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
});
```

#### Send Password Reset Email

```javascript
import { sendPasswordResetEmail } from "@/lib/email";

const resetLink = `https://yourdomain.com/reset-password?token=${token}`;
const result = await sendPasswordResetEmail("user@example.com", resetLink);
```

## ☁️ Cloudinary Setup

### Cloudinary Utility

The Cloudinary service is located at `src/lib/cloudinary.js` and is configured with your credentials.

### Available Functions

1. **uploadToCloudinary** - Upload single file (server-side)
2. **uploadMultipleToCloudinary** - Upload multiple files
3. **deleteFromCloudinary** - Delete file from Cloudinary
4. **getCloudinaryUrl** - Generate transformed image URLs
5. **openCloudinaryWidget** - Client-side upload widget

### Usage Examples

#### Server-Side Upload (API Route)

```javascript
import { uploadToCloudinary } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder: "fluxfit/products",
      resource_type: "image",
    });

    if (result.success) {
      return NextResponse.json({
        url: result.url,
        public_id: result.public_id,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### Client-Side Upload Widget

First, add the Cloudinary script to your layout:

```javascript
// In src/app/layout.js
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script src="https://upload-widget.cloudinary.com/global/all.js"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Then use it in your component:

```javascript
import { openCloudinaryWidget } from "@/lib/cloudinary";

function UploadButton() {
  const handleUpload = () => {
    openCloudinaryWidget(
      (result) => {
        console.log("Upload successful:", result.secure_url);
        // Handle the uploaded file URL
      },
      {
        folder: "fluxfit/products",
        maxFiles: 5,
      }
    );
  };

  return <button onClick={handleUpload}>Upload Image</button>;
}
```

#### Delete File

```javascript
import { deleteFromCloudinary } from "@/lib/cloudinary";

const result = await deleteFromCloudinary("fluxfit/product_123");
if (result.success) {
  console.log("File deleted successfully");
}
```

#### Generate Transformed URL

```javascript
import { getCloudinaryUrl } from "@/lib/cloudinary";

// Resize image to 300x300
const url = getCloudinaryUrl("fluxfit/product_123", {
  width: 300,
  height: 300,
  crop: "fill",
});
```

## 🧪 Testing

### Test MongoDB Connection

```bash
# Visit in browser or use curl
curl http://localhost:3000/api/test-db
```

### Test Email Sending

Create a test API route:

```javascript
// src/app/api/test-email/route.js
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await sendEmail({
    to: "your-email@example.com",
    subject: "Test Email",
    html: "<h1>This is a test email</h1>",
  });

  return NextResponse.json(result);
}
```

### Test Cloudinary Upload

Use the upload examples above or test via the client-side widget.

## 📝 Notes

1. **MongoDB**: The connection is cached globally to prevent multiple connections in development
2. **Email**: Uses Brevo SMTP. Make sure your credentials are correct in `.env`
3. **Cloudinary**: Images are automatically optimized. Make sure `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set for client-side usage
4. **Next.js Config**: Cloudinary domain (`res.cloudinary.com`) is already added to `next.config.mjs` for image optimization

## 🚀 Next Steps

1. Use `connectDB()` in your API routes before using Mongoose models
2. Integrate email functions into your authentication and order flows
3. Use Cloudinary for product image uploads and management
4. Test all services to ensure they're working correctly

## ❓ Troubleshooting

### MongoDB Connection Issues

- Check if `MONGODB_URI` is correct in `.env`
- Verify MongoDB Atlas network access settings
- Check if the database user has proper permissions

### Email Sending Issues

- Verify `EMAIL_USER` and `EMAIL_PASS` are correct
- Check SMTP settings (Brevo uses `smtp-relay.brevo.com:587`)
- Make sure the sender email is verified in Brevo

### Cloudinary Issues

- Verify all Cloudinary credentials in `.env`
- Check if the Cloudinary account is active
- For client-side widget, ensure the script is loaded in your layout
