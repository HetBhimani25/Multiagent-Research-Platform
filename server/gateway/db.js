const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const host = process.env.POSTGRES_HOST || 'localhost';
const port = process.env.POSTGRES_PORT || 5432;
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD;
const database = process.env.POSTGRES_DB || 'research_db';

if (!password) {
  throw new Error('POSTGRES_PASSWORD is not configured');
}

const sequelize = new Sequelize(database, user, password, {
  host: host,
  port: port,
  dialect: 'postgres',
  logging: false, // It won't prints SQL queries to the console -> it's reverse logging: console.log
  pool: {
    max: 10,
    min: 1,
    acquire: 30000, //30,000 milliseconds = 30 seconds used in connection waitlist
    idle: 10000, //10000 milliseconds = 10 seconds Sequelize can remove it from the pool after no use till 10 seconds
  },
  //  dialectOptions: {
    // Enable SSL in production if your PostgreSQL server requires it.
    // ssl: { require: true, rejectUnauthorized: true, },
  // }, This is particularly relevant when PostgreSQL database is hosted remotely/cloud-hosted
});

// 1. User Model
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  fullName: { type: DataTypes.STRING(100), allowNull: false,  validate: { notEmpty: true, len: [2, 100], }, },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, set(value) {
        this.setDataValue('email', value.trim().toLowerCase());
      }, validate: { isEmail: true, }, },
  password: { type: DataTypes.STRING(255), allowNull: false, },
}, { tableName: 'users', timestamps: true, });

// 2. ResearchDocument Model
const ResearchDocument = sequelize.define('ResearchDocument', { 
  id: {type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, },
  ownerId: { type: DataTypes.UUID, allowNull: false, },
  topic: { type: DataTypes.STRING(500), allowNull: false, },
  report: { type: DataTypes.TEXT, defaultValue: '', },
  depth: { type: DataTypes.STRING(20), defaultValue: 'deep', },
  format: { type: DataTypes.STRING(20),defaultValue: 'markdown', },
  status: { type: DataTypes.ENUM('DRAFT', 'RESEARCHING', 'WRITING', 'COLLABORATING', 'IN_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'FINAL', 'ARCHIVED'), defaultValue: 'DRAFT', },
  mermaidDiagram: { type: DataTypes.TEXT, },
  docType: { type: DataTypes.STRING(50), defaultValue: 'research_paper', },
  metadata: { type: DataTypes.JSONB, defaultValue: {}, },
}, { tableName: 'research_documents', timestamps: true, paranoid: true, });

// 3. ResearchWorkspace Model
const ResearchWorkspace = sequelize.define('ResearchWorkspace', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'ARCHIVED', 'DELETED'),
    defaultValue: 'ACTIVE',
  },
  visibility: {
    type: DataTypes.ENUM('PRIVATE', 'COLLABORATIVE'),
    defaultValue: 'PRIVATE',
  },
}, {
  tableName: 'research_workspaces',
  timestamps: true,
  paranoid: true,
});

// 4. WorkspaceMember Model
const WorkspaceMember = sequelize.define('WorkspaceMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('OWNER', 'EDITOR', 'RESEARCHER', 'REVIEWER', 'VIEWER'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED'),
    defaultValue: 'ACTIVE',
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  invitedAt: {
    type: DataTypes.DATE,
  },
  lastActiveAt: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'workspace_members',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['workspaceId', 'userId'] }
  ],
});

// 5. WorkspaceInvitation Model
const WorkspaceInvitation = sequelize.define('WorkspaceInvitation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  inviteType: {
    type: DataTypes.ENUM('LINK', 'CODE'),
    allowNull: false,
  },
  tokenHash: {
    type: DataTypes.STRING(128),
  },
  codeHash: {
    type: DataTypes.STRING(128),
  },
  inviteCode: {
    type: DataTypes.STRING(50),
  },
  targetEmail: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.ENUM('EDITOR', 'RESEARCHER', 'REVIEWER', 'VIEWER'),
    defaultValue: 'VIEWER',
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'REVOKED', 'ACCEPTED', 'LIMIT_REACHED'),
    defaultValue: 'ACTIVE',
  },
  expiresAt: {
    type: DataTypes.DATE,
  },
  maxUses: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  usesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  acceptedAt: {
    type: DataTypes.DATE,
  },
  revokedAt: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'workspace_invitations',
  timestamps: true,
});

// 6. DocumentVersion Model
const DocumentVersion = sequelize.define('DocumentVersion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  changeSummary: {
    type: DataTypes.STRING(500),
  },
}, {
  tableName: 'document_versions',
  timestamps: true,
  updatedAt: false,
});

// 7. Comment Model
const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  sectionId: {
    type: DataTypes.STRING,
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  parentCommentId: {
    type: DataTypes.UUID,
  },
  commentType: {
    type: DataTypes.ENUM('GENERAL', 'QUESTION', 'SUGGESTION', 'ISSUE', 'CITATION_REVIEW', 'CONTENT_REVIEW'),
    defaultValue: 'GENERAL',
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'RESOLVED', 'DELETED'),
    defaultValue: 'OPEN',
  },
  resolvedAt: {
    type: DataTypes.DATE,
  },
  resolvedBy: {
    type: DataTypes.UUID,
  },
}, {
  tableName: 'comments',
  timestamps: true,
});

// 8. Task Model
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assignedTo: {
    type: DataTypes.UUID,
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    defaultValue: 'MEDIUM',
  },
  status: {
    type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'TODO',
  },
  sectionId: {
    type: DataTypes.STRING,
  },
  dueDate: {
    type: DataTypes.DATE,
  },
  completedAt: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'tasks',
  timestamps: true,
});

// 9. AgentRun Model
const AgentRun = sequelize.define('AgentRun', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
  },
  documentId: {
    type: DataTypes.UUID,
  },
  initiatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  runType: {
    type: DataTypes.STRING(50),
    defaultValue: 'FULL_RESEARCH',
  },
  agentName: {
    type: DataTypes.STRING(50),
  },
  status: {
    type: DataTypes.ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'),
    defaultValue: 'QUEUED',
  },
  input: {
    type: DataTypes.JSONB,
  },
  output: {
    type: DataTypes.JSONB,
  },
  startedAt: {
    type: DataTypes.DATE,
  },
  completedAt: {
    type: DataTypes.DATE,
  },
  error: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'agent_runs',
  timestamps: true,
});

// 10. ActivityLog Model
const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
  },
  documentId: {
    type: DataTypes.UUID,
  },
  userId: {
    type: DataTypes.UUID,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING(50),
  },
  entityId: {
    type: DataTypes.UUID,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'activity_logs',
  timestamps: true,
  updatedAt: false,
});

// 11. Notification Model
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  workspaceId: {
    type: DataTypes.UUID,
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(300),
  },
  message: {
    type: DataTypes.TEXT,
  },
  entityType: {
    type: DataTypes.STRING(50),
  },
  entityId: {
    type: DataTypes.UUID,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  updatedAt: false,
});

// 12. DocumentLock Model
const DocumentLock = sequelize.define('DocumentLock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  sectionId: {
    type: DataTypes.STRING,
  },
  lockedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lockType: {
    type: DataTypes.ENUM('SECTION', 'DOCUMENT'),
    defaultValue: 'SECTION',
  },
  expiresAt: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'document_locks',
  timestamps: true,
  updatedAt: false,
});

// ── Relationships & Associations ──
ResearchDocument.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
ResearchDocument.hasOne(ResearchWorkspace, { as: 'workspace', foreignKey: 'documentId' });
ResearchWorkspace.belongsTo(ResearchDocument, { as: 'document', foreignKey: 'documentId' });
ResearchWorkspace.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

ResearchWorkspace.hasMany(WorkspaceMember, { as: 'members', foreignKey: 'workspaceId' });
WorkspaceMember.belongsTo(User, { as: 'user', foreignKey: 'userId' });
WorkspaceMember.belongsTo(ResearchWorkspace, { as: 'workspace', foreignKey: 'workspaceId' });

ResearchWorkspace.hasMany(WorkspaceInvitation, { as: 'invitations', foreignKey: 'workspaceId' });
WorkspaceInvitation.belongsTo(User, { as: 'inviter', foreignKey: 'invitedBy' });

ResearchDocument.hasMany(Comment, { as: 'comments', foreignKey: 'documentId' });
Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
Comment.belongsTo(User, { as: 'resolver', foreignKey: 'resolvedBy' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentCommentId' });

ResearchDocument.hasMany(Task, { as: 'tasks', foreignKey: 'documentId' });
Task.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });

ResearchDocument.hasMany(DocumentVersion, { as: 'versions', foreignKey: 'documentId' });
DocumentVersion.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

AgentRun.belongsTo(User, { as: 'initiator', foreignKey: 'initiatedBy' });
ActivityLog.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });
DocumentLock.belongsTo(User, { as: 'user', foreignKey: 'lockedBy' });

const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database connected successfully via Sequelize.');
    await sequelize.sync({ alter: true });
    console.log('All collaboration database models synchronized.');
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
  }
};

module.exports = {
  sequelize,
  User,
  ResearchDocument,
  ResearchWorkspace,
  WorkspaceMember,
  WorkspaceInvitation,
  DocumentVersion,
  Comment,
  Task,
  AgentRun,
  ActivityLog,
  Notification,
  DocumentLock,
  initDB,
};
