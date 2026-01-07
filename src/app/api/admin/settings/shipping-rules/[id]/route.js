import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ShippingRule from "@/models/shippingrule.model";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * PUT /api/admin/settings/shipping-rules/:id
 * Update shipping rule
 * 
 * Body Parameters (all optional):
 * - name: Shipping rule name
 * - description: Description
 * - type: Shipping type - "flat", "weight", "distance", "price"
 * - zones: Array of zone objects
 * - basePrice: Base shipping price (min: 0)
 * - freeShippingThreshold: Minimum order value for free shipping (min: 0)
 * - rules: Array of rule objects
 * - estimatedDays: Estimated delivery days object
 * - isActive: Active status
 * - sortOrder: Sort order
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get shipping rule ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid shipping rule ID",
          errors: [{ field: "id", message: "Valid shipping rule ID is required" }],
        },
        { status: 400 }
      );
    }

    // Get shipping rule
    const shippingRule = await ShippingRule.findById(id);
    if (!shippingRule) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipping rule not found",
        },
        { status: 404 }
      );
    }

    // Get body
    const body = await request.json();
    const {
      name,
      description,
      type,
      zones,
      basePrice,
      freeShippingThreshold,
      rules,
      estimatedDays,
      isActive,
      sortOrder,
    } = body;

    // Update name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Shipping rule name cannot be empty",
            errors: [{ field: "name", message: "Shipping rule name is required" }],
          },
          { status: 400 }
        );
      }
      shippingRule.name = name.trim();
    }

    // Update description if provided
    if (description !== undefined) {
      shippingRule.description = description ? description.trim() : null;
    }

    // Update type if provided
    if (type !== undefined) {
      const validTypes = ["flat", "weight", "distance", "price"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid shipping type. Must be one of: ${validTypes.join(", ")}`,
            errors: [
              {
                field: "type",
                message: `Shipping type must be one of: ${validTypes.join(", ")}`,
              },
            ],
          },
          { status: 400 }
        );
      }
      shippingRule.type = type;
    }

    // Update basePrice if provided
    if (basePrice !== undefined) {
      const basePriceNum = parseFloat(basePrice);
      if (isNaN(basePriceNum) || basePriceNum < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Base price must be a number greater than or equal to 0",
            errors: [
              {
                field: "basePrice",
                message: "Base price must be a number >= 0",
              },
            ],
          },
          { status: 400 }
        );
      }
      shippingRule.basePrice = basePriceNum;
    }

    // Update freeShippingThreshold if provided
    if (freeShippingThreshold !== undefined) {
      if (freeShippingThreshold === null) {
        shippingRule.freeShippingThreshold = null;
      } else {
        const threshold = parseFloat(freeShippingThreshold);
        if (isNaN(threshold) || threshold < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Free shipping threshold must be a number greater than or equal to 0",
              errors: [
                {
                  field: "freeShippingThreshold",
                  message: "Free shipping threshold must be a number >= 0",
                },
              ],
            },
            { status: 400 }
          );
        }
        shippingRule.freeShippingThreshold = threshold;
      }
    }

    // Update zones if provided
    if (zones !== undefined) {
      if (Array.isArray(zones)) {
        for (let i = 0; i < zones.length; i++) {
          const zone = zones[i];
          if (!zone.name || !zone.name.trim()) {
            return NextResponse.json(
              {
                success: false,
                message: `Zone ${i + 1} name is required`,
                errors: [
                  {
                    field: `zones[${i}].name`,
                    message: "Zone name is required",
                  },
                ],
              },
              { status: 400 }
            );
          }
        }
        shippingRule.zones = zones.map((zone) => ({
          name: zone.name.trim(),
          states: zone.states ? zone.states.map((s) => s.trim()) : [],
          cities: zone.cities ? zone.cities.map((c) => c.trim()) : [],
          pincodes: zone.pincodes ? zone.pincodes.map((p) => p.trim()) : [],
        }));
      } else {
        shippingRule.zones = [];
      }
    }

    // Update rules if provided
    if (rules !== undefined) {
      if (Array.isArray(rules)) {
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i];
          if (rule.price === undefined || rule.price === null) {
            return NextResponse.json(
              {
                success: false,
                message: `Rule ${i + 1} price is required`,
                errors: [
                  {
                    field: `rules[${i}].price`,
                    message: "Rule price is required",
                  },
                ],
              },
              { status: 400 }
            );
          }

          const price = parseFloat(rule.price);
          if (isNaN(price) || price < 0) {
            return NextResponse.json(
              {
                success: false,
                message: `Rule ${i + 1} price must be a number >= 0`,
                errors: [
                  {
                    field: `rules[${i}].price`,
                    message: "Rule price must be a number >= 0",
                  },
                ],
              },
              { status: 400 }
            );
          }
        }
        shippingRule.rules = rules.map((rule) => ({
          min: rule.min !== undefined && rule.min !== null ? parseFloat(rule.min) : 0,
          max: rule.max !== undefined && rule.max !== null ? parseFloat(rule.max) : null,
          price: parseFloat(rule.price),
        }));
      } else {
        shippingRule.rules = [];
      }
    }

    // Update estimatedDays if provided
    if (estimatedDays !== undefined) {
      if (estimatedDays.min !== undefined) {
        const min = parseInt(estimatedDays.min);
        if (isNaN(min) || min < 1) {
          return NextResponse.json(
            {
              success: false,
              message: "Estimated days min must be a number >= 1",
              errors: [
                {
                  field: "estimatedDays.min",
                  message: "Estimated days min must be a number >= 1",
                },
              ],
            },
            { status: 400 }
          );
        }
        shippingRule.estimatedDays.min = min;
      }

      if (estimatedDays.max !== undefined) {
        const max = parseInt(estimatedDays.max);
        if (isNaN(max) || max < 1) {
          return NextResponse.json(
            {
              success: false,
              message: "Estimated days max must be a number >= 1",
              errors: [
                {
                  field: "estimatedDays.max",
                  message: "Estimated days max must be a number >= 1",
                },
              ],
            },
            { status: 400 }
          );
        }
        shippingRule.estimatedDays.max = max;
      }
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isActive must be a boolean",
            errors: [
              {
                field: "isActive",
                message: "isActive must be true or false",
              },
            ],
          },
          { status: 400 }
        );
      }
      shippingRule.isActive = isActive;
    }

    // Update sortOrder if provided
    if (sortOrder !== undefined) {
      const order = parseInt(sortOrder);
      if (isNaN(order)) {
        return NextResponse.json(
          {
            success: false,
            message: "Sort order must be a number",
            errors: [
              {
                field: "sortOrder",
                message: "Sort order must be a number",
              },
            ],
          },
          { status: 400 }
        );
      }
      shippingRule.sortOrder = order;
    }

    // Save shipping rule
    await shippingRule.save();

    // Format shipping rule
    const formattedRule = {
      id: shippingRule._id,
      name: shippingRule.name,
      description: shippingRule.description || null,
      type: shippingRule.type,
      zones: shippingRule.zones || [],
      basePrice: shippingRule.basePrice,
      freeShippingThreshold: shippingRule.freeShippingThreshold || null,
      rules: shippingRule.rules || [],
      estimatedDays: {
        min: shippingRule.estimatedDays?.min || 3,
        max: shippingRule.estimatedDays?.max || 7,
      },
      isActive: shippingRule.isActive,
      sortOrder: shippingRule.sortOrder || 0,
      createdAt: shippingRule.createdAt,
      updatedAt: shippingRule.updatedAt,
    };

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Shipping rule updated successfully",
        data: {
          shippingRule: formattedRule,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update shipping rule error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update shipping rule. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/shipping-rules/:id
 * Delete shipping rule
 */
export async function DELETE(request, { params }) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get shipping rule ID
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid shipping rule ID",
          errors: [{ field: "id", message: "Valid shipping rule ID is required" }],
        },
        { status: 400 }
      );
    }

    // Get shipping rule
    const shippingRule = await ShippingRule.findById(id);
    if (!shippingRule) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipping rule not found",
        },
        { status: 404 }
      );
    }

    // Store shipping rule info before deletion
    const shippingRuleInfo = {
      id: shippingRule._id,
      name: shippingRule.name,
      type: shippingRule.type,
      basePrice: shippingRule.basePrice,
    };

    // Delete shipping rule
    await ShippingRule.findByIdAndDelete(id);

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Shipping rule deleted successfully",
        data: {
          deletedShippingRule: shippingRuleInfo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete shipping rule error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete shipping rule. Please try again.",
      },
      { status: 500 }
    );
  }
}

