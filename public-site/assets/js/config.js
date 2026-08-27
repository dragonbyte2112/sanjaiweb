// Tells api.js where the backend lives.
//
// Locally (npm run dev), the frontend and backend are served from the same
// Express app on port 4000, so relative "/api" works fine.
//
// Once deployed with the frontend on Vercel and the backend on Render, they
// live on two different domains — set RENDER_API_URL below to your Render
// backend's URL (find it on your Render service dashboard, looks like
// https://dragonbyte-api.onrender.com) after you deploy the backend.
(function () {
  const RENDER_API_URL = "https://dragonbyte-api.onrender.com"; // <-- replace with your real Render URL

  const isLocal =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  window.API_BASE = isLocal ? "/api" : `${RENDER_API_URL}/api`;
})();
