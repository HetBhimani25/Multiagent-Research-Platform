const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireWorkspacePermission } = require('../middleware/workspaceAuth');
const { PERMISSIONS } = require('../middleware/permissions');
const {
  ResearchDocument,
  ResearchWorkspace,
  WorkspaceMember,
  DocumentVersion,
  ActivityLog,
  User,
  DocumentLock,
} = require('../db');

const router = express.Router();

// 1. Create a New Research Document (and its automatic Workspace + Owner membership)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { topic, report, depth, format, status, docType, mermaidDiagram, metadata } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'TOPIC_REQUIRED', message: 'Topic is required to create a document.' });
    }

    const doc = await ResearchDocument.create({
      ownerId: req.user.id,
      topic: topic.trim(),
      report: report || '',
      depth: depth || 'deep',
      format: format || 'markdown',
      docType: docType || 'research_paper',
      status: status || 'DRAFT',
      mermaidDiagram: mermaidDiagram || null,
      metadata: metadata || {},
    });

    const workspace = await ResearchWorkspace.create({
      name: `Workspace: ${doc.topic}`,
      description: `Collaborative research environment for "${doc.topic}"`,
      ownerId: req.user.id,
      documentId: doc.id,
      status: 'ACTIVE',
      visibility: 'PRIVATE',
    });

    await WorkspaceMember.create({
      workspaceId: workspace.id,
      userId: req.user.id,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date(),
    });

    // Create Initial Version v1
    await DocumentVersion.create({
      documentId: doc.id,
      workspaceId: workspace.id,
      versionNumber: 1,
      createdBy: req.user.id,
      content: doc.report,
      changeSummary: 'Initial document draft created.',
      metadata: { initial: true },
    });

    // Log Activity
    await ActivityLog.create({
      workspaceId: workspace.id,
      documentId: doc.id,
      userId: req.user.id,
      action: 'WORKSPACE_CREATED',
      entityType: 'document',
      entityId: doc.id,
      metadata: { topic: doc.topic },
    });

    return res.status(201).json({
      success: true,
      data: {
        document: doc,
        workspace,
      },
    });
  } catch (err) {
    console.error('Create document error:', err);
    return res.status(500).json({ error: 'CREATE_FAILED', message: err.message });
  }
});

// 2. Migrate Papers from localStorage
router.post('/migrate', verifyToken, async (req, res) => {
  try {
    const { papers } = req.body;
    if (!Array.isArray(papers) || papers.length === 0) {
      return res.json({ success: true, migratedCount: 0 });
    }

    let migratedCount = 0;
    for (const p of papers) {
      if (!p.topic) continue;

      // Check if already migrated by topic & owner
      const existing = await ResearchDocument.findOne({
        where: { ownerId: req.user.id, topic: p.topic.trim() },
      });

      if (!existing) {
        const doc = await ResearchDocument.create({
          ownerId: req.user.id,
          topic: p.topic.trim(),
          report: p.report || '',
          depth: p.depth || 'deep',
          format: p.format || 'markdown',
          docType: p.docType || 'research_paper',
          status: 'DRAFT',
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        });

        const workspace = await ResearchWorkspace.create({
          name: `Workspace: ${doc.topic}`,
          ownerId: req.user.id,
          documentId: doc.id,
          status: 'ACTIVE',
          visibility: 'PRIVATE',
        });

        await WorkspaceMember.create({
          workspaceId: workspace.id,
          userId: req.user.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        });

        await DocumentVersion.create({
          documentId: doc.id,
          workspaceId: workspace.id,
          versionNumber: 1,
          createdBy: req.user.id,
          content: doc.report,
          changeSummary: 'Migrated from local storage library.',
        });

        migratedCount++;
      }
    }

    return res.json({ success: true, migratedCount });
  } catch (err) {
    console.error('Migration error:', err);
    return res.status(500).json({ error: 'MIGRATION_FAILED', message: err.message });
  }
});

// 3. Get All Documents (Owned + Shared with current user)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find memberships where user is active
    const memberships = await WorkspaceMember.findAll({
      where: { userId, status: 'ACTIVE' },
      include: [
        {
          model: ResearchWorkspace,
          as: 'workspace',
          where: { status: 'ACTIVE' },
          include: [
            {
              model: ResearchDocument,
              as: 'document',
            },
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'fullName', 'email'],
            },
            {
              model: WorkspaceMember,
              as: 'members',
              where: { status: 'ACTIVE' },
              attributes: ['id', 'userId', 'role'],
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'fullName', 'email'],
                },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const owned = [];
    const sharedWithMe = [];

    for (const m of memberships) {
      if (!m.workspace || !m.workspace.document) continue;

      const doc = m.workspace.document;
      const docItem = {
        id: doc.id,
        topic: doc.topic,
        report: doc.report,
        depth: doc.depth,
        format: doc.format,
        docType: doc.docType || 'research_paper',
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        workspaceId: m.workspace.id,
        workspaceName: m.workspace.name,
        role: m.role,
        isOwner: m.role === 'OWNER',
        owner: m.workspace.owner,
        collaboratorCount: m.workspace.members ? m.workspace.members.length : 1,
        members: m.workspace.members || [],
      };

      if (m.role === 'OWNER') {
        owned.push(docItem);
      } else {
        sharedWithMe.push(docItem);
      }
    }

    return res.json({
      success: true,
      data: {
        owned,
        sharedWithMe,
        all: [...owned, ...sharedWithMe],
      },
    });
  } catch (err) {
    console.error('List documents error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 4. Get a Single Document by ID (requires DOCUMENT_VIEW permission)
router.get('/:documentId', verifyToken, requireWorkspacePermission(PERMISSIONS.DOCUMENT_VIEW), async (req, res) => {
  try {
    const doc = req.workspace.document;

    // Fetch latest versions
    const versions = await DocumentVersion.findAll({
      where: { documentId: doc.id },
      order: [['versionNumber', 'DESC']],
      limit: 10,
    });

    // Check active lock
    const activeLock = await DocumentLock.findOne({
      where: { documentId: doc.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
    });

    return res.json({
      success: true,
      data: {
        document: doc,
        workspace: req.workspace,
        role: req.workspaceRole,
        versions,
        lock: activeLock && new Date(activeLock.expiresAt) > new Date() ? activeLock : null,
      },
    });
  } catch (err) {
    console.error('Get document details error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 5. Update Document Content (requires DOCUMENT_EDIT permission with optimistic concurrency)
router.patch('/:documentId', verifyToken, requireWorkspacePermission(PERMISSIONS.DOCUMENT_EDIT), async (req, res) => {
  try {
    const { report, baseVersion, changeSummary, sectionId } = req.body;
    const doc = req.workspace.document;

    // Check if document is FINAL / locked
    if (doc.status === 'FINAL' && req.workspaceRole !== 'OWNER') {
      return res.status(403).json({
        error: 'DOCUMENT_FINALIZED',
        message: 'This document has been marked FINAL and is locked for edits.',
      });
    }

    // Get current version count
    const latestVersion = await DocumentVersion.findOne({
      where: { documentId: doc.id },
      order: [['versionNumber', 'DESC']],
    });

    const currentVersionNum = latestVersion ? latestVersion.versionNumber : 1;

    // Optimistic Concurrency check
    if (baseVersion !== undefined && baseVersion !== currentVersionNum) {
      return res.status(409).json({
        error: 'DOCUMENT_CONFLICT',
        message: 'Someone else updated this section while you were editing.',
        latestVersion: currentVersionNum,
        submittedVersion: baseVersion,
        currentContent: doc.report,
      });
    }

    // Update document content
    doc.report = report;
    await doc.save();

    const newVersionNum = currentVersionNum + 1;

    // Create new version snapshot if summary is specified or every ~5th edit
    let createdVersion = null;
    if (changeSummary || newVersionNum % 3 === 0) {
      createdVersion = await DocumentVersion.create({
        documentId: doc.id,
        workspaceId: req.workspace.id,
        versionNumber: newVersionNum,
        createdBy: req.user.id,
        content: report,
        changeSummary: changeSummary || `Edited by ${req.user.fullName}`,
        metadata: { sectionId: sectionId || 'general' },
      });
    }

    // Log Activity
    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId: doc.id,
      userId: req.user.id,
      action: 'DOCUMENT_EDITED',
      entityType: 'document',
      entityId: doc.id,
      metadata: {
        version: newVersionNum,
        summary: changeSummary || 'Content updated',
      },
    });

    return res.json({
      success: true,
      data: {
        document: doc,
        versionNumber: newVersionNum,
        version: createdVersion,
      },
    });
  } catch (err) {
    console.error('Update document error:', err);
    return res.status(500).json({ error: 'UPDATE_FAILED', message: err.message });
  }
});

// 6. Update Document Status Lifecycle (requires SETTINGS_EDIT or OWNER)
router.patch('/:documentId/status', verifyToken, requireWorkspacePermission(PERMISSIONS.SETTINGS_EDIT), async (req, res) => {
  try {
    const { status } = req.body;
    const doc = req.workspace.document;

    const validStatuses = ['DRAFT', 'RESEARCHING', 'WRITING', 'COLLABORATING', 'IN_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'FINAL', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'INVALID_STATUS', message: 'Invalid status specified.' });
    }

    const oldStatus = doc.status;
    doc.status = status;
    await doc.save();

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId: doc.id,
      userId: req.user.id,
      action: status === 'FINAL' ? 'DOCUMENT_FINALIZED' : oldStatus === 'FINAL' ? 'DOCUMENT_REOPENED' : 'STATUS_CHANGED',
      entityType: 'document',
      entityId: doc.id,
      metadata: { oldStatus, newStatus: status },
    });

    return res.json({
      success: true,
      data: { document: doc },
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ error: 'STATUS_UPDATE_FAILED', message: err.message });
  }
});

// 7. Delete Document (requires DOCUMENT_DELETE permission, OWNER only)
router.delete('/:documentId', verifyToken, requireWorkspacePermission(PERMISSIONS.DOCUMENT_DELETE), async (req, res) => {
  try {
    const doc = req.workspace?.document || await ResearchDocument.findByPk(req.params.documentId);
    if (doc) {
      await doc.destroy(); // soft-delete
    }

    if (req.workspace) {
      req.workspace.status = 'DELETED';
      await req.workspace.save();
      await req.workspace.destroy();
    }

    if (req.workspace && doc) {
      await ActivityLog.create({
        workspaceId: req.workspace.id,
        documentId: doc.id,
        userId: req.user.id,
        action: 'DOCUMENT_DELETED',
        entityType: 'document',
        entityId: doc.id,
        metadata: { topic: doc.topic },
      }).catch(err => console.warn('ActivityLog error on delete:', err.message));
    }

    return res.json({ success: true, message: 'Document and workspace deleted successfully.' });
  } catch (err) {
    console.error('Delete document error:', err);
    return res.status(500).json({ error: 'DELETE_FAILED', message: err.message });
  }
});

module.exports = router;
