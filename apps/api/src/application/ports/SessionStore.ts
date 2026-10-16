// Logged-in sessions, as stored by the server
export interface SessionStore {
  // Log the user out everywhere except the session they're using right now
  deleteOtherSessions(userId: string, keepSessionId: string): Promise<void>;
}
