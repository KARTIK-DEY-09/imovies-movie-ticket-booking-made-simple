import express from 'express';
import { Notification } from '../models/index.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';

export const notificationsRouter = express.Router();

// GET /api/notifications
notificationsRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!._id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: err.message || 'Error fetching notifications' });
  }
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const notif = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Marked as read', notification: notif });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: err.message || 'Error marking notification as read' });
  }
});

// PATCH /api/notifications/read-all
notificationsRouter.patch('/read-all', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!._id;
    await Notification.updateMany({ userId }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    console.error('Error marking all as read:', err);
    res.status(500).json({ message: err.message || 'Error marking all as read' });
  }
});
