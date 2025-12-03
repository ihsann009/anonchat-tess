# Anonymous Chat Web Application

A complete anonymous chat application with real-time messaging, topic-based discussions, and admin features including feedback/report system and daily email summaries.

## ✨ Features

### Core Features
- **100% Anonymous** - No authentication or registration required
- **Real-time Chat** - Instant messaging powered by Socket.io
- **Topic-based Discussions** - Create and join multiple chat rooms
- **Session Management** - UUID-based session stored in localStorage

### Admin Features
- **Feedback System** - Users can submit anonymous feedback
- **Report System** - Report inappropriate messages or topics
- **Email Notifications** - Automated emails for feedback and reports via Gmail OAuth2
- **Daily Summary** - Automated daily statistics email at 23:59

### Technical Features
- Clean, modular code structure
- RESTful API endpoints
- Modern, responsive UI design
- In-memory data storage (easy to migrate to database)

## 📁 Project Structure

```
anonymous-chat-app/
├── server/
│   ├── server.js              # Main server entry point
│   ├── controllers/
│   │   └── chatController.js  # Request handlers
│   ├── routes/
│   │   └── api.js             # API route definitions
│   ├── services/
│   │   └── chatService.js     # Business logic & data management
│   ├── sockets/
│   │   └── chatSocket.js      # Socket.io event handlers
│   ├── utils/
│   │   └── emailService.js    # Gmail OAuth2 email sender
│   └── cron/
│       └── dailySummary.js    # Scheduled tasks
├── client/
│   ├── index.html             # Home page
│   ├── topics.html            # Topic list page
│   ├── chat.html              # Chat room page
│   ├── feedback.html          # Feedback page
│   ├── css/
│   │   └── styles.css         # Styling
│   └── js/
│       ├── session.js         # Session management
│       ├── topics.js          # Topics page logic
│       ├── chat.js            # Chat functionality
│       └── feedback.js        # Feedback logic
├── package.json
├── .env.example
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Gmail account with OAuth2 credentials

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Gmail OAuth2

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API

2. **Create OAuth2 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add `https://developers.google.com/oauthplayground` to redirect URIs
   - Save Client ID and Client Secret

3. **Get Refresh Token**
   - Visit [OAuth2 Playground](https://developers.google.com/oauthplayground)
   - Click settings (⚙️) > Check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - In Step 1, select "Gmail API v1" > "https://mail.google.com/"
   - Click "Authorize APIs" and sign in with your Gmail account
   - In Step 2, click "Exchange authorization code for tokens"
   - Copy the Refresh Token

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Gmail OAuth2 Configuration
GMAIL_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-actual-client-secret
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
GMAIL_REFRESH_TOKEN=your-actual-refresh-token

# Admin Email (where notifications will be sent)
ADMIN_EMAIL=your-email@gmail.com

# App Configuration
APP_NAME=Anonymous Chat App
```

### Step 4: Run the Application

**Development mode with auto-reload:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📖 Usage Guide

### For Users

1. **Home Page** - Visit `http://localhost:3000`
   - Your unique session ID is automatically generated
   - View application features

2. **Browse Topics** - Click "Browse Topics"
   - See all available discussion topics
   - View message counts and creation times

3. **Create Topic** - Click "+ Create Topic"
   - Enter topic name (required)
   - Add optional description
   - Topic is created instantly

4. **Join Chat Room** - Click on any topic
   - Real-time messaging
   - See typing indicators
   - All messages are anonymous

5. **Send Feedback** - Click "Send Feedback"
   - Submit anonymous feedback to admin
   - Admin receives email notification

6. **Report Content** - In any chat room
   - Click "Report" button
   - Describe the issue
   - Admin receives email alert

### For Admins

**Email Notifications:**
- Feedback emails: Beautifully formatted with user session ID and message
- Report emails: Detailed alerts with report type, target ID, and reason
- Daily summary: Comprehensive statistics sent at 23:59 including:
  - Total messages sent
  - Total topics created
  - Number of reports
  - Top 3 most active topics
  - Active user count

## 🔌 API Endpoints

### Topics
- `GET /api/topics` - Get all topics
- `GET /api/topics/:topicId` - Get specific topic
- `POST /api/topics` - Create new topic
  ```json
  {
    "name": "Topic Name",
    "description": "Optional description",
    "sessionId": "user-session-id"
  }
  ```
- `GET /api/topics/:topicId/messages` - Get topic messages

### Feedback & Reports
- `POST /api/feedback` - Submit feedback
  ```json
  {
    "message": "Feedback message",
    "sessionId": "user-session-id"
  }
  ```
- `POST /api/report` - Submit report
  ```json
  {
    "type": "message" | "topic",
    "targetId": "message-or-topic-id",
    "reason": "Report reason",
    "sessionId": "user-session-id"
  }
  ```

### Statistics
- `GET /api/stats` - Get daily statistics (for debugging)

## 🔌 Socket.io Events

### Client → Server
- `join-topic` - Join a chat room
- `leave-topic` - Leave a chat room
- `send-message` - Send a message
- `typing` - User is typing
- `stop-typing` - User stopped typing

### Server → Client
- `topic-messages` - Initial messages when joining
- `new-message` - New message broadcast
- `user-joined` - User joined notification
- `user-left` - User left notification
- `user-typing` - Typing indicator
- `user-stop-typing` - Stop typing indicator
- `error` - Error message

## ⏰ Cron Jobs

**Daily Summary (23:59)**
- Automatically runs every day at 23:59
- Sends comprehensive email to admin
- Includes all daily statistics
- Timezone can be configured in `server/cron/dailySummary.js`

## 🎨 Customization

### Change Timezone for Daily Summary
Edit `server/cron/dailySummary.js`:
```javascript
cron.schedule('59 23 * * *', async () => {
  // ...
}, {
  timezone: "America/New_York" // Change to your timezone
});
```

### Add Database Support
Replace in-memory storage in `server/services/chatService.js` with your preferred database (MongoDB, PostgreSQL, etc.)

### Customize Email Templates
Edit email HTML in `server/utils/emailService.js`:
- `sendFeedbackEmail()`
- `sendReportEmail()`
- `sendDailySummaryEmail()`

## 🔒 Security Considerations

⚠️ **Important for Production:**

1. **Rate Limiting** - Add rate limiting middleware
2. **Input Validation** - Implement comprehensive validation
3. **XSS Protection** - Already using basic HTML escaping
4. **CORS** - Configure CORS properly for production
5. **Environment Variables** - Never commit `.env` file
6. **HTTPS** - Use HTTPS in production
7. **Database** - Migrate from in-memory to persistent storage
8. **Moderation** - Implement content moderation system

## 🐛 Troubleshooting

### Email not sending
- Verify Gmail OAuth2 credentials are correct
- Check if refresh token is still valid
- Ensure Gmail API is enabled in Google Cloud Console
- Check admin email is correct

### Socket.io connection issues
- Ensure port 3000 is not blocked by firewall
- Check if CORS settings allow your domain
- Verify server is running

### Topics not loading
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure server is running properly

## 📝 Development Notes

### In-Memory Storage
Current implementation uses in-memory storage (Maps and Arrays). Data is lost on server restart. For production:
- Migrate to MongoDB, PostgreSQL, or other database
- Update `server/services/chatService.js`

### Session Management
- Sessions are stored in browser localStorage
- UUID v4 format for unique identification
- No server-side session validation (add if needed)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🎯 Future Enhancements

- [ ] Database integration
- [ ] User authentication (optional)
- [ ] File/image sharing
- [ ] Message reactions
- [ ] Read receipts
- [ ] Private messaging
- [ ] Message search
- [ ] User blocking
- [ ] Content moderation AI
- [ ] Mobile app version

---

**Built with ❤️ using Node.js, Express, and Socket.io**
