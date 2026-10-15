/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors must fail the build — that is the whole point of `npm run typecheck`.
  // (Next 16 removed the in-build `eslint` key; linting is `npm run lint`.)
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;