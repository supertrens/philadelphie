import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, { protocol: "https", hostname: "i.ytimg.com" }],
    // Photos du stockage Blob servies par /api/fichier?p=… (dossier public/)
    localPatterns: [{ pathname: "/api/fichier" }, { pathname: "/**", search: "" }],
  },
  partialPrefetching: true,
  // L'ancienne page Bulletin vit désormais dans « Vie de l'église »
  async redirects() {
    return [{ source: "/:lang(fr|en)/bulletin", destination: "/:lang/vie", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
