import Meetup from '../models/Meetup';
import Notification from '../schemas/Notification';

class NotificationController {
  async index(req, res) {
    const checkIsOrganizer = await Meetup.findOne({
      where: { user_id: req.userId },
    });

    if (!checkIsOrganizer) {
      return res
        .status(400)
        .json({ error: 'Only organizer can load notifications.' });
    }

    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);

    return res.json(notifications);
  }

  async update(req, res) {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    return res.json(notification);
  }
}

export default new NotificationController();
