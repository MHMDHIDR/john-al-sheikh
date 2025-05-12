import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "نتيجة اختبار اللغة الإنجليزية";
  const band = Number(searchParams.get("band") ?? "0");
  const username = searchParams.get("username") ?? "";

  // Color based on band score
  const badgeColor = band >= 6 ? "#10b981" : "#6366f1";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          padding: "40px",
        }}
      >
        <div
          style={{
            borderRadius: "15px",
            border: `8px solid ${badgeColor}`,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "40px",
          }}
        >
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <h1 style={{ fontSize: "48px", margin: "0" }}>{title}</h1>
            <p style={{ fontSize: "24px", color: "#64748b" }}>@{username}</p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: badgeColor,
              width: "200px",
              height: "200px",
              borderRadius: "100px",
              color: "white",
            }}
          >
            <span style={{ fontSize: "80px", fontWeight: "bold" }}>{band}</span>
            <span style={{ fontSize: "30px" }}>Band</span>
          </div>

          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            <h2 style={{ fontSize: "36px", margin: "0" }}>🎉 تهانينا على إكمال الاختبار 🎉</h2>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
