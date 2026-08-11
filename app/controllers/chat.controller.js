const Anthropic = require("@anthropic-ai/sdk");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StreamableHTTPClientTransport } = require("@modelcontextprotocol/sdk/client/streamableHttp.js");

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3201/mcp";
const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 2048;

const SYSTEM_PROMPT =
  "You are an assistant embedded in SprintBoard, a project management tool. Use the available tools to answer with the developer's real project, sprint, and ticket data rather than generic advice.\n\n" +
  "Before acting or answering, check whether the request is scoped clearly enough:\n" +
  "- If they ask about tickets (e.g. 'how many tickets') without saying which sprint, ask which sprint they mean, or whether they want the whole project, rather than picking one yourself.\n" +
  "- If they ask to move, update, rename, or delete a ticket by title or status rather than a specific id, and multiple sprints exist, ask which sprint that ticket is in before acting.\n" +
  "- When they refer to a ticket by its current status or column (e.g. 'the ticket in Ready for Test', 'move the ticket from In Progress'), use get_tickets_by_status to find it — never search for a ticket whose title happens to match the status name, since those are different things.\n" +
  "- Never guess which sprint or project based on whichever one you happened to look at most recently in this conversation — ask explicitly instead.\n" +
  "- Only skip asking when the developer has already told you which sprint or project they mean, or when only one could possibly apply.\n\n" +
  "When the developer asks you to create or update something but hasn't given you enough information to call the relevant tool yet, ask for exactly what's missing before calling it — don't guess or invent values. Only ask for fields the tool actually accepts; don't assume a field exists just because it would make sense for the item type.";

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
    const tools = await getMcpToolDeclarations(mcpClient);

    let messages = [...history, { role: "user", content: message }];

    let response = await anthropicClient.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
      tools,
    });

    response = await runToolLoop(response, messages, mcpClient, tools);

    const replyText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    res.send({
      reply: replyText,
      history: messages,
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

// Lists the MCP server's tools and converts them into Claude's tool
// shape (input_schema, not parameters like Gemini used — different
// field name for the same JSON schema).
async function getMcpToolDeclarations(mcpClient) {
  const { tools } = await mcpClient.listTools();
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));
}

// Manual tool-use loop. Claude can request several tool calls in a
// single turn — every tool_use block in a turn needs a matching
// tool_result, keyed by tool_use_id, before the next call.
async function runToolLoop(response, messages, mcpClient, tools) {
  let safetyCounter = 0;
  while (response.stop_reason === "tool_use" && safetyCounter < 10) {
    safetyCounter++;

    // Push the model's ORIGINAL response content directly — not a
    // manually rebuilt object — so nothing it attached to the response
    // gets silently dropped.
    messages.push({ role: "assistant", content: response.content });

    const toolUseBlocks = response.content.filter((block) => block.type === "tool_use");

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const result = await mcpClient.callTool({
          name: block.name,
          arguments: block.input,
        });
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: result.content,
        };
      })
    );

    messages.push({ role: "user", content: toolResults });

    response = await anthropicClient.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
      tools,
    });
  }

  // Whether the loop ran zero times (a direct answer or clarifying
  // question) or several (after calling tools), the model's FINAL turn
  // must be recorded too — otherwise the next request has two
  // consecutive "user" turns with no "assistant" turn between them.
  messages.push({ role: "assistant", content: response.content });

  return response;
}