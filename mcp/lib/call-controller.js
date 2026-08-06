// Wraps the Express-style (req, res) controllers so MCP tools can call
// them without each one re-writing the same fake req/res plumbing.
function callController(controllerFn, { params = {}, query = {}, body = {}, userId = null } = {}) {
  return new Promise((resolve, reject) => {
    const fakeReq = { params, query, body, userId };
    const fakeRes = {
      status: () => fakeRes,
      send: (data) => resolve(data),
    };
    Promise.resolve(controllerFn(fakeReq, fakeRes)).catch(reject);
  });
}
 
module.exports = { callController };