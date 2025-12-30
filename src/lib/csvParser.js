// CSV parsing utility for bulk product upload

export const parseCSV = (csvText) => {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV file must have at least a header and one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      continue;
    }

    const product = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || "";
      
      // Map CSV headers to product fields
      switch (header) {
        case "product name":
        case "name":
          product.name = value;
          break;
        case "price":
          product.price = parseFloat(value) || 0;
          break;
        case "original price":
        case "originalprice":
          product.originalPrice = parseFloat(value) || undefined;
          break;
        case "category":
          product.category = value;
          break;
        case "color":
          product.color = value;
          break;
        case "size":
          product.size = value;
          break;
        case "stock":
        case "quantity":
          product.stock = parseInt(value) || 0;
          break;
        case "description":
          product.description = value;
          break;
        case "images":
        case "image":
          product.image = value;
          break;
        case "meta title":
        case "metatitle":
          product.metaTitle = value;
          break;
        case "slug":
          product.slug = value;
          break;
        default:
          product[header] = value;
      }
    });

    // Generate missing fields
    if (!product.slug && product.name) {
      product.slug = product.name.toLowerCase().replace(/\s+/g, "-");
    }
    if (!product.metaTitle && product.name) {
      product.metaTitle = product.name;
    }
    if (!product.status) {
      product.status = "pending";
    }

    products.push(product);
  }

  return products;
};

// Parse a single CSV line, handling quoted values
const parseCSVLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);
  return values;
};

export const validateProductData = (product) => {
  const errors = [];

  if (!product.name || product.name.trim() === "") {
    errors.push("Product name is required");
  }

  if (!product.price || isNaN(product.price) || product.price <= 0) {
    errors.push("Valid price is required");
  }

  if (!product.category || product.category.trim() === "") {
    errors.push("Category is required");
  }

  if (product.stock === undefined || isNaN(product.stock) || product.stock < 0) {
    errors.push("Valid stock quantity is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateBulkProducts = (products) => {
  const results = {
    valid: [],
    invalid: [],
    total: products.length,
  };

  products.forEach((product, index) => {
    const validation = validateProductData(product);
    if (validation.isValid) {
      results.valid.push(product);
    } else {
      results.invalid.push({
        index: index + 2, // +2 because index 0 is header, and we start from 1
        product,
        errors: validation.errors,
      });
    }
  });

  return results;
};

