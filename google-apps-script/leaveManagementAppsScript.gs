/**
 * Leave Management System - Google Apps Script
 * 
 * This script handles:
 * 1. Processing leave requests from the web form
 * 2. Storing data in Google Sheets
 * 3. Creating Google Calendar events
 * 4. Sending email notifications to HOD and HR
 * 5. Providing API endpoints for the admin dashboard
 * 
 * Setup Instructions:
 * 1. Create a new Google Apps Script project
 * 2. Replace the default code with this script
 * 3. Update the configuration variables below
 * 4. Enable required Google APIs (Calendar, Gmail, Sheets)
 * 5. Deploy as a web app with "Anyone, even anonymous" access
 * 6. Update the deployment URL in your Next.js app
 */

// ==================== CONFIGURATION ====================
// Update these values according to your organization's setup

const CONFIG = {
  // Google Sheet ID where leave requests will be stored
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',
  
  // Google Calendar ID where leave events will be created
  CALENDAR_ID: 'YOUR_CALENDAR_ID_HERE@group.calendar.google.com',
  
  // Email addresses for notifications
  HOD_EMAIL: 'hod@yourcompany.com',
  HR_EMAIL: 'hr@yourcompany.com',
  
  // Company details for email templates
  COMPANY_NAME: 'Your Company Name',
  COMPANY_DOMAIN: 'yourcompany.com',
  
  // Sheet name for leave requests
  SHEET_NAME: 'LeaveRequests'
};

// ==================== MAIN ENTRY POINTS ====================

/**
 * Main entry point for POST requests (form submissions)
 */
function doPost(e) {
  try {
    // Enable CORS for web requests
    const response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);
    
    // Check if request data exists
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('No post data received or invalid request structure');
      return response.setContent(JSON.stringify({
        success: false,
        error: 'No data received in request'
      }));
    }
    
    // Parse the incoming request
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      Logger.log('JSON Parse Error: ' + parseError.toString());
      Logger.log('Raw post data: ' + e.postData.contents);
      return response.setContent(JSON.stringify({
        success: false,
        error: 'Invalid JSON data: ' + parseError.toString()
      }));
    }
    
    // Log the received data for debugging
    Logger.log('Received data: ' + JSON.stringify(data));
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'department', 'leaveType', 'startDate', 'endDate', 'reason'];
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === '') {
        return response.setContent(JSON.stringify({
          success: false,
          error: `Missing required field: ${field}`
        }));
      }
    }
    
    // Validate date range
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (startDate > endDate) {
      return response.setContent(JSON.stringify({
        success: false,
        error: 'End date must be after start date'
      }));
    }
    
    // Process the leave request
    const result = processLeaveRequest(data);
    
    return response.setContent(JSON.stringify(result));
    
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Internal server error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main entry point for GET requests (admin dashboard data)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getRequests';
    
    switch (action) {
      case 'getRequests':
        return getLeaveRequests();
      case 'getStats':
        return getLeaveStats();
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Invalid action'
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Internal server error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== CORE FUNCTIONS ====================

/**
 * Process a leave request submission
 */
function processLeaveRequest(data) {
  try {
    // 1. Store in Google Sheets
    const sheetResult = storeInSheet(data);
    if (!sheetResult.success) {
      throw new Error('Failed to store in sheet: ' + sheetResult.error);
    }
    
    // 2. Create Calendar Event
    const calendarResult = createCalendarEvent(data);
    if (!calendarResult.success) {
      Logger.log('Calendar creation failed: ' + calendarResult.error);
      // Don't fail the entire process if calendar creation fails
    }
    
    // 3. Send Email Notifications
    const emailResult = sendNotificationEmails(data);
    if (!emailResult.success) {
      Logger.log('Email notification failed: ' + emailResult.error);
      // Don't fail the entire process if email fails
    }
    
    return {
      success: true,
      message: 'Leave request submitted successfully',
      requestId: sheetResult.requestId
    };
    
  } catch (error) {
    Logger.log('processLeaveRequest Error: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Store leave request in Google Sheets
 */
function storeInSheet(data) {
  try {
    const sheet = getOrCreateSheet();
    
    // Generate unique request ID
    const requestId = 'LR-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    
    // Calculate number of leave days
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const leaveDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Append row to sheet
    sheet.appendRow([
      requestId,
      new Date(), // Timestamp
      data.name,
      data.email,
      data.department,
      data.leaveType,
      data.startDate,
      data.endDate,
      leaveDays,
      data.reason,
      'Pending', // Status
      '', // HOD Approval
      '', // HR Approval
      '' // Comments
    ]);
    
    return {
      success: true,
      requestId: requestId
    };
    
  } catch (error) {
    Logger.log('storeInSheet Error: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Create or get the leave requests sheet
 */
function getOrCreateSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      // Create new sheet with headers
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      sheet.appendRow([
        'Request ID',
        'Timestamp',
        'Employee Name',
        'Email',
        'Department',
        'Leave Type',
        'Start Date',
        'End Date',
        'Leave Days',
        'Reason',
        'Status',
        'HOD Approval',
        'HR Approval',
        'Comments'
      ]);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, 14);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
    }
    
    return sheet;
    
  } catch (error) {
    Logger.log('getOrCreateSheet Error: ' + error.toString());
    throw new Error('Failed to access Google Sheet: ' + error.toString());
  }
}

/**
 * Create Google Calendar event for leave
 */
function createCalendarEvent(data) {
  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    
    if (!calendar) {
      throw new Error('Calendar not found. Please check CALENDAR_ID configuration.');
    }
    
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    // For all-day events, add one day to end date
    const eventEndDate = new Date(endDate);
    eventEndDate.setDate(eventEndDate.getDate() + 1);
    
    const eventTitle = `${data.leaveType} - ${data.name}`;
    const eventDescription = `Employee: ${data.name}\n` +
                           `Email: ${data.email}\n` +
                           `Department: ${data.department}\n` +
                           `Leave Type: ${data.leaveType}\n` +
                           `Reason: ${data.reason}`;
    
    const event = calendar.createAllDayEvent(
      eventTitle,
      startDate,
      eventEndDate,
      {
        description: eventDescription,
        location: CONFIG.COMPANY_NAME
      }
    );
    
    return {
      success: true,
      eventId: event.getId()
    };
    
  } catch (error) {
    Logger.log('createCalendarEvent Error: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Send email notifications to HOD and HR
 */
function sendNotificationEmails(data) {
  try {
    const subject = `New Leave Request - ${data.name} (${data.department})`;
    
    const emailBody = `
Dear Team,

A new leave request has been submitted and requires your attention.

EMPLOYEE DETAILS:
• Name: ${data.name}
• Email: ${data.email}
• Department: ${data.department}

LEAVE DETAILS:
• Leave Type: ${data.leaveType}
• Start Date: ${data.startDate}
• End Date: ${data.endDate}
• Duration: ${calculateLeaveDays(data.startDate, data.endDate)} day(s)
• Reason: ${data.reason}

Please review this request and take appropriate action.

This is an automated notification from the ${CONFIG.COMPANY_NAME} Leave Management System.

Best regards,
IT Department
${CONFIG.COMPANY_NAME}
    `;
    
    // Send to HOD
    try {
      MailApp.sendEmail({
        to: CONFIG.HOD_EMAIL,
        subject: subject,
        body: emailBody,
        name: `${CONFIG.COMPANY_NAME} Leave Management System`
      });
    } catch (hodEmailError) {
      Logger.log('HOD Email Error: ' + hodEmailError.toString());
    }
    
    // Send to HR
    try {
      MailApp.sendEmail({
        to: CONFIG.HR_EMAIL,
        subject: subject,
        body: emailBody,
        name: `${CONFIG.COMPANY_NAME} Leave Management System`
      });
    } catch (hrEmailError) {
      Logger.log('HR Email Error: ' + hrEmailError.toString());
    }
    
    // Send confirmation to employee
    const confirmationSubject = `Leave Request Submitted - ${data.leaveType}`;
    const confirmationBody = `
Dear ${data.name},

Your leave request has been successfully submitted and is now pending approval.

LEAVE REQUEST DETAILS:
• Leave Type: ${data.leaveType}
• Start Date: ${data.startDate}
• End Date: ${data.endDate}
• Duration: ${calculateLeaveDays(data.startDate, data.endDate)} day(s)

Your request has been forwarded to your HOD and HR department for review. You will be notified once a decision has been made.

If you need to make any changes or have questions about your request, please contact your supervisor or HR department directly.

Thank you,
${CONFIG.COMPANY_NAME} Leave Management System
    `;
    
    try {
      MailApp.sendEmail({
        to: data.email,
        subject: confirmationSubject,
        body: confirmationBody,
        name: `${CONFIG.COMPANY_NAME} Leave Management System`
      });
    } catch (confirmationEmailError) {
      Logger.log('Confirmation Email Error: ' + confirmationEmailError.toString());
    }
    
    return {
      success: true,
      message: 'Notifications sent successfully'
    };
    
  } catch (error) {
    Logger.log('sendNotificationEmails Error: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get all leave requests for admin dashboard
 */
function getLeaveRequests() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const requests = data.slice(1).map((row, index) => ({
      id: row[0] || `req-${index + 1}`,
      timestamp: row[1] ? row[1].toString() : '',
      name: row[2] || '',
      email: row[3] || '',
      department: row[4] || '',
      leaveType: row[5] || '',
      startDate: row[6] || '',
      endDate: row[7] || '',
      leaveDays: row[8] || 0,
      reason: row[9] || '',
      status: row[10] || 'Pending',
      hodApproval: row[11] || '',
      hrApproval: row[12] || '',
      comments: row[13] || ''
    }));
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        requests: requests.reverse() // Show newest first
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('getLeaveRequests Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get leave statistics for admin dashboard
 */
function getLeaveStats() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const requests = data.slice(1);
    
    const stats = {
      total: requests.length,
      pending: requests.filter(row => row[10] === 'Pending').length,
      approved: requests.filter(row => row[10] === 'Approved').length,
      rejected: requests.filter(row => row[10] === 'Rejected').length,
      thisMonth: 0,
      totalLeaveDays: 0
    };
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    requests.forEach(row => {
      const timestamp = new Date(row[1]);
      if (timestamp.getMonth() === currentMonth && timestamp.getFullYear() === currentYear) {
        stats.thisMonth++;
      }
      stats.totalLeaveDays += (row[8] || 0);
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        stats: stats
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('getLeaveStats Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate number of leave days between two dates
 */
function calculateLeaveDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

/**
 * Test function to verify setup
 */
function testSetup() {
  try {
    Logger.log('Testing Leave Management System Setup...');
    
    // Test Sheet Access
    const sheet = getOrCreateSheet();
    Logger.log('✓ Google Sheet access successful');
    
    // Test Calendar Access
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    if (calendar) {
      Logger.log('✓ Google Calendar access successful');
    } else {
      Logger.log('✗ Google Calendar access failed - check CALENDAR_ID');
    }
    
    // Test Email Configuration
    Logger.log('Email Configuration:');
    Logger.log('  HOD Email: ' + CONFIG.HOD_EMAIL);
    Logger.log('  HR Email: ' + CONFIG.HR_EMAIL);
    
    Logger.log('Setup test completed!');
    
  } catch (error) {
    Logger.log('Setup test failed: ' + error.toString());
  }
}

/**
 * Test function to simulate a POST request
 */
function testPostRequest() {
  try {
    Logger.log('Testing POST request handling...');
    
    // Create a mock request object
    const mockRequest = {
      postData: {
        contents: JSON.stringify({
          name: "Test User",
          email: "test@company.com",
          department: "IT",
          leaveType: "Annual Leave",
          startDate: "2024-02-01",
          endDate: "2024-02-03",
          reason: "Testing the system"
        })
      }
    };
    
    // Test the doPost function
    const result = doPost(mockRequest);
    Logger.log('POST test result: ' + result.getContent());
    
  } catch (error) {
    Logger.log('POST test failed: ' + error.toString());
  }
}

/**
 * Test function to simulate a GET request
 */
function testGetRequest() {
  try {
    Logger.log('Testing GET request handling...');
    
    // Create a mock request object
    const mockRequest = {
      parameter: {
        action: 'getRequests'
      }
    };
    
    // Test the doGet function
    const result = doGet(mockRequest);
    Logger.log('GET test result: ' + result.getContent());
    
  } catch (error) {
    Logger.log('GET test failed: ' + error.toString());
  }
}
