/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*' // Assure-toi que le port correspond à ton backend Flask
        }
      ]
    }
  }
  export default nextConfig;
  

  