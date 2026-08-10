import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Page from "@/models/page.model";
import { authenticateAdmin } from "@/lib/auth";
import slugify from "slugify";

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
    const { error } = await authenticateAdmin(request);
    if (error) return error;

    const { slug: rawSlug } = await params;
    const slug = slugify(rawSlug, { lower: true, strict: true });
    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Slug must contain at least one letter or number" },
        { status: 400 }
      );
    }
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
