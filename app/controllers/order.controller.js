const { sendOrderConfirmationEmail } = require('../services/emailService');
const db = require("../models");
const Order = db.order;
const Payment = db.payment;
const Reservation = db.reservation;
const Ticket = db.ticket;

// Create and Save an order
exports.create = async (req, res) => {
  if (req.body.eventId === undefined) {
    res.status(400).send({
      message: "eventId cannot be empty for order!",
    });
    return;
  } else if (req.body.totalAmount === undefined) {
    res.status(400).send({
      message: "totalAmount cannot be empty for order!",
    });
    return;
  } else if (req.body.paymentMethod === undefined) {
    res.status(400).send({
      message: "paymentMethod cannot be empty for order!",
    });
    return;
  } else if (req.body.seatIds === undefined) {
    res.status(400).send({
      message: "seat Ids cannot be empty for order!",
    });
    return;
  } else if (req.body.email === undefined) {
    res.status(400).send({
      message: "email cannot be empty for order!",
    });
    return;
  } else if (req.body.reservationId === undefined) {
    res.status(400).send({
      message: "reservationId cannot be empty for order!",
    });
    return;
  }  

  try {
    const result = await db.sequelize.transaction(async t => {
      const order = await Order.create(
        {
          userId: req.body.userId,
          totalAmount: req.body.totalAmount,
          orderStatus: "Completed",
          email: req.body.email
        },
        { transaction: t},
      );

      const payment = await Payment.create(
        {
          amount: req.body.totalAmount,
          paymentMethod: req.body.paymentMethod,
          paymentStatus: "Paid",
          userId: req.body.userId,
          orderId: order.id
        },
        { transaction: t},
      );

      for (const seatId of req.body.seatIds) {
        let ticket = await Ticket.create(
          {
            QRCode: "http://ec2-54-210-64-62.compute-1.amazonaws.com/museumapi/tickets/checkin/",
            ticketType: "General Admission",
            ticketStatus: "Valid",
            purchaseDate: Date.now(),
            eventId: req.body.eventId,
            seatId: seatId,
            paymentId: payment.id,
            orderId: order.id,
          },
          { transaction: t},
        )
        ticket.QRCode += ticket.id;
        await ticket.save({ transaction: t });
      }

      await Reservation.update(
        { 
          reservationStatus: "confirmed" 
        },
        {
          where: { id: req.body.reservationId },
          transaction: t
        }
      );
      return order;
    });
    res.send(result);
        // Send confirmation email (non-blocking)
    try {
      const [event, tickets] = await Promise.all([
        db.event.findByPk(req.body.eventId, {
          include: [{ model: db.show, as: 'show', attributes: ['title'] }]
        }),
        db.ticket.findAll({
          where: { orderId: result.id },
          include: [{ model: db.seat, as: 'seat', attributes: ['rowNumber', 'seatNumber'] }]
        })
      ]);

      const formattedTickets = tickets.map(t => ({
        seatLabel: `${t.seat.rowNumber}${t.seat.seatNumber}`,
        ticketType: t.ticketType,
        qrCode: t.QRCode,
      }));

      const eventDate = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
      });

      await sendOrderConfirmationEmail(req.body.email, {
        orderId: result.id,
        showTitle: event.show.title,
        eventDate: eventDate,
        eventTime: event.startTime,
        tickets: formattedTickets,
        totalAmount: req.body.totalAmount,
      });
    } catch (emailErr) {
      console.error('Could not send confirmation email:', emailErr);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: err.message || "Some error occurred while creating the order.",
    });
  }
};

// Retrieve all Orders from the database
exports.findAll = async (req, res) => {
  try {
    const data = await Order.findAll({
      include: [
        { model: db.payment,
          required: true,
          attributes: ['amount', 'paymentStatus'],
          include:[
            {
              model: db.user,
              as: "user",
              attributes: ['firstName', 'lastName', 'email']
            },
          ]
          , as: "orderPayments"
        }
      ],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving orders.",
    });
  }
};

// Retrieve all Orders for a user
exports.findForUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const data = await Order.findAll({
      include: [
        { model: db.payment,
            required: true,
            attributes: ['amount', 'paymentStatus'],
            include:[
              {
                model: db.user,
                as: "user",
                required: true,
                attributes: ['firstName', 'lastName', 'email'],
                where: {
                  id: userId
                }
              },
            ]
        , as: "orderPayments"
        }
      ],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving orders with userId = " + userId,
    });
  }
};

// Find a single Order with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Order.findByPk(id, {
      include: [
        { model: db.payment,
          required: true,
          attributes: ['amount', 'paymentStatus'],
          include:[
            {
              model: db.user,
              as: "user",
              attributes: ['firstName', 'lastName', 'email'],
            },
          ]
          , as: "orderPayments"
        },
        {
          model: db.ticket,
          as: "orderTickets"
        }
      ],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Order with id=" + id,
    });
  }
};

// Update an Order by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Order.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({ message: "Order was updated successfully." });
    } else {
      res.send({
        message: `Cannot update order with id=${id}. Maybe order was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating Order with id=" + id,
    });
  }
};