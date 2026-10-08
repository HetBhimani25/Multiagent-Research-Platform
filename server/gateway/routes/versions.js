const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireWorkspacePermission } = require('../middleware/workspaceAuth');
const { PERMISSIONS } = require('../middleware/permissions');
const {
  DocumentVersion,
  ResearchDocument,
  User,
  ActivityLog,
} = require('../db');

const router = express.Router();

// 1. Get All Versions for a Document
router.get('/documents/:documentId/versions', verifyToken, requireWorkspacePermission(PERMISSIONS.VERSION_VIEW), async (req, res) => {
  try {
    const { documentId } = req.params;

    const versions = await DocumentVersion.findAll({
      where: { documentId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] }],
      order: [['versionNumber', 'DESC']],
    });

    return res.json({ success: true, data: versions });
  } catch (err) {
    console.error('Get versions error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 2. Get Specific Version by ID
router.get('/documents/:documentId/versions/:versionId', verifyToken, requireWorkspacePermission(PERMISSIONS.VERSION_VIEW), async (req, res) => {
  try {
    const { documentId, versionId } = req.params;

    const version = await DocumentVersion.findOne({
      where: { id: versionId, documentId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] }],
    });

    if (!version) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Version not found.' });
    }

    return res.json({ success: true, data: version });
  } catch (err) {
    console.error('Get version error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 3. Create Manual Snapshot Version
router.post('/documents/:documentId/versions', verifyToken, requireWorkspacePermission(PERMISSIONS.VERSION_CREATE), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { changeSummary } = req.body;
    const doc = req.workspace.document;

    const latest = await DocumentVersion.findOne({
      where: { documentId },
      order: [['versionNumber', 'DESC']],
    });

    const nextVerNum = (latest ? latest.versionNumber : 0) + 1;

    const version = await DocumentVersion.create({
      documentId,
      workspaceId: req.workspace.id,
      versionNumber: nextVerNum,
      createdBy: req.user.id,
      content: doc.report,
      changeSummary: changeSummary || `Manual snapshot saved by ${req.user.fullName}`,
      metadata: { manualSnapshot: true },
    });

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId,
      userId: req.user.id,
      action: 'VERSION_CREATED',
      entityType: 'version',
      entityId: version.id,
      metadata: { versionNumber: nextVerNum, summary: version.changeSummary },
    });

    return res.status(201).json({ success: true, data: version });
  } catch (err) {
    console.error('Create version error:', err);
    return res.status(500).json({ error: 'CREATE_FAILED', message: err.message });
  }
});

// 4. Restore Version (Creates a new version with historical content)
router.post('/documents/:documentId/versions/:versionId/restore', verifyToken, requireWorkspacePermission(PERMISSIONS.VERSION_RESTORE), async (req, res) => {
  try {
    const { documentId, versionId } = req.params;
    const doc = req.workspace.document;

    const targetVersion = await DocumentVersion.findOne({
      where: { id: versionId, documentId },
    });

    if (!targetVersion) {
      return res.status(404).json({ error: 'TARGET_VERSION_NOT_FOUND', message: 'Target version not found.' });
    }

    // Apply content to document
    doc.report = targetVersion.content;
    await doc.save();

    // Determine new version number
    const latest = await DocumentVersion.findOne({
      where: { documentId },
      order: [['versionNumber', 'DESC']],
    });

    const newVerNum = (latest ? latest.versionNumber : 0) + 1;

    // Create new restored version record
    const restoredVersion = await DocumentVersion.create({
      documentId,
      workspaceId: req.workspace.id,
      versionNumber: newVerNum,
      createdBy: req.user.id,
      content: targetVersion.content,
      changeSummary: `Restored from Version ${targetVersion.versionNumber} by ${req.user.fullName}`,
      metadata: { restoredFromVersion: targetVersion.versionNumber },
    });

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId,
      userId: req.user.id,
      action: 'VERSION_RESTORED',
      entityType: 'version',
      entityId: restoredVersion.id,
      metadata: {
        restoredFrom: targetVersion.versionNumber,
        newVersionNumber: newVerNum,
      },
    });

    return res.json({
      success: true,
      message: `Successfully restored Version ${targetVersion.versionNumber} as Version ${newVerNum}.`,
      data: {
        document: doc,
        newVersion: restoredVersion,
      },
    });
  } catch (err) {
    console.error('Restore version error:', err);
    return res.status(500).json({ error: 'RESTORE_FAILED', message: err.message });
  }
});

module.exports = router;
