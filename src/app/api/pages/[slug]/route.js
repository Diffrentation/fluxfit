import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Page from "@/models/page.model";
import { authenticateAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { slug } = await params;
    
    let page = await Page.findOne({ slug });
    
    if (!page) {
      // Return 404 or a default empty page object depending on your needs.
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const adminCheck = await authenticateAdmin(request);
    if (adminCheck) return adminCheck;

    const { slug } = await params;
    const body = await request.json();

    let page = await Page.findOne({ slug });
    
    if (!page) {
      // Create if it doesn't exist
      page = await Page.create({
        slug,
        title: body.title || slug,
        data: body.data || {}
      });
    } else {
      // Update
      if (body.title) page.title = body.title;
      if (body.data) page.data = body.data;
      await page.save();
    }

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// cache bust 2
