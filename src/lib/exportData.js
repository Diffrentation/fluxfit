/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 */
export const exportToCSV = (data, filename = "export") => {
  if (!data || data.length === 0) {
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to Excel format (CSV with .xlsx extension)
 * For full Excel support, you would need a library like xlsx
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 */
export const exportToExcel = (data, filename = "export") => {
  // For now, we'll export as CSV but with .xlsx extension
  // In production, use a library like 'xlsx' for proper Excel format
  if (!data || data.length === 0) {
    return;
  }

  const headers = Object.keys(data[0]);
  
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Prepare sales data for export
 */
export const prepareSalesData = (orders) => {
  return orders.map((order) => ({
    "Order ID": order.orderId,
    "Order Date": new Date(order.orderDate).toLocaleString(),
    "Status": order.status,
    "Total Amount": order.orderSummary?.grandTotal || 0,
    "Subtotal": order.orderSummary?.subtotal || 0,
    "Discount": order.orderSummary?.discount || 0,
    "Shipping": order.orderSummary?.shipping || 0,
    "Tax": order.orderSummary?.tax || 0,
    "Payment Method": order.paymentMethod,
    "Items Count": order.items.length,
  }));
};

/**
 * Prepare orders data for export
 */
export const prepareOrdersData = (orders) => {
  const exportData = [];
  
  orders.forEach((order) => {
    order.items.forEach((item) => {
      exportData.push({
        "Order ID": order.orderId,
        "Order Date": new Date(order.orderDate).toLocaleString(),
        "Product Name": item.name,
        "Product ID": item.id,
        "Size": item.size || "One Size",
        "Color": item.color || "N/A",
        "Quantity": item.quantity,
        "Unit Price": item.price,
        "Total Price": parseFloat(item.price) * item.quantity,
        "Status": order.status,
      });
    });
  });
  
  return exportData;
};

/**
 * Prepare products data for export
 */
export const prepareProductsData = (orders) => {
  const productSales = {};
  
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.id;
      if (!productSales[key]) {
        productSales[key] = {
          "Product ID": item.id,
          "Product Name": item.name,
          "Total Quantity Sold": 0,
          "Total Revenue": 0,
          "Number of Orders": 0,
        };
      }
      productSales[key]["Total Quantity Sold"] += item.quantity;
      productSales[key]["Total Revenue"] += parseFloat(item.price) * item.quantity;
      productSales[key]["Number of Orders"] += 1;
    });
  });
  
  return Object.values(productSales).sort(
    (a, b) => b["Total Quantity Sold"] - a["Total Quantity Sold"]
  );
};
