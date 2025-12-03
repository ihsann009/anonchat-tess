// Simple session with localStorage
function getSessionId() {
  let id = localStorage.getItem('sessionId');
  if (!id) {
    id = Math.floor(10000 + Math.random() * 90000).toString();
    localStorage.setItem('sessionId', id);
  }
  return id;
}

function getNickname() {
  return 'user-' + getSessionId();
}

const API_URL = window.location.origin;

// === TOPICS PAGE ===
if (window.location.pathname.includes('topics.html')) {
  loadTopics();
  document.getElementById('sessionId').textContent = getNickname();

  document.getElementById('createTopicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('topicName').value.trim();
    const description = document.getElementById('topicDescription').value.trim();

    try {
      const res = await fetch(`${API_URL}/api/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, sessionId: getSessionId() })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = `/chat.html?topic=${data.topic.id}`;
      } else {
        alert('Gagal membuat topik');
      }
    } catch (error) {
      console.error(error);
      alert('Gagal membuat topik');
    }
  });

  // Listen for new topics
  const socket = io(API_URL);
  socket.on('new-topic', (topic) => {
    const list = document.getElementById('topicsList');
    const empty = list.querySelector('.empty-state');
    if (empty) list.innerHTML = '';
    const topicHTML = `
      <a href="/chat.html?topic=${topic.id}" class="topic-card">
        <h3>${escape(topic.name)}</h3>
        <p>${escape(topic.description || 'Tidak ada deskripsi')}</p>
        <div class="topic-meta">
          <span>${topic.messageCount} pesan</span>
          <span>${formatDate(topic.createdAt)}</span>
        </div>
      </a>
    `;
    list.innerHTML += topicHTML;
  });
}

async function loadTopics() {
  try {
    const res = await fetch(`${API_URL}/api/topics`);
    const data = await res.json();
    if (data.success) {
      const list = document.getElementById('topicsList');
      if (data.topics.length === 0) {
        list.innerHTML = '<div class="empty-state"><h3>Belum ada topik</h3><p>Buat topik pertama!</p></div>';
      } else {
        list.innerHTML = data.topics.map(t => `
          <a href="/chat.html?topic=${t.id}" class="topic-card">
            <h3>${escape(t.name)}</h3>
            <p>${escape(t.description || 'Tidak ada deskripsi')}</p>
            <div class="topic-meta">
              <span>${t.messageCount} pesan</span>
              <span>${formatDate(t.createdAt)}</span>
            </div>
          </a>
        `).join('');
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function showCreateTopicModal() {
  document.getElementById('createTopicModal').classList.add('active');
}

function hideCreateTopicModal() {
  document.getElementById('createTopicModal').classList.remove('active');
  document.getElementById('createTopicForm').reset();
}

// === CHAT PAGE ===
if (window.location.pathname.includes('chat.html')) {
  const topicId = new URLSearchParams(window.location.search).get('topic');
  if (!topicId) {
    window.location.href = '/topics.html';
  } else {
    initChat(topicId);
    document.getElementById('sessionId').textContent = getNickname();
  }

  document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const reason = document.getElementById('reportReason').value.trim();

    try {
      const res = await fetch(`${API_URL}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'topic',
          targetId: topicId,
          reason,
          sessionId: getSessionId()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Laporan terkirim');
        hideReportModal();
      } else {
        alert('Gagal mengirim laporan');
      }
    } catch (error) {
      console.error(error);
      alert('Gagal mengirim laporan');
    }
  });
}

let socket;
let typingTimeout;

async function initChat(topicId) {
  // Load topic info
  try {
    const res = await fetch(`${API_URL}/api/topics/${topicId}`);
    const data = await res.json();
    if (data.success) {
      document.getElementById('topicName').textContent = data.topic.name;
      document.getElementById('topicDescription').textContent = data.topic.description || '';
    } else {
      alert('Topik tidak ditemukan');
      window.location.href = '/topics.html';
      return;
    }
  } catch (error) {
    console.error(error);
    alert('Gagal memuat topik');
    window.location.href = '/topics.html';
    return;
  }

  // Connect socket
  socket = io(API_URL);
  const sessionId = getSessionId();

  socket.on('connect', () => {
    socket.emit('join-topic', { topicId, sessionId });
  });

  socket.on('topic-messages', (msgs) => {
    displayMessages(msgs);
  });

  socket.on('new-message', (msg) => {
    addMessage(msg);
  });

  socket.on('user-typing', () => {
    document.getElementById('typingIndicator').style.display = 'block';
  });

  socket.on('user-stop-typing', () => {
    document.getElementById('typingIndicator').style.display = 'none';
  });

  // Setup input
  const input = document.getElementById('messageInput');
  input.addEventListener('input', () => {
    socket.emit('typing', { topicId, sessionId });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('stop-typing', { topicId, sessionId });
    }, 2000);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

function displayMessages(msgs) {
  const list = document.getElementById('messagesList');
  if (msgs.length === 0) {
    list.innerHTML = '<div class="empty-state"><h3>Belum ada pesan</h3><p>Mulai percakapan!</p></div>';
  } else {
    list.innerHTML = msgs.map(m => createMessageHTML(m)).join('');
    list.scrollTop = list.scrollHeight;
  }
}

function addMessage(msg) {
  const list = document.getElementById('messagesList');
  const empty = list.querySelector('.empty-state');
  if (empty) list.innerHTML = '';
  list.innerHTML += createMessageHTML(msg);
  list.scrollTop = list.scrollHeight;
}

function createMessageHTML(msg) {
  const myId = getSessionId();
  const isOwn = msg.sessionId === myId;
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const name = isOwn ? 'Kamu' : 'user-' + msg.sessionId;

  return `
    <div class="message ${isOwn ? 'own' : 'other'}">
      <div class="message-content">${escape(msg.content)}</div>
      <div class="message-meta">
        <span>${name}</span>
        <span class="message-time">${time}</span>
      </div>
    </div>
  `;
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const content = input.value.trim();
  if (!content) return;

  const topicId = new URLSearchParams(window.location.search).get('topic');
  socket.emit('send-message', { topicId, content, sessionId: getSessionId() });
  input.value = '';
  socket.emit('stop-typing', { topicId, sessionId: getSessionId() });
}

function showReportModal() {
  document.getElementById('reportModal').classList.add('active');
}

function hideReportModal() {
  document.getElementById('reportModal').classList.remove('active');
  document.getElementById('reportForm').reset();
}

// Utility functions
function escape(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const diff = Date.now() - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString('id-ID');
}

// Close modals on outside click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});
