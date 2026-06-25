import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Settings from "@/models/settings.model";
import { authenticateAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const adminCheck = await authenticateAdmin(request);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const settings = await Settings.updateSettings(body);
    
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
