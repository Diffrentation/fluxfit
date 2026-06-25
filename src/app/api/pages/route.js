import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Page from "@/models/page.model";

export async function GET() {
  try {
    await connectDB();
    const pages = await Page.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
