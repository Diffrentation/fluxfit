import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ShippingRule from "@/models/shippingrule.model";
import { authenticateAdmin } from "@/lib/auth";

/**
 * GET /api/admin/settings/shipping-rules
 * Get shipping rules list
 * 
 * Query Parameters:
 * - isActive: Filter by active status - "true", "false" (optional)
 * - type: Filter by shipping type - "flat", "weight", "distance", "price" (optional)
 * - sort: Sort order - "newest" (default), "oldest", "sortOrder", "name-asc", "name-desc"
 */
export async function GET(request) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "newest";

    // Build query
    const query = {};

    if (isActive === "true") {
      query.isActive = true;
    } else if (isActive === "false") {
      query.isActive = false;
    }

    if (type) {
      const validTypes = ["flat", "weight", "distance", "price"];
      if (validTypes.includes(type)) {
        query.type = type;
      }
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "oldest":
        sortObj.createdAt = 1;
        break;
      case "sortOrder":
        sortObj.sortOrder = 1;
        sortObj.createdAt = -1;
        break;
      case "name-asc":
        sortObj.name = 1;
        break;
      case "name-desc":
        sortObj.name = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
        break;
    }

    // Get shipping rules
    const shippingRules = await ShippingRule.find(query).sort(sortObj).lean();

    // Format shipping rules
    const formattedRules = shippingRules.map((rule) => ({
      id: rule._id,
      name: rule.name,
      description: rule.description || null,
      type: rule.type,
      zones: rule.zones || [],
      basePrice: rule.basePrice,
      freeShippingThreshold: rule.freeShippingThreshold || null,
      rules: rule.rules || [],
      estimatedDays: {
        min: rule.estimatedDays?.min || 3,
        max: rule.estimatedDays?.max || 7,
      },
      isActive: rule.isActive,
      sortOrder: rule.sortOrder || 0,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }));

    // Return response
    return NextResponse.json(
      {
        success: true,
        message: "Shipping rules retrieved successfully",
        data: {
          shippingRules: formattedRules,
          count: formattedRules.length,
          filters: {
            isActive: isActive || null,
            type: type || null,
            sort,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get shipping rules error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve shipping rules. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/shipping-rules
 * Add shipping rule
 * 
 * Body Parameters:
 * - name: Shipping rule name (required)
 * - description: Description (optional)
 * - type: Shipping type - "flat", "weight", "distance", "price" (required)
 * - zones: Array of zone objects (optional)
 *   - name: Zone name (required)
 *   - states: Array of state names (optional)
 *   - cities: Array of city names (optional)
 *   - pincodes: Array of pincodes (optional)
 * - basePrice: Base shipping price (required, min: 0)
 * - freeShippingThreshold: Minimum order value for free shipping (optional, min: 0)
 * - rules: Array of rule objects (optional, for weight/distance/price types)
 *   - min: Minimum value (default: 0)
 *   - max: Maximum value (optional)
 *   - price: Shipping price (required, min: 0)
 * - estimatedDays: Estimated delivery days object (optional)
 *   - min: Minimum days (default: 3)
 *   - max: Maximum days (default: 7)
 * - isActive: Active status (default: true)
 * - sortOrder: Sort order (default: 0)
 */
export async function POST(request) {
  try {
    // Authenticate admin
    const { error, user } = await authenticateAdmin(request);
    if (error) {
      return error;
    }

    // Connect to database
    await connectDB();

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

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipping rule name is required",
          errors: [{ field: "name", message: "Shipping rule name is required" }],
        },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipping type is required",
          errors: [{ field: "type", message: "Shipping type is required" }],
        },
        { status: 400 }
      );
    }

    // Validate type
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

    // Validate basePrice
    if (basePrice === undefined || basePrice === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Base price is required",
          errors: [{ field: "basePrice", message: "Base price is required" }],
        },
        { status: 400 }
      );
    }

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

    // Validate freeShippingThreshold if provided
    if (freeShippingThreshold !== undefined && freeShippingThreshold !== null) {
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
    }

    // Validate zones if provided
    if (zones !== undefined && Array.isArray(zones)) {
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
    }

    // Validate rules if provided (for weight/distance/price types)
    if (rules !== undefined && Array.isArray(rules)) {
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

        if (rule.min !== undefined && rule.min !== null) {
          const min = parseFloat(rule.min);
          if (isNaN(min) || min < 0) {
            return NextResponse.json(
              {
                success: false,
                message: `Rule ${i + 1} min must be a number >= 0`,
                errors: [
                  {
                    field: `rules[${i}].min`,
                    message: "Rule min must be a number >= 0",
                  },
                ],
              },
              { status: 400 }
            );
          }
        }

        if (rule.max !== undefined && rule.max !== null) {
          const max = parseFloat(rule.max);
          if (isNaN(max) || max < 0) {
            return NextResponse.json(
              {
                success: false,
                message: `Rule ${i + 1} max must be a number >= 0`,
                errors: [
                  {
                    field: `rules[${i}].max`,
                    message: "Rule max must be a number >= 0",
                  },
                ],
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Validate estimatedDays if provided
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
      }
    }

    // Create shipping rule
    const shippingRuleData = {
      name: name.trim(),
      description: description ? description.trim() : null,
      type: type,
      basePrice: basePriceNum,
      freeShippingThreshold:
        freeShippingThreshold !== undefined && freeShippingThreshold !== null
          ? parseFloat(freeShippingThreshold)
          : null,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
    };

    if (zones && Array.isArray(zones)) {
      shippingRuleData.zones = zones.map((zone) => ({
        name: zone.name.trim(),
        states: zone.states ? zone.states.map((s) => s.trim()) : [],
        cities: zone.cities ? zone.cities.map((c) => c.trim()) : [],
        pincodes: zone.pincodes ? zone.pincodes.map((p) => p.trim()) : [],
      }));
    }

    if (rules && Array.isArray(rules)) {
      shippingRuleData.rules = rules.map((rule) => ({
        min: rule.min !== undefined && rule.min !== null ? parseFloat(rule.min) : 0,
        max: rule.max !== undefined && rule.max !== null ? parseFloat(rule.max) : null,
        price: parseFloat(rule.price),
      }));
    }

    if (estimatedDays) {
      shippingRuleData.estimatedDays = {
        min: estimatedDays.min !== undefined ? parseInt(estimatedDays.min) : 3,
        max: estimatedDays.max !== undefined ? parseInt(estimatedDays.max) : 7,
      };
    }

    const shippingRule = await ShippingRule.create(shippingRuleData);

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
        message: "Shipping rule created successfully",
        data: {
          shippingRule: formattedRule,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create shipping rule error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create shipping rule. Please try again.",
      },
      { status: 500 }
    );
  }
}

