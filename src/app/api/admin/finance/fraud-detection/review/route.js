import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FraudAlertReview from "@/models/fraudAlertReview.model";
import { authenticateAdmin } from "@/lib/auth";

const VALID_STATUSES = ["reviewed", "resolved", "false-positive"];

/**
 * POST /api/admin/finance/fraud-detection/review
 * Record an admin's decision on a fraud alert. Alerts themselves aren't a
 * queryable collection (they're computed live from order patterns), so
 * this upserts by the alert's deterministic id string rather than a
 * dynamic [id] route segment.
 *
 * Body Parameters:
 * - alertId: string (required) — e.g. "cancel-<userId>"
 * - status: "reviewed" | "resolved" | "false-positive" (required)
 * - notes: string (optional)
 */
export async function POST(request) {
  try {
    const { error, user: admin } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    await connectDB();

    const body = await request.json();
    const { alertId, status, notes } = body;

    if (!alertId || typeof alertId !== "string") {
      return NextResponse.json(
        { success: false, message: "alertId is required" },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const review = await FraudAlertReview.findOneAndUpdate(
      { alertId },
      {
        alertId,
        status,
        notes: notes || "",
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("reviewedBy", "firstname lastname email");

    return NextResponse.json(
      {
        success: true,
        message: "Fraud alert review saved",
        data: {
          review: {
            alertId: review.alertId,
            status: review.status,
            notes: review.notes,
            reviewedBy: review.reviewedBy
              ? {
                  id: review.reviewedBy._id,
                  name: `${review.reviewedBy.firstname} ${review.reviewedBy.lastname}`,
                }
              : null,
            reviewedAt: review.reviewedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Save fraud alert review error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save fraud alert review. Please try again.",
      },
      { status: 500 }
    );
  }
}
