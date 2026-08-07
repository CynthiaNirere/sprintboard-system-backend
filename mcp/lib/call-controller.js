// Wraps the Express-style (req, res) controllers so MCP tooldirectly
function callController(controllerFn, { params = {}, query = {}, body = {}, userId = null } = {}) {
  return new Promise((resolve, reject) => {
    const fakeReq = {
      params,
      query,
      body,
      userId,
      headers: { "user-agent": "SprintBoard AI Assistant" },
      ip: "mcp-assistant",
    };
    const fakeRes = {
      status: () => fakeRes,
      send: (data) => resolve(data),
    };
    Promise.resolve(controllerFn(fakeReq, fakeRes)).catch(reject);
  });
}

module.exports = { callController };