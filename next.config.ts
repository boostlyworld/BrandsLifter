import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* The backdrops are painted gradients across a full viewport, where 75
       bands visibly in the sky. 82 is the lowest setting that stays clean. */
    qualities: [75, 82],
  },
};

export default nextConfig;
