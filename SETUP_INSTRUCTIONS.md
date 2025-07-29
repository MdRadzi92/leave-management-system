# Leave Management System - Complete Setup Guide

This guide will help you set up a complete leave management system for your organization (70+ staff) using free Google services and a modern web interface.

## 🎯 System Overview

The system includes:
- **Modern Web Interface**: Next.js app for leave requests and admin dashboard
- **Google Apps Script Backend**: Free serverless processing
- **Google Sheets Database**: Store all leave requests
- **Google Calendar Integration**: Automatic leave event creation
- **Email Notifications**: Automatic notifications to HOD/HR
- **Admin Dashboard**: IT manager control panel

## 📋 Prerequisites

- Google Workspace or Gmail account
- Basic understanding of Google Apps Script
- Web hosting for the Next.js app (optional - can run locally)

## 🚀 Step-by-Step Setup

### Phase 1: Google Apps Script Setup

#### 1.1 Create Google Apps Script Project
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Replace the default code with the content from `google-apps-script/leaveManagementAppsScript.gs`
4. Rename the project to "Leave Management System"

#### 1.2 Create Google Sheet Database
1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Leave Management Database"
4. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)
   ```
   Example URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
   Sheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   ```

#### 1.3 Create Google Calendar
1. Go to [calendar.google.com](https://calendar.google.com)
2. Click the "+" next to "Other calendars"
3. Select "Create new calendar"
4. Name it "Company Leave Calendar"
5. Set appropriate sharing permissions for your organization
6. Go to calendar settings and copy the Calendar ID
   ```
   Example: company-leave@group.calendar.google.com
   ```

#### 1.4 Configure Apps Script
1. In your Apps Script project, update the `CONFIG` object:
   ```javascript
   const CONFIG = {
     SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',
     CALENDAR_ID: 'YOUR_CALENDAR_ID_HERE@group.calendar.google.com',
     HOD_EMAIL: 'hod@yourcompany.com',
     HR_EMAIL: 'hr@yourcompany.com',
     COMPANY_NAME: 'Your Company Name',
     COMPANY_DOMAIN: 'yourcompany.com',
     SHEET_NAME: 'LeaveRequests'
   };
   ```

#### 1.5 Enable Required APIs
1. In Apps Script, click on "Services" in the left sidebar
2. Add the following services:
   - Gmail API
   - Google Calendar API
   - Google Sheets API

#### 1.6 Test the Setup
1. In Apps Script, run the `testSetup()` function
2. Grant necessary permissions when prompted
3. Check the execution log for any errors

#### 1.7 Deploy as Web App
1. Click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Description: "Leave Management System API"
4. Execute as: "Me"
5. Who has access: "Anyone" (for form submissions)
6. Click "Deploy"
7. Copy the deployment URL - you'll need this for the web app

### Phase 2: Web Application Setup

#### 2.1 Install Dependencies
```bash
npm install
```

#### 2.2 Update API Endpoint
1. Open `src/app/page.tsx`
2. Find the line with `APPS_SCRIPT_URL`
3. Replace `YOUR_DEPLOYMENT_ID` with your actual Apps Script deployment URL:
   ```javascript
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_DEPLOYMENT_ID/exec";
   ```

#### 2.3 Update Admin Dashboard (Optional)
1. Open `src/app/admin-dashboard/page.tsx`
2. Replace the sample data with actual API calls to your Apps Script endpoint
3. Update the fetch URL in the `fetchRequests` function

#### 2.4 Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:8000`

### Phase 3: Production Deployment

#### 3.1 Deploy Web App
Choose one of these free options:
- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drag and drop build folder or connect GitHub
- **GitHub Pages**: For static deployment

#### 3.2 Update CORS Settings (if needed)
If you encounter CORS issues:
1. In Apps Script, ensure the `doPost` function handles CORS properly
2. The current script includes CORS headers

#### 3.3 Configure Domain (Optional)
- Set up a custom domain for your web app
- Update any hardcoded URLs in the configuration

## 🔧 Configuration Guide

### Email Templates
You can customize email templates in the Apps Script:
- Edit the `sendNotificationEmails` function
- Modify subject lines and email body content
- Add company branding or additional information

### Leave Types
Update leave types in both places:
1. **Web Form**: `src/app/page.tsx` - update the select options
2. **Admin Dashboard**: `src/app/admin-dashboard/page.tsx` - update filter options

### Departments
Update department list in:
1. **Web Form**: `src/app/page.tsx` - update the select options
2. **Admin Dashboard**: `src/app/admin-dashboard/page.tsx` - update filter options

### Calendar Event Customization
In Apps Script, modify the `createCalendarEvent` function:
- Change event titles format
- Add additional event details
- Set event colors or categories

## 🛠️ IT Manager Controls

### Admin Dashboard Features
- View all leave requests in real-time
- Filter by department, status, or date range
- Search by employee name or email
- View leave statistics and analytics
- Configure system settings

### System Configuration
Access the configuration panel in the admin dashboard to update:
- HOD and HR email addresses
- Google Calendar ID
- Google Sheet ID
- Company information

### Monitoring and Maintenance
1. **Apps Script Logs**: Check execution logs for errors
2. **Sheet Monitoring**: Regularly check the Google Sheet for data integrity
3. **Email Delivery**: Monitor email delivery and spam folders
4. **Calendar Events**: Verify calendar events are being created correctly

## 🔍 Troubleshooting

### Common Issues

#### 1. Form Submission Fails
- **Check**: Apps Script deployment URL is correct
- **Check**: Apps Script permissions are granted
- **Check**: Google Sheet ID is correct
- **Solution**: Run `testSetup()` function in Apps Script

#### 2. Emails Not Sending
- **Check**: Email addresses in CONFIG are correct
- **Check**: Gmail API is enabled
- **Solution**: Test email sending manually in Apps Script

#### 3. Calendar Events Not Created
- **Check**: Calendar ID is correct and accessible
- **Check**: Calendar API is enabled
- **Check**: Calendar sharing permissions
- **Solution**: Test calendar access in Apps Script

#### 4. Admin Dashboard Shows No Data
- **Check**: GET endpoint is working in Apps Script
- **Check**: Sheet has data and correct structure
- **Solution**: Test the `getLeaveRequests()` function

### Error Logs
- **Apps Script**: View logs in the Apps Script editor
- **Web App**: Check browser console for JavaScript errors
- **Network**: Use browser dev tools to check API requests

## 📊 Usage Analytics

### Tracking Leave Requests
The system automatically tracks:
- Total requests submitted
- Requests by department
- Requests by leave type
- Approval/rejection rates
- Leave days consumed

### Reporting
Generate reports using Google Sheets:
- Create pivot tables for department-wise analysis
- Use charts for visual representation
- Export data for external analysis

## 🔒 Security Considerations

### Data Protection
- Google Sheets data is protected by Google's security
- Apps Script runs with your Google account permissions
- Web app can be restricted to your organization's domain

### Access Control
- Limit Apps Script deployment access as needed
- Use Google Workspace admin controls for calendar access
- Consider implementing authentication for the web app

### Privacy
- Employee data is stored in your Google Workspace
- Email notifications contain sensitive information
- Ensure compliance with your organization's privacy policies

## 🚀 Advanced Features (Optional)

### Integration Enhancements
1. **Slack Integration**: Add Slack notifications
2. **Mobile App**: Create a mobile-friendly PWA
3. **Approval Workflow**: Add multi-level approval process
4. **Leave Balance**: Track remaining leave days
5. **Recurring Leave**: Handle recurring leave patterns

### Automation Improvements
1. **Auto-approval**: Set rules for automatic approval
2. **Reminder System**: Send reminders for pending approvals
3. **Escalation**: Auto-escalate overdue approvals
4. **Integration**: Connect with HR systems or payroll

## 📞 Support

### Getting Help
1. **Google Apps Script**: [Official documentation](https://developers.google.com/apps-script)
2. **Next.js**: [Official documentation](https://nextjs.org/docs)
3. **Google APIs**: [API documentation](https://developers.google.com/apis-explorer)

### Community Resources
- Stack Overflow for technical questions
- Google Apps Script community forums
- GitHub issues for this project

## 📝 Maintenance Schedule

### Weekly
- Check Apps Script execution logs
- Verify email delivery
- Monitor system usage

### Monthly
- Review leave statistics
- Update employee lists if needed
- Check system performance

### Quarterly
- Update leave policies in the system
- Review and update email templates
- Backup Google Sheets data

---

## 🎉 Congratulations!

Your leave management system is now ready to handle leave requests for your 70+ staff members. The system provides:

✅ **Free Operation**: Uses only free Google services  
✅ **Scalable**: Handles growing team sizes  
✅ **Automated**: Reduces manual HR work  
✅ **Integrated**: Works with Google Calendar and Gmail  
✅ **Modern Interface**: User-friendly web application  
✅ **IT Control**: Full administrative control  

For any questions or issues, refer to the troubleshooting section or check the execution logs in Google Apps Script.
