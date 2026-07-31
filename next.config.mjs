/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    // Use absolute path to suppress workspace root warning on Vercel
    root: process.cwd(),
  },
}

export default nextConfig
