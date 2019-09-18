import Meetup from '../models/Meetup';

class OrganizingController {
  async index(req, res) {
    const myOrganizations = await Meetup.findAll({
      where: { user_id: req.userId },
    });

    return res.json(myOrganizations);
  }
}

export default new OrganizingController();
