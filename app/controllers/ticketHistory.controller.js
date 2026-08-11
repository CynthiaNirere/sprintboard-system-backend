const db = require("../models");
const TicketHistory = db.ticketHistory;
const Op = db.Sequelize.Op;

// Retrieve all ticketHistory history logs
exports.findAll = async (req, res) => {
  try {
    const data = await TicketHistory.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "An error occurred retrieving the ticketHistory history logs.",
    });
  }
};

// Retrieve all ticketHistory history logs for one ticketHistory
exports.findAllForTicket = async (req, res) => {
  const ticketId = req.params.id;

  try {
    const data = await TicketHistory.findAll({
      where: {
        ticketId: ticketId
      },
      order: [["createdAt", "DESC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || `An error occurred retrieving ticketHistory history log for ticket with id= ${ticketId}`,
    });
  }
};