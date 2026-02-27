# Google Apps Script Backend Setup

This guide will help you set up a free external backend using Google Apps Script to save your orders and inventory to Google Sheets.

## Why This Approach?

- ✅ **Free** - No Google Cloud billing required
- ✅ **External** - Data is stored in Google Sheets (not your SQLite database)
- ✅ **Real-time** - Orders appear instantly in your sheet
- ✅ **Inventory tracking** - Keep stock levels synced

---

## Step 1: Create Your Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Rename the first sheet to: **Orders**
3. Add a second sheet and rename it to: **Inventory**
4. Set up the column headers:

### Orders Sheet (Row 1)
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| OrderID | Date | CustomerName | CustomerEmail | CustomerAddress | OrderType | Items | TotalPrice | Status |

### Inventory Sheet (Row 1)
| A | B | C | D | E | F |
|---|---|---|---|---|---|---
| ProductID | ProductName | Category | Price | StockQuantity | InStock |

---

## Step 2: Create the Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Delete any existing code in the editor
4. Open the file `google-apps-script/backend.gs` in this project
5. Copy ALL the code from that file
6. Paste it into the Google Apps Script editor
7. Click the **Save** icon (or press Ctrl+S)
8. Name your project "Petal Loop Backend"

---

## Step 3: Deploy as Web App

1. Click the blue **Deploy** button (top right)
2. Select **New deployment**
3. Click the gear icon next to "Select type" and choose **Web app**
4. Fill in the details:
   - **Description**: "Petal Loop Order Backend"
   - **Execute as**: Select **Me** (your email)
   - **Who has access**: Select **Anyone** (IMPORTANT! This allows your website to write)
5. Click **Deploy**
6. Copy the **Web App URL** shown (it will look like: `https://script.google.com/macros/s/XXXXXXXXXXXX/exec`)

---

## Step 4: Configure Your Environment

1. Open your project in the code editor
2. Create or update the `.env.local` file in the project root
3. Add your Google Apps Script URL:

```env
# Google Apps Script External Backend
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Replace `YOUR_DEPLOYMENT_ID` with the actual ID from your Web App URL.

---

## Step 5: Test the Integration

1. Restart your development server
2. Place a test order through your bouquet builder or shop
3. Check your Google Sheet - the order should appear in the Orders tab!

---

## How It Works

When a customer places an order:
1. Your website saves the order to the local SQLite database (existing behavior)
2. The order is ALSO sent to your Google Apps Script backend
3. The Apps Script writes the order to your Google Sheet
4. You get real-time order notifications in your spreadsheet!

---

## Troubleshooting

### "Anyone has access" not working
Make sure you selected "Anyone" (not "Only myself") when deploying. Re-deploy if needed.

### Orders not appearing
- Check the Google Apps Script execution log (View > Executions)
- Verify the `.env.local` has the correct URL
- Make sure your sheet names match exactly: "Orders" and "Inventory"

### Want to update inventory?
You can use the inventory sync feature. Contact me if you need help setting that up!

---

## Security Note

The "Anyone" access means anyone with the URL can submit orders. This is fine for a public order form. However:
- Don't share the URL publicly (only use in your backend code)
- The URL contains a unique ID that's hard to guess
- Orders can only be added, not deleted or modified through this endpoint
