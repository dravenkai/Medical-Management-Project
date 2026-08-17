/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained .next/standalone build (server.js + only the
  // node_modules it actually needs) so the Docker runtime image doesn't
  // have to ship the full node_modules tree. No effect on `next dev`.
  output: "standalone",
};

module.exports = nextConfig;
