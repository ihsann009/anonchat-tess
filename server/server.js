require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cron = require('node-cron');
const { sendReportEmail, sendDailySummaryEmail } = require('./utils/emailService');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// In-memory storage
const topics = new Map();
const messages = new Map();
const reports = [];
let dailyStats = { messages: 0, topics: 0, reports: 0, date: new Date().toDateString() };

// API: Get all topics
app.get('/api/topics', (req, res) => {
  const topicsList = Array.from(topics.values()).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    createdAt: t.createdAt,
    messageCount: t.messageCount
  }));
  res.json({ success: true, topics: topicsList });
});

// API: Get topic by ID
app.get('/api/topics/:topicId', (req, res) => {
  const topic = topics.get(req.params.topicId);
  if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });
  res.json({ success: true, topic });
});

// API: Create topic
app.post('/api/topics', (req, res) => {
  const { name, description, sessionId } = req.body;
  if (!name || !sessionId) return res.status(400).json({ success: false, error: 'Name required' });

  const id = Date.now().toString();
  const topic = {
    id,
    name,
    description: description || '',
    createdBy: sessionId,
    createdAt: new Date().toISOString(),
    messageCount: 0
  };

  topics.set(id, topic);
  messages.set(id, []);
  dailyStats.topics++;

  // Emit new topic event
  io.emit('new-topic', topic);

  res.status(201).json({ success: true, topic });
});

// API: Submit report
app.post('/api/report', async (req, res) => {
  try {
    const { type, targetId, reason, sessionId } = req.body;
    if (!type || !targetId || !reason || !sessionId) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }
    
    const report = {
      id: Date.now().toString(),
      type,
      targetId,
      reason,
      sessionId,
      timestamp: new Date().toISOString()
    };
    
    reports.push(report);
    dailyStats.reports++;
    
    await sendReportEmail(report);
    res.status(201).json({ success: true, message: 'Report submitted' });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit report' });
  }
});

// API: Manual trigger daily summary (for testing)
app.post('/api/send-summary', async (req, res) => {
  try {
    console.log('Manually sending daily summary...');
    const topicsArray = Array.from(topics.values());
    const topTopics = topicsArray
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 3)
      .map(t => ({ name: t.name, messageCount: t.messageCount }));

    const activeUsers = new Set();
    for (const msgs of messages.values()) {
      msgs.forEach(m => activeUsers.add(m.sessionId));
    }

    const summary = {
      totalMessages: dailyStats.messages,
      totalTopics: dailyStats.topics,
      totalReports: dailyStats.reports,
      topTopics,
      activeUsers: activeUsers.size
    };

    await sendDailySummaryEmail(summary);
    console.log('Daily summary sent successfully');
    
    // Reset daily stats after sending
    dailyStats = { messages: 0, topics: 0, reports: 0, date: new Date().toDateString() };
    
    res.json({ success: true, message: 'Summary email sent', summary });
  } catch (error) {
    console.error('Summary email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Get current stats (for debugging)
app.get('/api/stats', (req, res) => {
  const topicsArray = Array.from(topics.values());
  const topTopics = topicsArray
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 3)
    .map(t => ({ name: t.name, messageCount: t.messageCount }));

  const activeUsers = new Set();
  for (const msgs of messages.values()) {
    msgs.forEach(m => activeUsers.add(m.sessionId));
  }

  res.json({
    success: true,
    stats: {
      ...dailyStats,
      topTopics,
      activeUsers: activeUsers.size,
      totalTopicsInDb: topics.size,
      totalReportsInDb: reports.length
    }
  });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-topic', ({ topicId, sessionId }) => {
    socket.join(topicId);
    const msgs = messages.get(topicId) || [];
    socket.emit('topic-messages', msgs);
    socket.to(topicId).emit('user-joined', { sessionId });
  });

  socket.on('leave-topic', ({ topicId, sessionId }) => {
    socket.leave(topicId);
    socket.to(topicId).emit('user-left', { sessionId });
  });

  socket.on('send-message', ({ topicId, content, sessionId }) => {
    const topic = topics.get(topicId);
    if (!topic) return socket.emit('error', { message: 'Topic not found' });

    const message = {
      id: Date.now().toString(),
      topicId,
      content,
      sessionId,
      timestamp: new Date().toISOString()
    };

    const topicMsgs = messages.get(topicId);
    topicMsgs.push(message);
    topic.messageCount++;
    dailyStats.messages++;
    
    io.to(topicId).emit('new-message', message);
  });

  socket.on('typing', ({ topicId, sessionId }) => {
    socket.to(topicId).emit('user-typing', { sessionId });
  });

  socket.on('stop-typing', ({ topicId, sessionId }) => {
    socket.to(topicId).emit('user-stop-typing', { sessionId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Function to send summary
async function sendSummary() {
  console.log('Sending summary at', new Date().toLocaleString());
  try {
    const topicsArray = Array.from(topics.values());
    const topTopics = topicsArray
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 3)
      .map(t => ({ name: t.name, messageCount: t.messageCount }));

    const activeUsers = new Set();
    for (const msgs of messages.values()) {
      msgs.forEach(m => activeUsers.add(m.sessionId));
    }

    const summary = {
      totalMessages: dailyStats.messages,
      totalTopics: dailyStats.topics,
      totalReports: dailyStats.reports,
      topTopics,
      activeUsers: activeUsers.size
    };

    await sendDailySummaryEmail(summary);
    console.log('Summary sent successfully at', new Date().toLocaleString());
    
    // Reset daily stats after sending
    dailyStats = { messages: 0, topics: 0, reports: 0, date: new Date().toDateString() };
  } catch (error) {
    console.error('Summary error:', error);
  }
}

// Summary cron - every 12 hours (12 PM and 12 AM)
cron.schedule('0 0,12 * * *', sendSummary);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
