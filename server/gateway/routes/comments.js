const express = require('express');
const { Op } = require('sequelize');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireWorkspacePermission } = require('../middleware/workspaceAuth');
const { PERMISSIONS } = require('../middleware/permissions');
const {
  Comment,
  User,
  ActivityLog,
  Notification,
  WorkspaceMember,
  ResearchWorkspace,
} = require('../db');

const router = express.Router();

// 1. Get Comments for a Document
router.get('/documents/:documentId/comments', verifyToken, requireWorkspacePermission(PERMISSIONS.DOCUMENT_VIEW), async (req, res) => {
  try {
    const { documentId } = req.params;

    const comments = await Comment.findAll({
      where: {
        documentId,
        parentCommentId: null, // Top-level comments
        status: { [Op.ne]: 'DELETED' },
      },
      include: [
        { model: User, as: 'author', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'resolver', attributes: ['id', 'fullName', 'email'] },
        {
          model: Comment,
          as: 'replies',
          where: {
            status: { [Op.ne]: 'DELETED' },
          },
          required: false,
          include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ success: true, data: comments });
  } catch (err) {
    console.error('Get comments error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 2. Create Comment
router.post('/documents/:documentId/comments', verifyToken, requireWorkspacePermission(PERMISSIONS.COMMENT_CREATE), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content, sectionId, parentCommentId, commentType = 'GENERAL' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'CONTENT_REQUIRED', message: 'Comment content cannot be empty.' });
    }

    const comment = await Comment.create({
      workspaceId: req.workspace.id,
      documentId,
      sectionId: sectionId || 'general',
      authorId: req.user.id,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
      commentType,
      status: 'OPEN',
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'email'] }],
    });

    // Check for @mentions in comment text
    const mentionMatches = content.match(/@(\w+)/g) || [];
    for (const match of mentionMatches) {
      const mentionedName = match.substring(1);
      // Find matching user in workspace
      const member = await WorkspaceMember.findOne({
        where: { workspaceId: req.workspace.id },
        include: [{ model: User, as: 'user', where: { fullName: mentionedName } }],
      });

      if (member && member.userId !== req.user.id) {
        await Notification.create({
          userId: member.userId,
          workspaceId: req.workspace.id,
          type: 'MENTION',
          title: 'You were mentioned in a comment',
          message: `${req.user.fullName} mentioned you in a comment on "${req.workspace.name}".`,
          entityType: 'comment',
          entityId: comment.id,
        });
      }
    }

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId,
      userId: req.user.id,
      action: 'COMMENT_CREATED',
      entityType: 'comment',
      entityId: comment.id,
      metadata: { sectionId: comment.sectionId, type: commentType },
    });

    return res.status(201).json({ success: true, data: fullComment });
  } catch (err) {
    console.error('Create comment error:', err);
    return res.status(500).json({ error: 'CREATE_FAILED', message: err.message });
  }
});

// 3. Resolve Comment
router.patch('/comments/:commentId/resolve', verifyToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findByPk(commentId);

    if (!comment || comment.status === 'DELETED') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Comment not found.' });
    }

    // Verify user is in the workspace
    const member = await WorkspaceMember.findOne({
      where: { workspaceId: comment.workspaceId, userId: req.user.id, status: 'ACTIVE' },
    });

    if (!member) {
      return res.status(403).json({ error: 'ACCESS_DENIED', message: 'You must be a workspace member to resolve comments.' });
    }

    comment.status = comment.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
    comment.resolvedAt = comment.status === 'RESOLVED' ? new Date() : null;
    comment.resolvedBy = comment.status === 'RESOLVED' ? req.user.id : null;
    await comment.save();

    await ActivityLog.create({
      workspaceId: comment.workspaceId,
      documentId: comment.documentId,
      userId: req.user.id,
      action: comment.status === 'RESOLVED' ? 'COMMENT_RESOLVED' : 'COMMENT_REOPENED',
      entityType: 'comment',
      entityId: comment.id,
    });

    return res.json({ success: true, data: comment });
  } catch (err) {
    console.error('Resolve comment error:', err);
    return res.status(500).json({ error: 'RESOLVE_FAILED', message: err.message });
  }
});

// 4. Delete Comment
router.delete('/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findByPk(commentId);

    if (!comment || comment.status === 'DELETED') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Comment not found.' });
    }

    // Check if user is author
    const isAuthor = comment.authorId === req.user.id;

    // Check workspace membership and roles
    let isOwner = false;
    const member = await WorkspaceMember.findOne({
      where: { workspaceId: comment.workspaceId, userId: req.user.id, status: 'ACTIVE' },
    });

    if (member && member.role === 'OWNER') {
      isOwner = true;
    }

    if (!isOwner) {
      const workspace = await ResearchWorkspace.findByPk(comment.workspaceId);
      if (workspace && workspace.ownerId === req.user.id) {
        isOwner = true;
      }
    }

    if (!isAuthor && !isOwner) {
      return res.status(403).json({ error: 'ACCESS_DENIED', message: 'Only the comment author or workspace owner can delete this comment.' });
    }

    comment.status = 'DELETED';
    await comment.save();

    // Also mark any child replies as DELETED
    await Comment.update(
      { status: 'DELETED' },
      { where: { parentCommentId: comment.id } }
    );

    await ActivityLog.create({
      workspaceId: comment.workspaceId,
      documentId: comment.documentId,
      userId: req.user.id,
      action: 'COMMENT_DELETED',
      entityType: 'comment',
      entityId: comment.id,
    });

    return res.json({ success: true, message: 'Comment deleted successfully.' });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ error: 'DELETE_FAILED', message: err.message });
  }
});

module.exports = router;
