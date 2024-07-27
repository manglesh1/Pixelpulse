const db = require('../models');
const Notification = db.Notification;

exports.create = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).send(notification);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const notifications = await Notification.findAll();
    res.status(200).send(notifications);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).send({ message: 'Notification not found' });
    }
    res.status(200).send(notification);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await Notification.update(req.body, {
      where: { NotificationID: req.params.id }
    });
    if (!updated) {
      return res.status(404).send({ message: 'Notification not found' });
    }
    const updatedNotification = await Notification.findByPk(req.params.id);
    res.status(200).send(updatedNotification);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await Notification.destroy({
      where: { NotificationID: req.params.id }
    });
    if (!deleted) {
      return res.status(404).send({ message: 'Notification not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
