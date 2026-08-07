const db = require("../models");
const Repo = db.githubRepository;
const Op = db.Sequelize.Op;

// Create and Save a Repo
exports.create = async (req, res) => {
  // Validate request
  if (req.body.url === undefined) {
    return res.status(400).send({
      message: "url cannot be empty for repo!",
    });
  }if (req.body.name === undefined) {
    return res.status(400).send({
      message: "name cannot be empty for repo!",
    });
  }if (req.body.projectId === undefined) {
    return res.status(400).send({
      message: "projectId cannot be empty for repo!",
    });
  }if (req.body.developmentBranch === undefined) {
    return res.status(400).send({
      message: "developmentBranch cannot be empty for repo!",
    });
  }

  // Create a Repo
  const repo = {
    url: req.body.url,
    name: req.body.name,
    projectId: req.body.projectId,
    developmentBranch: req.body.developmentBranch,
  };

  try {
    const data = await Repo.create(repo);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Repo.",
    });
  }
};

// Retrieve all Repos
exports.findAll = async (req, res) => {
  try {
    const data = await Repo.findAll();
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving repos.",
    });
  }
};

// Retrieve all Repos
exports.findAllForProject = async (req, res) => {
    const projectId = req.params.projectId;
  try {
    const data = await Repo.findAll({
        where: {projectId: projectId}
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving repos for a project.",
    });
  }
};

// Find a single Repo with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Repo.findByPk(id);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Repo with id=" + id,
    });
  }
};

// Update a Repo by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Repo.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({
        message: "Repo was updated successfully.",
      });
    } else {
      res.send({
        message: `Cannot update Repo with id=${id}. Maybe Repo was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating Repo with id=" + id,
    });
  }
};

// Delete a Repo with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await Repo.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({
        message: "Repo was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete Repo with id=${id}. Maybe Repo was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete Repo with id=" + id,
    });
  }
};

// Delete all Repos from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await Repo.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} Repos were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all repos.",
    });
  }
};