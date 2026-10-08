const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { Notification } = require('../db');

const router = express.Router();

// 1. Get User Notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 2. Mark Single Notification Read
router.patch('/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOne({
      where: { id: notificationId, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found.' });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({ success: true, data: notification });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'UPDATE_FAILED', message: err.message });
  }
});

// 3. Mark All Notifications Read
router.post('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ error: 'UPDATE_FAILED', message: err.message });
  }
});

module.exports = router;
