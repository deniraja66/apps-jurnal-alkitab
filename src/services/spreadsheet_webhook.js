/**
 * Google Apps Script Webhook for Bible Journal Anak
 * This script receives data from the Bible Journal app and appends it to a Google Sheet.
 * 
 * Deployment Instructions:
 * 1. Open a Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any existing code and paste this script.
 * 4. Click 'Deploy' > 'New Deployment'.
 * 5. Select type 'Web App'.
 * 6. Set 'Execute as' to 'Me' and 'Who has access' to 'Anyone'.
 * 7. Copy the Web App URL and add it to your .env file as VITE_SPREADSHEET_WEBHOOK_URL.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Check if headers exist, if not create them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Nama User', 'Hari ke-', 'Tanggal', 'Scripture (Ayat)', 'Observation (Observasi)', 'Application (Aplikasi)', 'Prayer (Doa)', 'Timestamp']);
      // Format headers
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f3f3');
    }
    
    // Append data
    sheet.appendRow([
      data.userName,
      data.day,
      data.date,
      data.scripture,
      data.observation,
      data.application,
      data.prayer,
      new Date()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
