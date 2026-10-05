const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { initDB } = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Initialize Database
initDB();

// Mount Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Node Gateway Server is up and running with Socket.io Collaborative Sync!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Node Gateway', socket: 'active' });
});

// In-memory Collaboration Room State
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      documentContent: `# Collaborative Research Paper\n\n**Workspace Room**: \`${roomId}\`\n\nWelcome to the real-time co-authoring workspace. Any changes made in this editor will instantly sync across all connected researchers in this session.\n\n### Executive Summary\n- Multi-Agent Autonomous Pipeline integration\n- Real-time WebSocket document sync\n- Concurrent co-authoring and live chat`,
      users: new Map(),
      messages: [],
    });
  }
  return rooms.get(roomId);
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('join_room', ({ roomId, user }) => {
    if (!roomId) return;
    
    // Leave previous room if any
    if (currentRoom && currentRoom !== roomId) {
      socket.leave(currentRoom);
      const roomData = rooms.get(currentRoom);
      if (roomData) {
        roomData.users.delete(socket.id);
        io.to(currentRoom).emit('presence_update', Array.from(roomData.users.values()));
      }
    }

    currentRoom = roomId;
    currentUser = user || { name: 'Het Bhimani', avatar: '👨‍💻', color: '#F2A900' };
    socket.join(roomId);

    const room = getOrCreateRoom(roomId);
    room.users.set(socket.id, { socketId: socket.id, ...currentUser });

    const activeUsers = Array.from(room.users.values());

    // Send room snapshot to joining user
    socket.emit('room_joined', {
      roomId,
      documentContent: room.documentContent,
      users: activeUsers,
      messages: room.messages,
    });

    // Notify room of presence update
    io.to(roomId).emit('presence_update', activeUsers);
  });

  socket.on('document_update', ({ roomId, content, updatedBy }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.documentContent = content;
      socket.to(roomId).emit('document_sync', { content, updatedBy });
    }
  });

  socket.on('cursor_position', ({ roomId, user, position }) => {
    socket.to(roomId).emit('cursor_sync', { user, position });
  });

  socket.on('send_room_message', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (room) {
      const msgObj = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        user: message.user || currentUser || { name: 'Researcher' },
        text: message.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      room.messages.push(msgObj);
      if (room.messages.length > 100) room.messages.shift();
      io.to(roomId).emit('new_room_message', msgObj);
    }
  });

  socket.on('leave_room', ({ roomId }) => {
    if (roomId && rooms.has(roomId)) {
      socket.leave(roomId);
      const room = rooms.get(roomId);
      room.users.delete(socket.id);
      io.to(roomId).emit('presence_update', Array.from(room.users.values()));
    }
    currentRoom = null;
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.users.delete(socket.id);
      io.to(currentRoom).emit('presence_update', Array.from(room.users.values()));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Gateway server with WebSocket support running on http://localhost:${PORT}`);
});