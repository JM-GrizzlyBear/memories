import type { NextFunction, Request, Response } from "express";

// Stops the request with 401 unless someone is logged in
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  next();
}
