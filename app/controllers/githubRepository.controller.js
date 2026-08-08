const db = require("../models");
const { encrypt } = require("../authentication/crypto");
const { parseRepoUrl } = require("../services/githubUrl");
const Repo = db.githubRepository;
const Op = db.Sequelize.Op;

/**
 * Turns a client-supplied webhookSecret into the column to persist.
 *
 * Returns { fields } on success, or { error: { status, message } } for the
 * caller to send straight back. null clears the stored secret, which disables
 * that repository's webhook.
 */
const resolveWebhookSecret = async (rawSecret) => {
  if (rawSecret === null) {
    return { fields: { webhookSecret: null } };
  }

  if (typeof rawSecret !== "string" || rawSecret.trim() === "") {
    return { error: { status: 400, message: "webhookSecret cannot be empty!" } };
  }

  return { fields: { webhookSecret: await encrypt(rawSecret.trim()) } };
};

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

  // Create a Repo. name and owner are overwritten from url by the model's
  // beforeValidate hook, so the value here is only a fallback for a url the
  // parser cannot read.
  const repo = {
    url: req.body.url,
    name: req.body.name,
    projectId: req.body.projectId,
    developmentBranch: req.body.developmentBranch,
  };

  // A webhook secret is optional at link time — the repo just cannot receive
  // deliveries until one is set.
  if (req.body.webhookSecret !== undefined && req.body.webhookSecret !== null) {
    const resolved = await resolveWebhookSecret(req.body.webhookSecret);
    if (resolved.error) {
      return res.status(resolved.error.status).send({ message: resolved.error.message });
    }
    repo.webhookSecret = resolved.fields.webhookSecret;
  }

  try {
    const data = await Repo.create(repo);
    // The secret is never echoed back, not even on the request that set it.
    const { webhookSecret, ...safe } = data.toJSON();
    res.send(safe);
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

  const updateData = { ...req.body };

  // Never let a raw secret reach the database.
  if (updateData.webhookSecret !== undefined) {
    const resolved = await resolveWebhookSecret(updateData.webhookSecret);
    if (resolved.error) {
      return res.status(resolved.error.status).send({ message: resolved.error.message });
    }
    updateData.webhookSecret = resolved.fields.webhookSecret;
  }

  // Model.update runs as a bulk update, which does not fire the per-instance
  // beforeValidate hook, so keep owner/name in step with a changed url here.
  if (updateData.url !== undefined) {
    const parsed = parseRepoUrl(updateData.url);
    if (parsed) {
      updateData.owner = parsed.owner;
      updateData.name = parsed.repoName;
    }
  }

  try {
    const num = await Repo.update(updateData, {
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