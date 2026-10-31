// Runs after `vite build`. On Netlify, the website and the API live at different
// addresses: this writes dist/_redirects so Netlify forwards the API's paths to the
// API on Render, and the browser only ever talks to one address (so the login
// cookie just works).
//
// The API's address comes from API_URL (for example https://memories-xxxx.onrender.com).
// Without it (local builds, the Docker image) there's nothing to forward: it skips.
import { writeFileSync } from "node:fs";

const apiUrl = process.env.API_URL?.trim().replace(/\/+$/, "");

if (!apiUrl) {
  console.log(
    "API_URL is not set: no Netlify redirects written (fine for local builds)",
  );
  process.exit(0);
}

if (!/^https:\/\/[^/\s]+$/.test(apiUrl)) {
  console.error(
    `API_URL must be just the address, like https://memories-xxxx.onrender.com (got "${apiUrl}")`,
  );
  process.exit(1);
}

// "200!" = forward (the address bar doesn't change), even if a file has the same name.
// Netlify passes the query string along (Socket.IO needs it).
const rules = [
  ["/api/*", `${apiUrl}/api/:splat`],
  ["/socket.io/*", `${apiUrl}/socket.io/:splat`],
  ["/uploads/*", `${apiUrl}/uploads/:splat`],
];

const file = new URL("../dist/_redirects", import.meta.url);
writeFileSync(
  file,
  rules.map(([from, to]) => `${from}  ${to}  200!`).join("\n") + "\n",
);
console.log(
  `Netlify redirects written: /api, /socket.io and /uploads → ${apiUrl}`,
);
