const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Create Gmail transporter with App Password
 */
function createTransporter() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  return transporter;
}

/**
 * Send report email to admin
 */
async function sendReportEmail(report) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `[${process.env.APP_NAME}] ⚠️ New Report Received`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; padding: 10px; background: white; border-left: 3px solid #f44336; }
            .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 3px; margin-bottom: 15px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⚠️ Content Report</h2>
            </div>
            <div class="content">
              <div class="alert">
                <strong>Action Required:</strong> A user has reported content that may violate community guidelines.
              </div>
              <div class="field">
                <div class="label">Report Type:</div>
                <div class="value">${report.type === 'message' ? 'Message Report' : 'Topic Report'}</div>
              </div>
              <div class="field">
                <div class="label">Reported ${report.type === 'message' ? 'Message' : 'Topic'} ID:</div>
                <div class="value">${report.targetId}</div>
              </div>
              <div class="field">
                <div class="label">Reason:</div>
                <div class="value">${report.reason}</div>
              </div>
              <div class="field">
                <div class="label">Reporter Session ID:</div>
                <div class="value">${report.sessionId}</div>
              </div>
              <div class="field">
                <div class="label">Reported At:</div>
                <div class="value">${new Date(report.timestamp).toLocaleString()}</div>
              </div>
            </div>
            <div class="footer">
              This is an automated message from ${process.env.APP_NAME}
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Report email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending report email:', error);
    throw error;
  }
}

/**
 * Send daily summary email to admin
 */
async function sendDailySummaryEmail(summary) {
  try {
    const transporter = createTransporter();
    
    const topTopicsHtml = summary.topTopics.length > 0
      ? summary.topTopics.map((topic, index) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${topic.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${topic.messageCount}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #999;">No topics created today</td></tr>';

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `[${process.env.APP_NAME}] Daily Summary - ${new Date().toLocaleDateString()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
            .stat-card { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
            .stat-number { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
            .stat-label { color: #666; font-size: 14px; }
            .section-title { font-size: 18px; font-weight: bold; margin: 25px 0 15px 0; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; background: white; border-radius: 5px; overflow: hidden; }
            th { background: #667eea; color: white; padding: 12px; text-align: left; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📊 Daily Activity Summary</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div class="content">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">💬 Total Messages</div>
                  <div class="stat-number">${summary.totalMessages}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">📁 Topics Created</div>
                  <div class="stat-number">${summary.totalTopics}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">⚠️ Reports Received</div>
                  <div class="stat-number">${summary.totalReports}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">👥 Active Users</div>
                  <div class="stat-number">${summary.activeUsers || 0}</div>
                </div>
              </div>

              <div class="section-title">🏆 Top 3 Most Active Topics</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px;">Rank</th>
                    <th>Topic Name</th>
                    <th style="width: 150px; text-align: center;">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  ${topTopicsHtml}
                </tbody>
              </table>
            </div>
            <div class="footer">
              This is an automated daily summary from ${process.env.APP_NAME}<br>
              Generated at ${new Date().toLocaleTimeString()}
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Daily summary email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending daily summary email:', error);
    throw error;
  }
}

module.exports = {
  sendReportEmail,
  sendDailySummaryEmail
};
