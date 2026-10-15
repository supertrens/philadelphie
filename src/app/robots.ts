import type { MetadataRoute } from "next";
import { eglise } from "@/config/eglise";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/espace", "/api/"] }],
    sitemap: `${eglise.siteUrl}/sitemap.xml`,
  };
}
