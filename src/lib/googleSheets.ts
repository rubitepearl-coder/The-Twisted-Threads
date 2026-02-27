/**
 * Google Apps Script Backend Client
 * 
 * This module provides functions to communicate with your Google Apps Script
 * external backend for order and inventory management in Google Sheets.
 * 
 * Setup: See google-apps-script/SETUP.md for instructions
 */

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

/**
 * Send an order to Google Sheets via Google Apps Script
 * 
 * @param order - The order data to save
 * @returns Promise<{ success: boolean; orderId?: number; error?: string }>
 */
export async function sendOrderToGoogleSheets(order: {
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  orderType: string;
  bouquetItems: string;
  miniPotItems: string;
  potId?: number | null;
  potName?: string | null;
  wrapperColorId?: number | null;
  wrapperColorName?: string | null;
  totalPrice: number;
  status: string;
}): Promise<{ success: boolean; orderId?: number; error?: string }> {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn("Google Apps Script URL not configured - skipping external sync");
    return { success: false, error: "Google Apps Script not configured" };
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "createOrder",
        order: order,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to send order to Google Sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update inventory in Google Sheets
 * 
 * @param items - Array of items with productId and stockQuantity
 * @returns Promise<{ success: boolean; updated?: number[]; error?: string }>
 */
export async function updateInventoryInGoogleSheets(
  items: Array<{ productId: number; stockQuantity: number }>
): Promise<{ success: boolean; updated?: number[]; error?: string }> {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn("Google Apps Script URL not configured - skipping inventory sync");
    return { success: false, error: "Google Apps Script not configured" };
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "updateInventory",
        items: items,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to update inventory in Google Sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get current inventory from Google Sheets
 * 
 * @returns Promise<{ success: boolean; inventory?: any[]; error?: string }>
 */
export async function getInventoryFromGoogleSheets(): Promise<{
  success: boolean;
  inventory?: Array<{
    ProductID: number;
    ProductName: string;
    Category: string;
    Price: number;
    StockQuantity: number;
    InStock: string;
  }>;
  error?: string;
}> {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn("Google Apps Script URL not configured");
    return { success: false, error: "Google Apps Script not configured" };
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getInventory",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to get inventory from Google Sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if Google Apps Script is configured
 */
export function isGoogleSheetsConfigured(): boolean {
  return !!GOOGLE_APPS_SCRIPT_URL;
}
