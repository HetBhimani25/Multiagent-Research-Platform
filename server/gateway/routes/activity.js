const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireWorkspacePermission } = require('../middleware/workspaceAuth');
const { PERMISSIONS } = require('../middleware/permissions');
const { ActivityLog, User } = require('../db');

const router = express.Router();

// Get Activity Feed for a Workspace (requires AUDIT_VIEW)
router.get('/workspaces/:workspaceId/activity', verifyToken, requireWorkspacePermission(PERMISSIONS.AUDIT_VIEW), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const activities = await ActivityLog.findAll({
      where: { workspaceId: req.workspace.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return res.json({ success: true, data: activities });
  } catch (err) {
    console.error('Get activity feed error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

module.exports = router;
