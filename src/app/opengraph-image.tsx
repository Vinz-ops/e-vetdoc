import { ImageResponse } from "next/og";

export const alt = "E-VetDoc — connected veterinary care";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#101611",
          color: "#f3f6f2",
          display: "flex",
          height: "100%",
          padding: "72px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#bde6b8",
            borderRadius: "999px",
            display: "flex",
            height: "64px",
            marginRight: "24px",
            width: "64px",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "850px" }}>
          <div style={{ color: "#bde6b8", fontSize: 28, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            E-VetDoc
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, marginTop: "28px" }}>
            Connected care for every pet.
          </div>
          <div style={{ color: "#c8d1c6", fontSize: 30, lineHeight: 1.35, marginTop: "28px" }}>
            Appointments, records, updates, invoices, and receipts in one secure clinic workspace.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
