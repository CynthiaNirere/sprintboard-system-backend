const db = require("../app/models");
const { decrypt } = require("../app/authentication/crypto");
const Session = db.session;

// Mirrors the REAL authenticateRoute logic in
// app/authentication/authentication.js 
export async function authenticate(request) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response("Missing bearer token", { status: 401 });
  }

  const token = authHeader.slice(7);
  const sessionId = await decrypt(token);

  let session;
  try {
    const data = await Session.findAll({ where: { id: sessionId } });
    session = data[0];
  } catch (error) {
    throw new Response("Invalid session", { status: 401 });
  }

  if (!session) {
    throw new Response("Invalid session", { status: 401 });
  }

  if (session.expirationDate < Date.now()) {
    throw new Response("Session has expired — log out and log in again", { status: 401 });
  }

  return { userId: session.userId };
}