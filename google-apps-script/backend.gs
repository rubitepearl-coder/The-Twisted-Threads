// ============================================================
// THE PETAL LOOP - GOOGLE APPS SCRIPT BACKEND
// ============================================================
// This script creates a free external backend that saves orders
// and inventory data directly to Google Sheets.
//
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com and create a new project
// 2. Copy ALL the code from this file into the editor
// 3. Save the project (give it a name like "Petal Loop Backend")
// 4. Click Deploy > New Deployment
// 5. Select "Web app" as the type
// 6. Set "Execute as" to "Me"
// 7. Set "Who has access" to "Anyone" (IMPORTANT - this allows your website to write)
// 8. Click Deploy and copy the Web App URL
// 9. Paste that URL in your .env.local file as GOOGLE_APPS_SCRIPT_URL
// 10. Create a Google Sheet with these sheets:
//    - Orders (headers in row 1: OrderID, Date, CustomerName, CustomerEmail, CustomerAddress, OrderType, Items, TotalPrice, Status)
//    - Inventory (headers in row 1: ProductID, ProductName, Category, Price, StockQuantity, InStock)
// ============================================================

// Configuration - Replace with your Sheet names if different
const ORDERS_SHEET_NAME = "Orders";
const INVENTORY_SHEET_NAME = "Inventory";

function doPost(e) {
  try {
    const content = e.postData.contents;
    const data = JSON.parse(content);
    const action = data.action;
    
    if (action === "createOrder") {
      return createOrder(data.order);
    } else if (action === "updateInventory") {
      return updateInventory(data.items);
    } else if (action === "getInventory") {
      return getInventory();
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: "Unknown action" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Health check endpoint
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Create a new order in the Orders sheet
function createOrder(order) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Orders sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Format items for the sheet (convert JSON to readable string)
  let itemsString = "";
  if (order.orderType === "bouquet" && order.bouquetItems) {
    const items = JSON.parse(order.bouquetItems);
    itemsString = items.map(item => `${item.name} x${item.quantity}`).join(", ");
  } else if (order.orderType === "mini_pot" && order.miniPotItems) {
    const items = JSON.parse(order.miniPotItems);
    itemsString = items.map(item => `${item.name} x${item.quantity}`).join(", ");
  } else if (order.orderType === "shop") {
    itemsString = order.potName || "Shop Order";
  }
  
  // Add wrapper color if applicable
  if (order.wrapperColorName) {
    itemsString += ` [Wrapper: ${order.wrapperColorName}]`;
  }
  
  // Get the next order ID
  const lastRow = sheet.getLastRow();
  const orderId = lastRow; // Use row number as order ID (or increment from last)
  
  // Format date
  const date = new Date().toLocaleDateString();
  
  // Append the new row
  sheet.appendRow([
    orderId,
    date,
    order.customerName,
    order.customerEmail,
    order.customerAddress,
    order.orderType,
    itemsString,
    order.totalPrice,
    order.status || "pending"
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, orderId: orderId }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Update inventory in the Inventory sheet
function updateInventory(items) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(INVENTORY_SHEET_NAME);
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Inventory sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find column indices
  const idCol = headers.indexOf("ProductID");
  const nameCol = headers.indexOf("ProductName");
  const stockCol = headers.indexOf("StockQuantity");
  const inStockCol = headers.indexOf("InStock");
  
  if (idCol === -1 || stockCol === -1) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Required columns not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Update each item
  const updated = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const productId = row[idCol];
    
    // Find matching item in the update list
    const updateItem = items.find(item => item.productId === productId);
    if (updateItem) {
      // Update stock quantity
      row[stockCol] = updateItem.stockQuantity;
      if (inStockCol !== -1) {
        row[inStockCol] = updateItem.stockQuantity > 0 ? "TRUE" : "FALSE";
      }
      
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      updated.push(productId);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, updated: updated }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get current inventory from the sheet
function getInventory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(INVENTORY_SHEET_NAME);
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "Inventory sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Convert to array of objects
  const inventory = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j];
    }
    inventory.push(item);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, inventory: inventory }))
    .setMimeType(ContentService.MimeType.JSON);
}
