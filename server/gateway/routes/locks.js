const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireWorkspacePermission } = require('../middleware/workspaceAuth');
const { PERMISSIONS } = require('../middleware/permissions');
const { DocumentLock, User } = require('../db');

const router = express.Router();

// 1. Acquire or Refresh Section Lock
router.post('/documents/:documentId/locks', verifyToken, requireWorkspacePermission(PERMISSIONS.DOCUMENT_EDIT), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { sectionId = 'general', lockType = 'SECTION', durationMinutes = 5 } = req.body;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (parseInt(durationMinutes, 10) || 5));

    // Check existing lock for section
    const existing = await DocumentLock.findOne({
      where: { documentId, sectionId },
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
    });

    if (existing) {
      // Check if expired
      if (new Date(existing.expiresAt) > new Date()) {
        if (existing.lockedBy !== req.user.id) {
          return res.status(423).json({
            error: 'SECTION_LOCKED',
            message: `This section is currently locked by ${existing.user ? existing.user.fullName : 'another user'}.`,
            lockedBy: existing.user,
            expiresAt: existing.expiresAt,
          });
        }
        // Refresh own lock
        existing.expiresAt = expiresAt;
        await existing.save();
        return res.json({ success: true, data: existing });
      }
      // If expired, replace
      await existing.destroy();
    }

    const lock = await DocumentLock.create({
      documentId,
      sectionId,
      lockedBy: req.user.id,
      lockType,
      expiresAt,
    });

    const fullLock = await DocumentLock.findByPk(lock.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
    });

    return res.status(201).json({ success: true, data: fullLock });
  } catch (err) {
    console.error('Acquire lock error:', err);
    return res.status(500).json({ error: 'LOCK_FAILED', message: err.message });
  }
});

// 2. Release Lock
router.delete('/documents/:documentId/locks', verifyToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { sectionId = 'general' } = req.body;

    await DocumentLock.destroy({
      where: {
        documentId,
        sectionId,
        lockedBy: req.user.id,
      },
    });

    return res.json({ success: true, message: 'Lock released successfully.' });
  } catch (err) {
    console.error('Release lock error:', err);
    return res.status(500).json({ error: 'RELEASE_FAILED', message: err.message });
  }
});

module.exports = router;
