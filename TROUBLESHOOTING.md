# Leave Management System - Troubleshooting Guide

This guide helps resolve common issues when setting up and using the leave management system.

## 🚨 Common Errors and Solutions

### 1. JSON Parse Error: Cannot read properties of undefined (reading 'postData')

**Error Message:**
```
JSON Parse Error: TypeError: Cannot read properties of undefined (reading 'postData')
```

**Cause:**
This error occurs in Google Apps Script when the `doPost` function receives an invalid or empty request object.

**Common Reasons:**
- Google Apps Script deployment is not configured correctly
- The web app is not deployed with proper permissions
- The request is not reaching the Apps Script endpoint
- CORS issues preventing proper data transmission

**Solutions:**

#### Step 1: Verify Apps Script Deployment
1. Open your Google Apps Script project
2. Click "Deploy" → "Manage deployments"
3. Ensure the deployment is configured as:
   - **Type**: Web app
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone (for form submissions)
4. If not configured correctly, create a new deployment

#### Step 2: Test the Apps Script Functions
1. In Apps Script editor, run the `testSetup()` function
2. Check the execution log for any errors
3. Run the `testPostRequest()` function to simulate a form submission
4. Run the `testGetRequest()` function to test data retrieval

#### Step 3: Update Configuration
1. In the Apps Script, update the `CONFIG` object with your actual values:
   ```javascript
   const CONFIG = {
     SHEET_ID: 'your_actual_google_sheet_id',
     CALENDAR_ID: 'your_actual_calendar_id@group.calendar.google.com',
     HOD_EMAIL: 'actual_hod@yourcompany.com',
     HR_EMAIL: 'actual_hr@yourcompany.com',
     COMPANY_NAME: 'Your Actual Company Name',
     COMPANY_DOMAIN: 'yourcompany.com',
     SHEET_NAME: 'LeaveRequests'
   };
   ```

#### Step 4: Update Web App URLs
1. Copy the correct deployment URL from Apps Script
2. Update `src/app/page.tsx`:
   ```javascript
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_DEPLOYMENT_ID/exec";
   ```
3. Update `src/app/api/leave-requests/route.ts`:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ACTUAL_DEPLOYMENT_ID/exec';
   ```

### 2. CORS (Cross-Origin Resource Sharing) Issues

**Error Message:**
```
Access to fetch at 'https://script.google.com/...' from origin 'http://localhost:8000' has been blocked by CORS policy
```

**Solution:**
This is expected behavior. The current implementation uses `mode: 'no-cors'` in the fetch request, which means:
- The request will be sent but the response cannot be read
- The form submission will work, but you won't get confirmation
- This is normal for Google Apps Script web apps

### 3. Port Already in Use Error

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::8000
```

**Solution:**
```bash
# Kill the process using port 8000
fuser -k 8000/tcp

# Then restart the development server
npm run dev
```

### 4. Google Sheets Access Denied

**Error Message:**
```
Exception: You do not have permission to call SpreadsheetApp.openById
```

**Solutions:**
1. **Check Sheet ID**: Ensure the Sheet ID in CONFIG is correct
2. **Sheet Permissions**: Make sure the sheet is accessible by your Google account
3. **Create New Sheet**: Create a fresh Google Sheet and update the ID
4. **Run Authorization**: Run any function in Apps Script to trigger authorization

### 5. Google Calendar Access Denied

**Error Message:**
```
Exception: You do not have permission to call CalendarApp.getCalendarById
```

**Solutions:**
1. **Check Calendar ID**: Verify the calendar ID is correct
2. **Calendar Permissions**: Ensure you have edit access to the calendar
3. **Create New Calendar**: Create a dedicated leave calendar
4. **Enable Calendar API**: Ensure Calendar API is enabled in Apps Script

### 6. Email Sending Failures

**Error Message:**
```
Exception: Service invoked too many times for one day: email
```

**Solutions:**
1. **Check Quotas**: Gmail has daily sending limits
2. **Use Google Workspace**: Higher limits with Workspace accounts
3. **Batch Emails**: Combine multiple notifications
4. **Alternative Services**: Consider using other email services for high volume

## 🔧 Debugging Steps

### 1. Enable Detailed Logging
Add this to any Apps Script function for debugging:
```javascript
function debugFunction() {
  Logger.log('Debug: Function started at ' + new Date());
  // Your code here
  Logger.log('Debug: Function completed');
}
```

### 2. Test Individual Components

#### Test Google Sheets Access:
```javascript
function testSheets() {
  try {
    const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID');
    Logger.log('Sheet name: ' + sheet.getName());
  } catch (error) {
    Logger.log('Sheet error: ' + error.toString());
  }
}
```

#### Test Calendar Access:
```javascript
function testCalendar() {
  try {
    const calendar = CalendarApp.getCalendarById('YOUR_CALENDAR_ID');
    Logger.log('Calendar name: ' + calendar.getName());
  } catch (error) {
    Logger.log('Calendar error: ' + error.toString());
  }
}
```

#### Test Email Sending:
```javascript
function testEmail() {
  try {
    MailApp.sendEmail('test@example.com', 'Test Subject', 'Test message');
    Logger.log('Email sent successfully');
  } catch (error) {
    Logger.log('Email error: ' + error.toString());
  }
}
```

### 3. Check Apps Script Execution Logs
1. In Apps Script editor, click "Executions" in the left sidebar
2. Review recent executions for errors
3. Click on any execution to see detailed logs

### 4. Verify Web App Deployment
1. Test the deployment URL directly in a browser
2. You should see a JSON response (even if it's an error)
3. If you get a 404, the deployment URL is incorrect

## 🛠️ Development Mode Testing

### Using Sample Data
The system includes sample data for testing without Google Apps Script:
1. The admin dashboard will show sample leave requests
2. Form submissions will show success messages
3. This allows you to test the UI before setting up the backend

### Local Testing Steps
1. Start the development server: `npm run dev`
2. Test the leave request form at `http://localhost:8000`
3. Test the admin dashboard at `http://localhost:8000/admin-dashboard`
4. Check browser console for any JavaScript errors

## 📞 Getting Help

### Check These First
1. **Browser Console**: Look for JavaScript errors
2. **Apps Script Logs**: Check execution logs for backend errors
3. **Network Tab**: Verify API requests are being sent
4. **Configuration**: Double-check all IDs and email addresses

### Common Configuration Mistakes
- Using the wrong Google Sheet ID format
- Calendar ID missing the `@group.calendar.google.com` suffix
- Apps Script not deployed as a web app
- Incorrect permissions on the web app deployment

### Still Having Issues?
1. Run the `testSetup()` function in Apps Script
2. Check all configuration values in the CONFIG object
3. Verify all Google APIs are enabled
4. Ensure proper permissions on all Google services

---

**Remember**: The system is designed to work with free Google services, so some limitations are expected. The error handling is built to gracefully handle these limitations while still providing a functional leave management system.
