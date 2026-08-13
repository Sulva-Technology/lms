import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint runs as its own gate in `npm run verify`; do not let a build hide it.
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Uploaded images (course thumbnails, avatars) are served from Supabase
  // Storage. No third-party placeholder hosts are allowed.
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: 'https',
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            port: '',
            pathname: '/storage/v1/object/**',
          },
        ]
      : [],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
