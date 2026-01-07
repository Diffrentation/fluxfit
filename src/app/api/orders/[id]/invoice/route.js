import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/order.model";
import { authenticateUser } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/orders/:id/invoice
 * Download invoice (PDF/HTML)
 *
 * Query Parameters:
 * - format: Response format - "html" (default) or "json"
 */
export async function GET(request, { params }) {
  try {
    // Authenticate user
    const { error, user } = await authenticateUser(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get order ID or order number from params
    const { id } = params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID or order number is required",
          errors: [
            {
              field: "id",
              message: "Order ID or order number is required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "html";

    // Build query - try as ObjectId first, then as order number
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, user: user._id };
    } else {
      query = { orderNumber: id, user: user._id };
    }

    // Find order
    const order = await Order.findOne(query)
      .populate("items.product", "name slug images")
      .populate("user", "firstname lastname email phone")
      .lean();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Generate invoice number if not exists
    let invoiceNumber = order.invoice?.number;
    if (!invoiceNumber) {
      invoiceNumber = `INV-${order.orderNumber}`;
    }

    // Format invoice data
    const invoiceData = {
      invoiceNumber: invoiceNumber,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customer: {
        name: `${order.user.firstname} ${order.user.lastname}`,
        email: order.user.email,
        phone: order.user.phone || null,
      },
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      items: order.items.map((item) => ({
        productName: item.productName,
        variant: item.variant,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice || null,
        discount: item.discount || 0,
        total: item.total,
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      coupon: order.coupon.code
        ? {
            code: order.coupon.code,
            discount: order.coupon.discount,
            type: order.coupon.type,
          }
        : null,
      shipping: {
        method: order.shipping.method,
        cost: order.shipping.cost,
      },
      tax: {
        gst: order.tax.gst || 0,
        total: order.tax.total || 0,
      },
      total: order.total,
      payment: {
        method: order.payment.method,
        status: order.payment.status,
        transactionId: order.payment.transactionId || null,
        paidAt: order.payment.paidAt || null,
      },
    };

    // Return JSON format if requested
    if (format === "json") {
      return NextResponse.json(
        {
          success: true,
          message: "Invoice retrieved successfully",
          data: {
            invoice: invoiceData,
          },
        },
        { status: 200 }
      );
    }

    // Generate HTML invoice
    const htmlInvoice = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${invoiceData.orderNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        .company-info h1 {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-info h2 {
            font-size: 24px;
            color: #333;
            margin-bottom: 10px;
        }
        .invoice-info p {
            margin: 5px 0;
            color: #666;
        }
        .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        .section h3 {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
        }
        .section p {
            margin: 5px 0;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            margin-top: 20px;
            margin-left: auto;
            width: 300px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
        }
        .totals-row.total {
            font-size: 20px;
            font-weight: bold;
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
            padding: 15px 0;
            margin-top: 10px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid {
            background: #d4edda;
            color: #155724;
        }
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <h1>FluxFit</h1>
                <p>Your Fashion Destination</p>
            </div>
            <div class="invoice-info">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
                <p><strong>Order #:</strong> ${invoiceData.orderNumber}</p>
                <p><strong>Date:</strong> ${new Date(
                  invoiceData.orderDate
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
            </div>
        </div>

        <div class="details">
            <div class="section">
                <h3>Bill To</h3>
                <p><strong>${invoiceData.billingAddress.name}</strong></p>
                <p>${invoiceData.billingAddress.addressLine1}</p>
                ${
                  invoiceData.billingAddress.addressLine2
                    ? `<p>${invoiceData.billingAddress.addressLine2}</p>`
                    : ""
                }
                <p>${invoiceData.billingAddress.city}, ${
      invoiceData.billingAddress.state
    } ${invoiceData.billingAddress.pincode}</p>
                <p>${invoiceData.billingAddress.country}</p>
                <p>Phone: ${invoiceData.billingAddress.phone}</p>
            </div>
            <div class="section">
                <h3>Ship To</h3>
                <p><strong>${invoiceData.shippingAddress.name}</strong></p>
                <p>${invoiceData.shippingAddress.addressLine1}</p>
                ${
                  invoiceData.shippingAddress.addressLine2
                    ? `<p>${invoiceData.shippingAddress.addressLine2}</p>`
                    : ""
                }
                <p>${invoiceData.shippingAddress.city}, ${
      invoiceData.shippingAddress.state
    } ${invoiceData.shippingAddress.pincode}</p>
                <p>${invoiceData.shippingAddress.country}</p>
                <p>Phone: ${invoiceData.shippingAddress.phone}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Variant</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoiceData.items
                  .map(
                    (item) => `
                <tr>
                    <td>
                        <strong>${item.productName}</strong>
                        ${
                          item.originalPrice && item.originalPrice > item.price
                            ? `<br><small style="color: #999;">Original: ₹${item.originalPrice.toLocaleString()}</small>`
                            : ""
                        }
                    </td>
                    <td>
                        ${
                          item.variant.size || item.variant.color
                            ? `${item.variant.size || ""} ${
                                item.variant.color || ""
                              }`.trim()
                            : "N/A"
                        }
                    </td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">₹${item.price.toLocaleString()}</td>
                    <td class="text-right">₹${item.total.toLocaleString()}</td>
                </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>Subtotal:</span>
                <span>₹${invoiceData.subtotal.toLocaleString()}</span>
            </div>
            ${
              invoiceData.discount > 0
                ? `
            <div class="totals-row">
                <span>Discount${
                  invoiceData.coupon ? ` (${invoiceData.coupon.code})` : ""
                }:</span>
                <span>-₹${invoiceData.discount.toLocaleString()}</span>
            </div>
            `
                : ""
            }
            <div class="totals-row">
                <span>Shipping:</span>
                <span>₹${invoiceData.shipping.cost.toLocaleString()}</span>
            </div>
            ${
              invoiceData.tax.total > 0
                ? `
            <div class="totals-row">
                <span>Tax (GST):</span>
                <span>₹${invoiceData.tax.total.toLocaleString()}</span>
            </div>
            `
                : ""
            }
            <div class="totals-row total">
                <span>Total:</span>
                <span>₹${invoiceData.total.toLocaleString()}</span>
            </div>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
            <p><strong>Payment Method:</strong> ${invoiceData.payment.method.toUpperCase()}</p>
            <p><strong>Payment Status:</strong> 
                <span class="status-badge ${
                  invoiceData.payment.status === "completed"
                    ? "status-paid"
                    : "status-pending"
                }">
                    ${invoiceData.payment.status}
                </span>
            </p>
            ${
              invoiceData.payment.transactionId
                ? `<p><strong>Transaction ID:</strong> ${invoiceData.payment.transactionId}</p>`
                : ""
            }
            ${
              invoiceData.payment.paidAt
                ? `<p><strong>Paid At:</strong> ${new Date(
                    invoiceData.payment.paidAt
                  ).toLocaleString()}</p>`
                : ""
            }
        </div>

        <div class="footer">
            <p>Thank you for your business!</p>
            <p style="margin-top: 10px;">This is a computer-generated invoice and does not require a signature.</p>
        </div>
    </div>
</body>
</html>
    `;

    // Return HTML invoice
    return new NextResponse(htmlInvoice, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="invoice-${invoiceData.orderNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Get invoice error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to retrieve invoice. Please try again.",
      },
      { status: 500 }
    );
  }
}
