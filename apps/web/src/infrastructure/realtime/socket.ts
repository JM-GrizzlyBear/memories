import { io, type Socket } from "socket.io-client";

// Opens the live connection to the API (same address as the website).
// The browser sends the login cookie with it, so the server knows who this is.
export function connectRealtime(): Socket {
  return io({ withCredentials: true });
}
