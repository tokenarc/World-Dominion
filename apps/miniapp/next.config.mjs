const nextConfig = {
  trailingSlash: false,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
}
export default nextConfig