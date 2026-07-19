/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Legacy URLs stored/served as http still resolve to this host
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "www.mamp.one",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  // Webpack config for --webpack flag
  webpack: (config, { isServer }) => {
    // Exclude Cloudinary from client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
      };
    }
    return config;
  },
  // Turbopack config (Next.js 16 default)
  // Turbopack automatically handles Node.js built-ins better than webpack
  // Since we've separated server/client code, empty config is sufficient
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
