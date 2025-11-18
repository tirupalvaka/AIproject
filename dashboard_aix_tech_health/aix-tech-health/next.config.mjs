/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Figma “images” endpoint returns a temporary S3 URL
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'figma-alpha-api.s3.us-west-2.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;

