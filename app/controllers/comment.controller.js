const db = require("../models");
const Comment = db.comment;
const User = db.user;
const Op = db.Sequelize.Op;
const emailService = require("../services/emailService");

// Create and Save a comment
exports.create = async (req, res) => {
  // Validate request
  if (req.body.content === undefined) {
    return res.status(400).send({
      message: "Content cannot be empty for comment!",
    });
  } if (req.body.userId === undefined) {
    return res.status(400).send({
      message: "userId cannot be empty for comment!",
    });
  } if (req.body.ticketId === undefined) {
    return res.status(400).send({
      message: "ticketId cannot be empty for comment!",
    });
  }

  // Create a comment
  const comment = {
    content: req.body.content,
    userId: req.body.userId,
    ticketId: req.body.ticketId || null,
  };
  
  try {
    const data = await Comment.create(comment);
    const author = await User.findByPk(req.body.userId);
    const authorName = `${author.firstName} ${author.lastName}`;
    
    const regex = /@([A-Za-z]+ [A-Za-z]+)/g;
    const mentions = [];
    let match;

    while((match = regex.exec(req.body.content)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length > 0) {
      for (const mention of mentions) {
        const [firstName, lastName] = mention.split(' ');

        const mentionedUser = await User.findOne({
          where: {
            firstName: firstName, 
            lastName: lastName
          }
        });

        if (mentionedUser && mentionedUser.email) {
          emailService.sendMentionNotification(mentionedUser.email, {
            ticketId: req.body.ticketId,
            authorName: authorName,
            content: req.body.content
          })
          .catch(error => console.error("Email failure: ", error));
        }
      }
    }

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the comment.",
    });
  }
};

// Retrieve all comments for a ticket
exports.findAllForTicket = async (req, res) => {
  const ticketId = req.params.ticketId;

  try {
    const data = await Comment.findAll({
      where: {
        ticketId: ticketId
      },
      include: [{
        model: User,
        as: "user",
        attributes: ["firstName", "lastName"]
      }],
      order: [["createdAt", "DESC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving comments.",
    });
  }
};