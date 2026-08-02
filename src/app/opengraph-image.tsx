import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Busal OS — The AI Operating System for Modern Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0c1222 0%, #152036 100%)",
        padding: "80px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 420,
          height: 420,
          background: "radial-gradient(circle, rgba(13,115,119,0.4) 0%, transparent 70%)",
        }}
      />
      <div style={{ display: "flex", fontSize: 84, color: "#f7f5f1", fontWeight: 600 }}>
        Busal OS
      </div>
      <div
        style={{ display: "flex", marginTop: 24, fontSize: 34, color: "#c9d0dc", maxWidth: 900 }}
      >
        The AI Operating System for Modern Businesses
      </div>
      <div
        style={{ display: "flex", marginTop: 40, fontSize: 24, color: "#0d7377", fontWeight: 600 }}
      >
        getbusal.com
      </div>
    </div>,
    { ...size },
  );
}
