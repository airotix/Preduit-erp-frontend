/** @type {import('next').NextConfig} */

// The browser talks to the Next.js origin only; these rewrites transparently
// proxy /api/* to the FastAPI backend (server-to-server, no CORS). This keeps
// every API call same-origin, so the HttpOnly refresh cookie the backend sets
// is first-party and works in dev (http) and prod (https) alike.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` },
    ];
  },
};

export default nextConfig;
