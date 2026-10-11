import type { NextFunction, Request, Response } from "express";

// Errors from express.json() carry a "type" and an HTTP status
function bodyParserError(error: unknown) {
  if (typeof error !== "object" || error === null || !("type" in error)) {
    return null;
  }
  if (error.type === "entity.parse.failed") {
    return { status: 400, message: "The request body isn't valid JSON" };
  }
  if (error.type === "entity.too.large") {
    return { status: 413, message: "The request is too large" };
  }
  return null;
}

// Unknown /api routes answer in JSON, not with the website's HTML
export function apiNotFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

// The last stop for any error a route didn't handle.
// The details (stack trace, SQL) go to the server log only; the browser gets a short JSON message.
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Too late to send our own answer: let Express close the connection
  if (res.headersSent) {
    next(error);
    return;
  }

  const known = bodyParserError(error);
  if (known) {
    res.status(known.status).json({ error: known.message });
    return;
  }

  console.error(`${req.method} ${req.originalUrl} failed:`, error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
