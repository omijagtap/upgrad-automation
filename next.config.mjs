/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow external images if needed
  images: {
    remotePatterns: [],
  },
  // Silence warnings about missing env vars during build
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
};

export default nextConfig;
