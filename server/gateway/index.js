const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { initDB } = require('./db');

// Route Handlers
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const workspaceRoutes = require('./routes/workspaces');
const invitationRoutes = require('./routes/invitations');
const commentRoutes = require('./routes/comments');
const taskRoutes = require('./routes/tasks');
const versionRoutes = require('./routes/versions');
const activityRoutes = require('./routes/activity');
const notificationRoutes = require('./routes/notifications');
const agentRunRoutes = require('./routes/agentRuns');
const lockRoutes = require('./routes/locks');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Initialize Database & Models
initDB();

// ── Mount REST API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces', activityRoutes);
app.use('/api/notifications', notificationRoutes);

// Multi-path collaboration routes (matching /api/documents/:id/... and /api/comments/:id, etc.)
app.use('/api', invitationRoutes);
app.use('/api', commentRoutes);
app.use('/api', taskRoutes);
app.use('/api', versionRoutes);
app.use('/api', agentRunRoutes);
app.use('/api', lockRoutes);

app.get('/', (req, res) => {
  res.send('Node Gateway Server is up and running with Real-time Multi-User Collaboration & PostgreSQL Persistence!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Node Gateway', socket: 'active', collaboration: 'enabled' });
});

// ── In-memory State & Real-time WebSockets ──
const rooms = new Map();
const workspacePresences = new Map(); // workspaceId -> Map(socketId -> userInfo)

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
  let currentWorkspaceId = null;

  // Workspace-Level Presence & Real-Time Sync
  socket.on('workspace_join', ({ workspaceId, user }) => {
    if (!workspaceId) return;
    currentWorkspaceId = workspaceId;
    currentUser = user || { name: 'Researcher', avatar: '👨‍💻', color: '#F2A900' };

    socket.join(`workspace_${workspaceId}`);

    if (!workspacePresences.has(workspaceId)) {
      workspacePresences.set(workspaceId, new Map());
    }
    const presMap = workspacePresences.get(workspaceId);
    presMap.set(socket.id, { socketId: socket.id, ...currentUser, lastActive: new Date() });

    const activeMembers = Array.from(presMap.values());
    io.to(`workspace_${workspaceId}`).emit('workspace_presence', activeMembers);
  });

  socket.on('workspace_broadcast_event', ({ workspaceId, event, data }) => {
    if (!workspaceId) return;
    socket.to(`workspace_${workspaceId}`).emit('workspace_event', {
      event,
      data,
      actor: currentUser,
      timestamp: new Date(),
    });
  });

  socket.on('workspace_leave', ({ workspaceId }) => {
    if (workspaceId && workspacePresences.has(workspaceId)) {
      socket.leave(`workspace_${workspaceId}`);
      const presMap = workspacePresences.get(workspaceId);
      presMap.delete(socket.id);
      io.to(`workspace_${workspaceId}`).emit('workspace_presence', Array.from(presMap.values()));
    }
    currentWorkspaceId = null;
  });

  // Editor Modal Room System (RF-COLLAB-XXXX)
  socket.on('join_room', ({ roomId, user }) => {
    if (!roomId) return;
    
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

    socket.emit('room_joined', {
      roomId,
      documentContent: room.documentContent,
      users: activeUsers,
      messages: room.messages,
    });

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
    if (currentWorkspaceId && workspacePresences.has(currentWorkspaceId)) {
      const presMap = workspacePresences.get(currentWorkspaceId);
      presMap.delete(socket.id);
      io.to(`workspace_${currentWorkspaceId}`).emit('workspace_presence', Array.from(presMap.values()));
    }
  });
});

// ── Global JSON 404 & Error Handlers (Guarantees API Never Returns HTML) ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled gateway server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: 'SERVER_ERROR',
    message: err.message || 'Internal server error occurred',
  });
});

server.listen(PORT, () => {
  console.log(`Gateway server with Real-time Multi-User Collaboration running on http://localhost:${PORT}`);
});