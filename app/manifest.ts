import type { MetadataRoute } from "next";
import { ZYRA } from "@/lib/zyra/site";

/** PWA-style install metadata; complements root `metadata.icons`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: ZYRA.name,
    short_name: ZYRA.name,
    description: ZYRA.description,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fbf8f6",
    theme_color: "#a67a88",
    icons: [
      {
        src: "/zyra-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/zyra-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
