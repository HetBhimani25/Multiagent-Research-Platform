const express = require('express');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireWorkspacePermission } = require('../middleware/workspaceAuth');
const { PERMISSIONS } = require('../middleware/permissions');
const {
  ResearchWorkspace,
  ResearchDocument,
  WorkspaceMember,
  WorkspaceInvitation,
  User,
  ActivityLog,
  Notification,
} = require('../db');

const router = express.Router();

// In-memory rate-limiter for invitation code attempts (max 10 attempts per minute)
const failedAttempts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const record = failedAttempts.get(ip) || { count: 0, resetTime: now + 60000 };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + 60000;
  }

  if (record.count >= 10) {
    return false;
  }
  return true;
}

function recordFailedAttempt(ip) {
  const record = failedAttempts.get(ip) || { count: 0, resetTime: Date.now() + 60000 };
  record.count += 1;
  failedAttempts.set(ip, record);
}

// 1. Generate Invite Link (Owner only)
router.post('/workspaces/:workspaceId/invitations/link', verifyToken, requireWorkspacePermission(PERMISSIONS.MEMBER_INVITE), async (req, res) => {
  try {
    const { role = 'EDITOR', expiresInDays = 7, maxUses = 5 } = req.body;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (parseInt(expiresInDays, 10) || 7));

    const invitation = await WorkspaceInvitation.create({
      workspaceId: req.workspace.id,
      invitedBy: req.user.id,
      inviteType: 'LINK',
      tokenHash,
      role,
      status: 'ACTIVE',
      expiresAt,
      maxUses: parseInt(maxUses, 10) || 5,
      usesCount: 0,
    });

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId: req.workspace.documentId,
      userId: req.user.id,
      action: 'MEMBER_INVITED',
      entityType: 'invitation',
      entityId: invitation.id,
      metadata: { type: 'LINK', role, expiresAt },
    });

    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    const inviteLink = `${clientOrigin}/invite/${rawToken}`;

    return res.status(201).json({
      success: true,
      data: {
        id: invitation.id,
        rawToken,
        inviteLink,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        maxUses: invitation.maxUses,
      },
    });
  } catch (err) {
    console.error('Generate invite link error:', err);
    return res.status(500).json({ error: 'GENERATE_FAILED', message: err.message });
  }
});

// 2. Generate Invite Code (Owner only)
router.post('/workspaces/:workspaceId/invitations/code', verifyToken, requireWorkspacePermission(PERMISSIONS.MEMBER_INVITE), async (req, res) => {
  try {
    const { role = 'EDITOR', expiresInHours = 24, maxUses = 10 } = req.body;

    // Generate human-friendly code: RSH-XXXX-YYYY
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const cleanCode = `RSH-${part1}-${part2}`;
    const codeHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (parseInt(expiresInHours, 10) || 24));

    const invitation = await WorkspaceInvitation.create({
      workspaceId: req.workspace.id,
      invitedBy: req.user.id,
      inviteType: 'CODE',
      codeHash,
      inviteCode: cleanCode,
      role,
      status: 'ACTIVE',
      expiresAt,
      maxUses: parseInt(maxUses, 10) || 10,
      usesCount: 0,
    });

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId: req.workspace.documentId,
      userId: req.user.id,
      action: 'MEMBER_INVITED',
      entityType: 'invitation',
      entityId: invitation.id,
      metadata: { type: 'CODE', code: cleanCode, role, expiresAt },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: invitation.id,
        inviteCode: cleanCode,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        maxUses: invitation.maxUses,
      },
    });
  } catch (err) {
    console.error('Generate invite code error:', err);
    return res.status(500).json({ error: 'GENERATE_FAILED', message: err.message });
  }
});

// 3. Get Workspace Invitations List (Owner only)
router.get('/workspaces/:workspaceId/invitations', verifyToken, requireWorkspacePermission(PERMISSIONS.MEMBER_INVITE), async (req, res) => {
  try {
    const invitations = await WorkspaceInvitation.findAll({
      where: { workspaceId: req.workspace.id },
      include: [{ model: User, as: 'inviter', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: invitations,
    });
  } catch (err) {
    console.error('Get invitations error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 4. Revoke Invitation (Owner only)
router.delete('/workspaces/:workspaceId/invitations/:invitationId', verifyToken, requireWorkspacePermission(PERMISSIONS.MEMBER_INVITE), async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await WorkspaceInvitation.findOne({
      where: { id: invitationId, workspaceId: req.workspace.id },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND', message: 'Invitation not found.' });
    }

    invitation.status = 'REVOKED';
    invitation.revokedAt = new Date();
    await invitation.save();

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId: req.workspace.documentId,
      userId: req.user.id,
      action: 'INVITE_REVOKED',
      entityType: 'invitation',
      entityId: invitation.id,
    });

    return res.json({ success: true, message: 'Invitation revoked successfully.' });
  } catch (err) {
    console.error('Revoke invitation error:', err);
    return res.status(500).json({ error: 'REVOKE_FAILED', message: err.message });
  }
});

// ── Public & Acceptance Routes ──

// 5. Inspect / Validate Invite Link Token
router.get('/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await WorkspaceInvitation.findOne({
      where: { tokenHash },
      include: [
        {
          model: ResearchWorkspace,
          as: 'workspace',
          include: [{ model: ResearchDocument, as: 'document' }],
        },
        { model: User, as: 'inviter', attributes: ['id', 'fullName', 'email'] },
      ],
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND', message: 'Invalid invitation link.' });
    }

    if (invitation.status === 'REVOKED') {
      return res.status(410).json({ error: 'INVITATION_REVOKED', message: 'This invitation has been revoked.' });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      return res.status(410).json({ error: 'INVITATION_EXPIRED', message: 'This invitation link has expired.' });
    }

    if (invitation.maxUses && invitation.usesCount >= invitation.maxUses) {
      invitation.status = 'LIMIT_REACHED';
      await invitation.save();
      return res.status(410).json({ error: 'INVITATION_LIMIT_REACHED', message: 'This invitation has reached its maximum uses.' });
    }

    return res.json({
      success: true,
      data: {
        workspaceId: invitation.workspace.id,
        workspaceName: invitation.workspace.name,
        documentTitle: invitation.workspace.document ? invitation.workspace.document.topic : 'Research Document',
        invitedBy: invitation.inviter ? invitation.inviter.fullName : 'A Collaborator',
        assignedRole: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (err) {
    console.error('Validate invite link error:', err);
    return res.status(500).json({ error: 'VALIDATION_FAILED', message: err.message });
  }
});

// 6. Accept Invite Link Token (Authenticated)
router.post('/invitations/:token/accept', verifyToken, async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await WorkspaceInvitation.findOne({
      where: { tokenHash, status: 'ACTIVE' },
      include: [{ model: ResearchWorkspace, as: 'workspace' }],
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVITATION_NOT_FOUND', message: 'Invalid or expired invitation link.' });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      return res.status(410).json({ error: 'INVITATION_EXPIRED', message: 'This invitation link has expired.' });
    }

    if (invitation.maxUses && invitation.usesCount >= invitation.maxUses) {
      invitation.status = 'LIMIT_REACHED';
      await invitation.save();
      return res.status(410).json({ error: 'INVITATION_LIMIT_REACHED', message: 'Invitation usage limit reached.' });
    }

    // Check if user is already a member
    let member = await WorkspaceMember.findOne({
      where: { workspaceId: invitation.workspaceId, userId: req.user.id },
    });

    if (member && member.status === 'ACTIVE') {
      return res.json({
        success: true,
        message: 'You are already an active member of this workspace.',
        workspaceId: invitation.workspaceId,
      });
    }

    if (member) {
      member.status = 'ACTIVE';
      member.role = invitation.role;
      member.joinedAt = new Date();
      await member.save();
    } else {
      member = await WorkspaceMember.create({
        workspaceId: invitation.workspaceId,
        userId: req.user.id,
        role: invitation.role,
        status: 'ACTIVE',
        joinedAt: new Date(),
      });
    }

    // Update invitation uses
    invitation.usesCount += 1;
    if (invitation.maxUses && invitation.usesCount >= invitation.maxUses) {
      invitation.status = 'LIMIT_REACHED';
    }
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Log Activity
    await ActivityLog.create({
      workspaceId: invitation.workspaceId,
      documentId: invitation.workspace.documentId,
      userId: req.user.id,
      action: 'INVITE_ACCEPTED',
      entityType: 'member',
      entityId: member.id,
      metadata: { role: member.role, acceptedBy: req.user.fullName },
    });

    // Notify Owner
    await Notification.create({
      userId: invitation.workspace.ownerId,
      workspaceId: invitation.workspaceId,
      type: 'MEMBER_JOINED',
      title: 'New Collaborator Joined',
      message: `${req.user.fullName} joined "${invitation.workspace.name}" as ${member.role}.`,
      entityType: 'member',
      entityId: member.id,
    });

    return res.json({
      success: true,
      message: 'Invitation accepted! You have joined the workspace.',
      workspaceId: invitation.workspaceId,
      role: member.role,
    });
  } catch (err) {
    console.error('Accept invite link error:', err);
    return res.status(500).json({ error: 'ACCEPT_FAILED', message: err.message });
  }
});

// 7. Verify Invite Code (Rate-limited)
router.post('/invitations/verify-code', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: 'TOO_MANY_ATTEMPTS',
        message: 'Too many invalid attempts. Please wait 1 minute before trying again.',
      });
    }

    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'CODE_REQUIRED', message: 'Invitation code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const codeHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    const invitation = await WorkspaceInvitation.findOne({
      where: { codeHash, status: 'ACTIVE' },
      include: [
        {
          model: ResearchWorkspace,
          as: 'workspace',
          include: [{ model: ResearchDocument, as: 'document' }],
        },
        { model: User, as: 'inviter', attributes: ['id', 'fullName'] },
      ],
    });

    if (!invitation) {
      recordFailedAttempt(ip);
      return res.status(404).json({ error: 'INVALID_INVITATION_CODE', message: 'Invalid or inactive invitation code.' });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      return res.status(410).json({ error: 'INVITATION_EXPIRED', message: 'This invitation code has expired.' });
    }

    if (invitation.maxUses && invitation.usesCount >= invitation.maxUses) {
      invitation.status = 'LIMIT_REACHED';
      await invitation.save();
      return res.status(410).json({ error: 'INVITATION_LIMIT_REACHED', message: 'This code has reached maximum uses.' });
    }

    return res.json({
      success: true,
      data: {
        code: cleanCode,
        workspaceId: invitation.workspace.id,
        workspaceName: invitation.workspace.name,
        documentTitle: invitation.workspace.document ? invitation.workspace.document.topic : 'Research Document',
        invitedBy: invitation.inviter ? invitation.inviter.fullName : 'Owner',
        assignedRole: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (err) {
    console.error('Verify invite code error:', err);
    return res.status(500).json({ error: 'VERIFY_FAILED', message: err.message });
  }
});

// 8. Accept Invite Code (Authenticated)
router.post('/invitations/accept-code', verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'CODE_REQUIRED', message: 'Invitation code required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const codeHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    const invitation = await WorkspaceInvitation.findOne({
      where: { codeHash, status: 'ACTIVE' },
      include: [{ model: ResearchWorkspace, as: 'workspace' }],
    });

    if (!invitation) {
      return res.status(404).json({ error: 'INVALID_INVITATION_CODE', message: 'Invalid invitation code.' });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      return res.status(410).json({ error: 'INVITATION_EXPIRED', message: 'This code has expired.' });
    }

    // Add or reactivate member
    let member = await WorkspaceMember.findOne({
      where: { workspaceId: invitation.workspaceId, userId: req.user.id },
    });

    if (member && member.status === 'ACTIVE') {
      return res.json({
        success: true,
        message: 'You are already an active member of this workspace.',
        workspaceId: invitation.workspaceId,
      });
    }

    if (member) {
      member.status = 'ACTIVE';
      member.role = invitation.role;
      member.joinedAt = new Date();
      await member.save();
    } else {
      member = await WorkspaceMember.create({
        workspaceId: invitation.workspaceId,
        userId: req.user.id,
        role: invitation.role,
        status: 'ACTIVE',
        joinedAt: new Date(),
      });
    }

    invitation.usesCount += 1;
    if (invitation.maxUses && invitation.usesCount >= invitation.maxUses) {
      invitation.status = 'LIMIT_REACHED';
    }
    invitation.acceptedAt = new Date();
    await invitation.save();

    await ActivityLog.create({
      workspaceId: invitation.workspaceId,
      documentId: invitation.workspace.documentId,
      userId: req.user.id,
      action: 'INVITE_ACCEPTED',
      entityType: 'member',
      entityId: member.id,
      metadata: { code: cleanCode, role: member.role },
    });

    await Notification.create({
      userId: invitation.workspace.ownerId,
      workspaceId: invitation.workspaceId,
      type: 'MEMBER_JOINED',
      title: 'New Collaborator Joined',
      message: `${req.user.fullName} joined "${invitation.workspace.name}" using code ${cleanCode}.`,
      entityType: 'member',
      entityId: member.id,
    });

    return res.json({
      success: true,
      message: 'Workspace joined successfully!',
      workspaceId: invitation.workspaceId,
      role: member.role,
    });
  } catch (err) {
    console.error('Accept code error:', err);
    return res.status(500).json({ error: 'ACCEPT_FAILED', message: err.message });
  }
});

module.exports = router;
