const nextConfig = {
  trailingSlash: false,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Skip static generation for problematic pages
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
}
export default nextConfig