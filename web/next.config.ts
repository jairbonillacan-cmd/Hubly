import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  async redirects() {
    return [{ source: "/libretas", destination: "/tareas?seccion=libretas", permanent: false }];
  },
};

export default nextConfig;

