const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireWorkspacePermission } = require('../middleware/workspaceAuth');
const { PERMISSIONS } = require('../middleware/permissions');
const {
  sequelize,
  ResearchWorkspace,
  WorkspaceMember,
  User,
  ActivityLog,
  Notification,
} = require('../db');

const router = express.Router();

// 1. Get Workspace Details
router.get('/:workspaceId', verifyToken, requireWorkspacePermission(PERMISSIONS.DOCUMENT_VIEW), async (req, res) => {
  try {
    const workspace = await ResearchWorkspace.findByPk(req.workspace.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'fullName', 'email'] },
        {
          model: WorkspaceMember,
          as: 'members',
          where: { status: 'ACTIVE' },
          include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
        },
      ],
    });

    return res.json({
      success: true,
      data: {
        workspace,
        currentRole: req.workspaceRole,
      },
    });
  } catch (err) {
    console.error('Get workspace error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 2. Get Workspace Members List
router.get('/:workspaceId/members', verifyToken, requireWorkspacePermission(PERMISSIONS.MEMBER_VIEW), async (req, res) => {
  try {
    const members = await WorkspaceMember.findAll({
      where: {
        workspaceId: req.workspace.id,
        status: 'ACTIVE',
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'createdAt'],
        },
      ],
      order: [['joinedAt', 'ASC']],
    });

    return res.json({
      success: true,
      data: members,
    });
  } catch (err) {
    console.error('Get members error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 3. Update Member Role (OWNER only)
router.patch('/:workspaceId/members/:memberId', verifyToken, requireWorkspacePermission(PERMISSIONS.MEMBER_ROLE_UPDATE), async (req, res) => {
  try {
    const { role } = req.body;
    const { memberId } = req.params;

    const validRoles = ['EDITOR', 'RESEARCHER', 'REVIEWER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'INVALID_ROLE', message: 'Valid roles are: EDITOR, RESEARCHER, REVIEWER, VIEWER' });
    }

    const member = await WorkspaceMember.findOne({
      where: { id: memberId, workspaceId: req.workspace.id },
      include: [{ model: User, as: 'user' }],
    });

    if (!member) {
      return res.status(404).json({ error: 'MEMBER_NOT_FOUND', message: 'Workspace member not found.' });
    }

    if (member.role === 'OWNER') {
      return res.status(403).json({ error: 'CANNOT_DEMOTE_OWNER', message: 'Cannot change owner role directly. Use Transfer Ownership.' });
    }

    const oldRole = member.role;
    member.role = role;
    await member.save();

    // Log Activity
    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId: req.workspace.documentId,
      userId: req.user.id,
      action: 'ROLE_CHANGED',
      entityType: 'member',
      entityId: member.id,
      metadata: {
        targetUser: member.user ? member.user.fullName : member.userId,
        oldRole,
        newRole: role,
      },
    });

    // Notify user
    await Notification.create({
      userId: member.userId,
      workspaceId: req.workspace.id,
      type: 'ROLE_CHANGED',
      title: 'Workspace Role Updated',
      message: `Your role in "${req.workspace.name}" was changed to ${role} by ${req.user.fullName}.`,
      entityType: 'workspace',
      entityId: req.workspace.id,
    });

    return res.json({
      success: true,
      data: member,
    });
  } catch (err) {
    console.error('Update role error:', err);
    return res.status(500).json({ error: 'UPDATE_FAILED', message: err.message });
  }
});

// 4. Remove Member (OWNER only)
router.delete('/:workspaceId/members/:memberId', verifyToken, requireWorkspacePermission(PERMISSIONS.MEMBER_REMOVE), async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await WorkspaceMember.findOne({
      where: { id: memberId, workspaceId: req.workspace.id },
      include: [{ model: User, as: 'user' }],
    });

    if (!member) {
      return res.status(404).json({ error: 'MEMBER_NOT_FOUND', message: 'Member not found.' });
    }

    if (member.role === 'OWNER') {
      return res.status(403).json({ error: 'CANNOT_REMOVE_OWNER', message: 'Owner cannot be removed from workspace.' });
    }

    member.status = 'REMOVED';
    await member.save();

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId: req.workspace.documentId,
      userId: req.user.id,
      action: 'MEMBER_REMOVED',
      entityType: 'member',
      entityId: member.id,
      metadata: { targetUser: member.user ? member.user.fullName : member.userId },
    });

    await Notification.create({
      userId: member.userId,
      workspaceId: req.workspace.id,
      type: 'MEMBER_REMOVED',
      title: 'Removed from Workspace',
      message: `You were removed from "${req.workspace.name}".`,
      entityType: 'workspace',
      entityId: req.workspace.id,
    });

    return res.json({ success: true, message: 'Member removed successfully.' });
  } catch (err) {
    console.error('Remove member error:', err);
    return res.status(500).json({ error: 'REMOVE_FAILED', message: err.message });
  }
});

// 5. Leave Workspace (Self)
router.post('/:workspaceId/leave', verifyToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await ResearchWorkspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found.' });
    }

    if (workspace.ownerId === req.user.id) {
      return res.status(403).json({
        error: 'OWNER_CANNOT_LEAVE',
        message: 'Owner cannot leave workspace. Please transfer ownership first.',
      });
    }

    const member = await WorkspaceMember.findOne({
      where: { workspaceId, userId: req.user.id, status: 'ACTIVE' },
    });

    if (!member) {
      return res.status(400).json({ error: 'NOT_A_MEMBER', message: 'You are not a member of this workspace.' });
    }

    member.status = 'REMOVED';
    await member.save();

    await ActivityLog.create({
      workspaceId,
      documentId: workspace.documentId,
      userId: req.user.id,
      action: 'MEMBER_LEFT',
      entityType: 'member',
      entityId: member.id,
      metadata: { user: req.user.fullName },
    });

    return res.json({ success: true, message: 'You have left the workspace.' });
  } catch (err) {
    console.error('Leave workspace error:', err);
    return res.status(500).json({ error: 'LEAVE_FAILED', message: err.message });
  }
});

// 6. Transfer Ownership (Transactional)
router.post('/:workspaceId/transfer-ownership', verifyToken, requireWorkspacePermission(PERMISSIONS.OWNER_TRANSFER), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      await t.rollback();
      return res.status(400).json({ error: 'TARGET_USER_REQUIRED', message: 'Target user ID required.' });
    }

    if (targetUserId === req.user.id) {
      await t.rollback();
      return res.status(400).json({ error: 'ALREADY_OWNER', message: 'You are already the owner.' });
    }

    // Validate new owner is an active member
    const targetMember = await WorkspaceMember.findOne({
      where: { workspaceId: req.workspace.id, userId: targetUserId, status: 'ACTIVE' },
      transaction: t,
    });

    if (!targetMember) {
      await t.rollback();
      return res.status(404).json({ error: 'TARGET_NOT_MEMBER', message: 'Target user must be an active member of this workspace.' });
    }

    // Current owner becomes EDITOR
    const currentOwnerMember = await WorkspaceMember.findOne({
      where: { workspaceId: req.workspace.id, userId: req.user.id },
      transaction: t,
    });

    if (currentOwnerMember) {
      currentOwnerMember.role = 'EDITOR';
      await currentOwnerMember.save({ transaction: t });
    }

    // Target member becomes OWNER
    targetMember.role = 'OWNER';
    await targetMember.save({ transaction: t });

    // Update workspace ownerId
    const workspace = await ResearchWorkspace.findByPk(req.workspace.id, { transaction: t });
    workspace.ownerId = targetUserId;
    await workspace.save({ transaction: t });

    // Log Activity
    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId: req.workspace.documentId,
      userId: req.user.id,
      action: 'OWNERSHIP_TRANSFERRED',
      entityType: 'workspace',
      entityId: req.workspace.id,
      metadata: {
        from: req.user.fullName,
        toUserId: targetUserId,
      },
    }, { transaction: t });

    // Notify new owner
    await Notification.create({
      userId: targetUserId,
      workspaceId: req.workspace.id,
      type: 'OWNERSHIP_TRANSFERRED',
      title: 'Ownership Transferred',
      message: `You are now the Owner of "${req.workspace.name}".`,
      entityType: 'workspace',
      entityId: req.workspace.id,
    }, { transaction: t });

    await t.commit();
    return res.json({ success: true, message: 'Ownership transferred successfully.' });
  } catch (err) {
    await t.rollback();
    console.error('Transfer ownership error:', err);
    return res.status(500).json({ error: 'TRANSFER_FAILED', message: err.message });
  }
});

module.exports = router;
