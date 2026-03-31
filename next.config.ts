/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Tắt kiểm tra lỗi TypeScript khi build trên Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Tắt kiểm tra lỗi chuẩn code (ESLint) khi build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;