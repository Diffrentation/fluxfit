// CSV generation utility for exporting data

/**
 * Convert an array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header objects with 'key' and 'label' properties
 * @returns {string} CSV formatted string
 */
export const generateCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return "";
  }

  // Generate header row
  const headerRow = headers.map((h) => escapeCSVValue(h.label)).join(",");

  // Generate data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = getNestedValue(row, header.key);
        return escapeCSVValue(value);
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
};

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @returns {any} Value at path or empty string
 */
const getNestedValue = (obj, path) => {
  if (!path) return "";
  const keys = path.split(".");
  let value = obj;
  for (const key of keys) {
    if (value === null || value === undefined) return "";
    value = value[key];
  }
  return value === null || value === undefined ? "" : value;
};

/**
 * Escape CSV value (handle commas, quotes, newlines)
 * @param {any} value - Value to escape
 * @returns {string} Escaped CSV value
 */
const escapeCSVValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Generate CSV filename with timestamp
 * @param {string} prefix - Filename prefix
 * @returns {string} Filename with timestamp
 */
export const generateCSVFilename = (prefix = "export") => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `${prefix}-${timestamp}.csv`;
};

