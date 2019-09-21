import { Op } from 'sequelize';
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import Notification from '../schemas/Notification';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async index(req, res) {
    const mySubscriptions = await Subscription.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          attributes: ['title', 'description', 'location', 'date'],
          required: true,
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(mySubscriptions);
  }

  async store(req, res) {
    const user = await User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: [User],
    });

    // console.log('print');
    console.log(await Meetup.findByPk(req.params.meetupId));
    // console.log(meetup);

    /**
     * Does not allow you to subscribe to the meetup itself.
     * Não permite se inscrever no próprio meetup.
     */
    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to you own meetups." });
    }

    /**
     * Does not allow you to sign up for past meetups.
     * Não permite se inscrever em meetups passados.
     */
    if (meetup.past) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to past meetups." });
    }

    /**
     * Checks if you have attendance at another meetup at the same time.
     * Verifica se possui participação em outro meetup no mesmo horário.
     */
    const checkDate = await Subscription.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    /**
     * Does not allow you to sign up for 2 or more meetings at the same time.
     * Não permite se inscrever em 2 ou mais encontros ao mesmo tempo.
     */
    if (checkDate) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time." });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });

    const formattedDate = format(
      meetup.date,
      "'dia' dd 'de' MMMM 'de' yyyy', às' H:mm'h'",
      { locale: pt }
    );

    /**
     * Stores notification in Mongo database.
     * Armazena notificação no banco Mongo.
     */
    await Notification.create({
      content: `O usuário ${user.name} acabou de se inscrever em ${meetup.title} para o ${formattedDate}`,
      user: meetup.user_id,
    });

    const countSubs = await Subscription.count({
      where: {
        meetup_id: meetup.id,
      },
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
      countSubs,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
