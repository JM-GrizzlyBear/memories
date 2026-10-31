import { io, type Socket } from "socket.io-client";

// On Netlify, live updates can't use a WebSocket (Netlify doesn't forward them),
// so the website is built with VITE_REALTIME_TRANSPORT=polling: plain HTTP
// requests that Netlify forwards to the API like any other.
// Everywhere else (local development, the Docker image) it's a WebSocket as usual.
const pollingOnly = import.meta.env.VITE_REALTIME_TRANSPORT === "polling";

// Opens the live connection to the API (same address as the website).
// The browser sends the login cookie with it, so the server knows who this is.
export function connectRealtime(): Socket {
  return io({
    withCredentials: true,
    ...(pollingOnly ? { transports: ["polling"] } : {}),
  });
}
