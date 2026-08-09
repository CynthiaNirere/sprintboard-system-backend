const db = require("../models");
const Test = db.test;
const TestHistory = db.testHistory;
const Op = db.Sequelize.Op;

// Create a new test history entry
exports.create = async(req, res) => {
  const testId = req.params.id;
  const message = req.body.message;
  const userId = req.body.userId;

  try {
    const testHistoryEntry = {
      testId: testId,
      message: message,
      userId: userId
    }

    const createdEntry = await TestHistory.create(testHistoryEntry);
    res.send(createdEntry);
  } catch (err) {
    res.status(500).send({
      message: err.message || "An error occurred adding entry to test history.",
    });
  }
};

// Retrieve all test history logs
exports.findAll = async (req, res) => {
  try {
    const data = await TestHistory.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "An error occurred retrieving the test history logs.",
    });
  }
};

// Retrieve all test history logs for one test
exports.findAllForTest = async (req, res) => {
  const testId = req.params.id;

  try {
    const data = await TestHistory.findAll({
      where: {
        testId: testId
      },
      order: [["createdAt", "DESC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || `An error occurred retrieving test history log for test with id= ${testId}`,
    });
  }
};