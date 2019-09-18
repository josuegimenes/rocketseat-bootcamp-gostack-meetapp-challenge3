import Notification from '../schemas/Notification';
import Meetup from '../models/Meetup';

class NotificationController {
  async index(req, res) {
    const checkIsProvider = await Meetup.findOne({
      where: { user_id: req.userId },
    });

    if (!checkIsProvider) {
      return res
        .status(400)
        .json({ error: 'Only provider can load notifications.' });
    }

    const notifications = await Notification.find({
      user_id: req.userId,
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
