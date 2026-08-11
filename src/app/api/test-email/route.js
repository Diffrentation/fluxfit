import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET(request) {
  try {
    const result = await sendOrderConfirmationEmail("singhashish1361@gmail.com", {
      customerName: "Ashish Singh",
      orderId: "ORD-TEST-123",
      orderDate: new Date().toLocaleDateString(),
      totalAmount: 1346.82,
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Test email failed:", error);
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
