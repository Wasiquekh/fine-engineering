/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'orizon-bucket.s3.eu-north-1.amazonaws.com',
          pathname: '/**', // Allow all paths under this domain
        },
      ],
    },
  };

export default nextConfig;
