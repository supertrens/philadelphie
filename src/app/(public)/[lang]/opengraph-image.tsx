import { ImageResponse } from "next/og";
import { eglise } from "@/config/eglise";
import { hasLocale } from "@/i18n/locales";

export const alt = eglise.nom;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Police Fraunces (Google Fonts) ; en cas d'échec, police par défaut. */
async function fraunces() {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,144,600&display=swap", { headers: { "User-Agent": "Mozilla/5.0 (Macintosh)" } }).then((r) => r.text());
    const url = css.match(/src: url\((https:[^)]+\.(?:ttf|woff|otf))\)/)?.[1] ?? css.match(/url\((https:[^)]+)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const x = eglise.t(hasLocale(lang) ? lang : "fr");
  const font = await fraunces();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(135deg, #00296b 0%, #003f88 60%, #00509d 100%)", color: "#fff", padding: 72, fontFamily: font ? "Fraunces" : "serif", position: "relative" }}>
        <div style={{ position: "absolute", top: -160, right: -120, width: 520, height: 520, borderRadius: 9999, background: "rgba(253,197,0,0.18)", display: "flex" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 14, background: "#fdc500", display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 84, height: 84, borderRadius: 9999, background: "#003f88", border: "3px solid #fdc500", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", width: 8, height: 48, borderRadius: 3, background: "#fdc500", display: "flex" }} />
            <div style={{ position: "absolute", width: 40, height: 8, borderRadius: 3, background: "#fdc500", top: 26, display: "flex" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontStyle: "italic" }}>Philadelphie</span>
            <span style={{ fontSize: 18, letterSpacing: 5, textTransform: "uppercase", opacity: 0.75, fontFamily: "sans-serif" }}>{x.sousTitre}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 76, lineHeight: 1.05, fontStyle: "italic", maxWidth: 1000 }}>{x.slogan}</span>
          <span style={{ marginTop: 28, fontSize: 24, opacity: 0.8, fontFamily: "sans-serif" }}>{eglise.adresse}</span>
        </div>
        <div style={{ position: "absolute", right: 72, bottom: 64, width: 120, height: 120, borderRadius: 9999, background: "#fdc500", display: "flex" }} />
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Fraunces", data: font, style: "italic", weight: 600 }] : undefined },
  );
}
