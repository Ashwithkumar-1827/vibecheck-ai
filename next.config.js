/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Prevent Next.js from watching db.json and triggering hot reloads in development
      if (!config.watchOptions) {
        config.watchOptions = {};
      }
      
      const existingIgnored = config.watchOptions.ignored;
      config.watchOptions.ignored = [
        ...(Array.isArray(existingIgnored)
          ? existingIgnored
          : existingIgnored
          ? [existingIgnored]
          : []),
        '**/db.json',
        '**/db.json.backup_*',
        '**/db.json.tmp'
      ];
    }
    return config;
  }
};

module.exports = nextConfig;
