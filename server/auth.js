// Simple API key check for write endpoints. For local dev we default to 'dev-secret'.
const API_KEY = process.env.API_KEY || "dev-secret";

function checkApiKey(req) {
  // `req` is a Next.js Request in route handlers
  try {
    const headerVal =
      req.headers && typeof req.headers.get === "function"
        ? req.headers.get("x-api-key")
        : null;
    return headerVal === API_KEY;
  } catch (e) {
    return false;
  }
}

module.exports = {
  API_KEY,
  checkApiKey,
};
