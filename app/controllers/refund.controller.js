const db = require("../models");
const Refund = db.refund;
const Op = db.Sequelize.Op;

// Create and Save a Refund
exports.create = async (req, res) => {
  if (req.body.reason === undefined) {
    const error = new Error("reason cannot be empty for refund!");
    error.statusCode = 400;
    throw error;
  } else if (req.body.paymentId === undefined) {
    const error = new Error("paymentId cannot be empty for refund");
    error.statusCode = 400;
    throw error;
  } else if (req.body.refundStatus === undefined) {
    const error = new Error("refundStatus cannot be empty for refund!" + req.body);
    error.statusCode = 400;
    throw error;
  }

  let refund = {
    reason: req.body.reason,
    details: req.body.details,
    refundStatus: req.body.refundStatus,
    paymentId: req.body.paymentId,
  };

  refund.requestDate = Date.now();

  try {
    const data = await Refund.create(refund);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Refund.",
    });
  }
};

// Retrieve all Refunds from the database
exports.findAll = async (req, res) => {
  try {
    const data = await Refund.findAll({
      include: [
        {
          model: db.payment,
          required: true,
          attributes: ["amount", "paymentStatus"],
          include: [
            {
              model: db.user,
              as: "user",
              required: true,
              attributes: ["firstName", "lastName", "email"],
            },
          ],
          as: "payment",
        },
      ],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving refunds.",
    });
  }
};

// Retrieve all Refunds for a user
exports.findForUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const data = await Refund.findAll({
      include: [
        {
          model: db.payment,
          required: true,
          as: "payment",
          where: { userId: userId },
          attributes: ["id", "amount", "paymentStatus"],
          include: [
            {
              model: db.user,
              as: "user",
              required: true,
              attributes: ["firstName", "lastName", "email"],
            },
          ],
        },
      ],
      order: [["requestDate", "DESC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving refunds with userId = " + userId,
    });
  }
};

// Find a single Refund with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Refund.findByPk(id, {
      include: [
        {
          model: db.payment,
          required: true,
          attributes: ["amount", "paymentStatus"],
          include: [
            {
              model: db.user,
              as: "user",
              required: true,
              attributes: ["firstName", "lastName", "email"],
            },
          ],
          as: "payment",
        },
      ],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Refund with id=" + id,
    });
  }
};

// Update a Refund by the id in the request (e.g. admin approves/denies)
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Refund.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({ message: "Refund was updated successfully." });
    } else {
      res.send({
        message: `Cannot update refund with id=${id}. Maybe refund was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating Refund with id=" + id,
    });
  }
};

// Delete a Refund with the specified id
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await Refund.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({ message: "Refund was deleted successfully!" });
    } else {
      res.send({
        message: `Cannot delete refund with id=${id}. Maybe refund was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete Refund with id=" + id,
    });
  }
};