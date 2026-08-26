/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Accès via IP LAN / Tailscale en dev (ex. http://100.x.x.x:3001)
  allowedDevOrigins: ["100.121.98.116", "127.0.0.1", "localhost"],
};

module.exports = nextConfig;
