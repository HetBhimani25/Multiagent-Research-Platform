const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireWorkspacePermission } = require('../middleware/workspaceAuth');
const { PERMISSIONS } = require('../middleware/permissions');
const {
  Task,
  User,
  ActivityLog,
  Notification,
  WorkspaceMember,
} = require('../db');

const router = express.Router();

// 1. Get Tasks for a Document
router.get('/documents/:documentId/tasks', verifyToken, requireWorkspacePermission(PERMISSIONS.DOCUMENT_VIEW), async (req, res) => {
  try {
    const { documentId } = req.params;

    const tasks = await Task.findAll({
      where: { documentId },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 2. Create Task
router.post('/documents/:documentId/tasks', verifyToken, requireWorkspacePermission(PERMISSIONS.TASK_CREATE), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title, description, assignedTo, priority = 'MEDIUM', sectionId, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'TITLE_REQUIRED', message: 'Task title is required.' });
    }

    const task = await Task.create({
      workspaceId: req.workspace.id,
      documentId,
      title: title.trim(),
      description: description || '',
      createdBy: req.user.id,
      assignedTo: assignedTo || null,
      priority,
      status: 'TODO',
      sectionId: sectionId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email'] },
      ],
    });

    if (assignedTo && assignedTo !== req.user.id) {
      await Notification.create({
        userId: assignedTo,
        workspaceId: req.workspace.id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `${req.user.fullName} assigned you a task: "${task.title}".`,
        entityType: 'task',
        entityId: task.id,
      });
    }

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId,
      userId: req.user.id,
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: task.id,
      metadata: { title: task.title, priority, assignedTo },
    });

    return res.status(201).json({ success: true, data: fullTask });
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ error: 'CREATE_FAILED', message: err.message });
  }
});

// 3. Update Task Status or Details
router.patch('/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, priority, title, description, assignedTo, dueDate } = req.body;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Task not found.' });
    }

    const member = await WorkspaceMember.findOne({
      where: { workspaceId: task.workspaceId, userId: req.user.id, status: 'ACTIVE' },
    });
    if (!member) {
      return res.status(403).json({ error: 'ACCESS_DENIED', message: 'You are not a member of this workspace.' });
    }

    const oldStatus = task.status;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      task.completedAt = new Date();
    }

    await task.save();

    await ActivityLog.create({
      workspaceId: task.workspaceId,
      documentId: task.documentId,
      userId: req.user.id,
      action: status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED',
      entityType: 'task',
      entityId: task.id,
      metadata: { title: task.title, oldStatus, newStatus: task.status },
    });

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'fullName', 'email'] },
      ],
    });

    return res.json({ success: true, data: fullTask });
  } catch (err) {
    console.error('Update task error:', err);
    return res.status(500).json({ error: 'UPDATE_FAILED', message: err.message });
  }
});

// 4. Delete Task
router.delete('/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Task not found.' });
    }

    const member = await WorkspaceMember.findOne({
      where: { workspaceId: task.workspaceId, userId: req.user.id, status: 'ACTIVE' },
    });
    if (!member) {
      return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Access denied.' });
    }

    await task.destroy();
    return res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete task error:', err);
    return res.status(500).json({ error: 'DELETE_FAILED', message: err.message });
  }
});

module.exports = router;
