const { GoogleGenAI } = require("@google/genai");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StreamableHTTPClientTransport } = require("@modelcontextprotocol/sdk/client/streamableHttp.js");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3201/mcp";
const MODEL = "gemini-3.5-flash-lite";

// Ask the AI assistant a question, using the MCP tools to answer with the
// developer's real project, sprint, and ticket data
exports.chat = async (req, res) => {
  // Validate request
  if (!req.body.message) {
    return res.status(400).send({
      message: "message cannot be empty for chat!",
    });
  }

  const message = req.body.message;
  const history = req.body.history || [];

  // Same bearer token that authenticated this request — reused to
  // authenticate our own internal MCP client connection.
  const authHeader = req.get("authorization");

  let mcpClient;
  try {
    mcpClient = await connectToMcp(authHeader);
    const functionDeclarations = await getMcpToolDeclarations(mcpClient);

    let contents = [...history, { role: "user", parts: [{ text: message }] }];

    let response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction:
          "You are an assistant embedded in SprintBoard, a project management tool. Use the available tools to answer with the developer's real project, sprint, and ticket data rather than generic advice.\n\n" +
          "Before acting or answering, check whether the request is scoped clearly enough:\n" +
          "- If they ask about tickets (e.g. 'how many tickets') without saying which sprint, ask which sprint they mean, or whether they want the whole project, rather than picking one yourself.\n" +
          "- If they ask to move, update, rename, or delete a ticket by title or status rather than a specific id, and multiple sprints exist, ask which sprint that ticket is in before acting.\n" +
          "- Never guess which sprint or project based on whichever one you happened to look at most recently in this conversation — ask explicitly instead.\n" +
          "- Only skip asking when the developer has already told you which sprint or project they mean, or when only one could possibly apply.\n\n" +
          "When the developer asks you to create or update something but hasn't given you enough information to call the relevant tool yet, ask for exactly what's missing before calling it — don't guess or invent values. Only ask for fields the tool actually accepts; don't assume a field exists just because it would make sense for the item type.",
        tools: [{ functionDeclarations }],
      },
    });

    response = await runToolLoop(response, contents, mcpClient, functionDeclarations);

    // Temporary — remove once the empty-reply issue is understood.
    console.log("Final response object:", JSON.stringify(response, null, 2));

    res.send({
      reply: response.text,
      history: contents,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: err.message || "Some error occurred while processing the chat message.",
    });
  } finally {
    if (mcpClient) await mcpClient.close();
  }
};

// Opens an MCP client connection, authenticated with the same bearer
// token as the incoming request.
async function connectToMcp(authHeader) {
  const client = new Client({ name: "sprintboard-chat", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), {
    fetch: (url, init) => {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", authHeader);
      return fetch(url, { ...init, headers });
    },
  });
  await client.connect(transport);
  return client;
}

// Lists the MCP server's tools and converts them into Gemini's
// function-declaration shape (parameters, not input_schema like Anthropic
// used — different field name for the same JSON schema).
async function getMcpToolDeclarations(mcpClient) {
  const { tools } = await mcpClient.listTools();
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.inputSchema,
  }));
}

// Manual tool-use loop, deliberately not relying on the SDK's "automatic
// function calling" — Google's own docs flag that behavior as actively
// changing in an upcoming version.
// NOTE: response.functionCalls is my best-confirmed read of the current
// shape, but this is the least-certain part of this file — if it doesn't
// behave as expected, console.log(response) here to see the actual shape.
async function runToolLoop(response, contents, mcpClient, functionDeclarations) {
  let safetyCounter = 0;
  while (response.functionCalls?.length > 0 && safetyCounter < 10) {
    safetyCounter++;
    const call = response.functionCalls[0];

    // Push the model's ORIGINAL response content directly — not a
    // manually rebuilt object. Gemini 3's thinking models attach a
    // thoughtSignature to the functionCall part, and that must be echoed
    // back on the next request; rebuilding the part from scratch (as this
    // used to do) silently drops it and the API rejects the next call.
    contents.push(response.candidates[0].content);

    const result = await mcpClient.callTool({
      name: call.name,
      arguments: call.args,
    });

    contents.push({
      role: "user",
      parts: [
        {
          functionResponse: {
            name: call.name,
            response: { result: result.content },
          },
        },
      ],
    });

    response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { tools: [{ functionDeclarations }] },
    });
  }

  // Whether the loop ran zero times (a direct answer or clarifying
  // question) or several (after calling tools), the model's FINAL turn
  // must be recorded too — otherwise the next request has two
  // consecutive "user" turns with no "model" turn between them, which
  // the API rejects.
  contents.push({ role: "model", parts: [{ text: response.text }] });

  return response;
}