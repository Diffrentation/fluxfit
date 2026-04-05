import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact from "@/models/contact.model";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeString(v, max) {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

/**
 * POST /api/contact — public: submit support / contact message
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = sanitizeString(body.name, 120);
    const email = sanitizeString(body.email, 200).toLowerCase();
    const phone = sanitizeString(body.phone || "", 40);
    const subject = sanitizeString(body.subject, 200);
    const message = sanitizeString(body.message, 10000);

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, message: "Please enter your name (at least 2 characters)." },
        { status: 400 }
      );
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (phone && !/^[\d\s+().-]{7,40}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid phone number or leave it blank." },
        { status: 400 }
      );
    }
    if (!subject || subject.length < 2) {
      return NextResponse.json(
        { success: false, message: "Please enter a subject." },
        { status: 400 }
      );
    }
    if (!message || message.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a message (at least 10 characters).",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const doc = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thanks! We received your message and will get back to you soon.",
        data: { id: doc._id.toString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/contact:", error);
    return NextResponse.json(
      { success: false, message: "Could not send your message. Please try again." },
      { status: 500 }
    );
  }
}
