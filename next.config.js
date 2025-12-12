/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Allows images from any Supabase project
      },
    ],
  },
}

module.exports = nextConfig
