import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { env } from "@/env";
import { api } from "@/trpc/server";

export const alt = "نتيجة اختبار اللغة الإنجليزية";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: { username: string; testId: string } }) {
  // Get test data
  const testData = await api.users.getPublicTestById({ testId: params.testId });

  // Handle case where test doesn't exist
  if (!testData) {
    // Return a default image if test data not found
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Arial",
            flexDirection: "column",
            color: "#000",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: "bold", marginBottom: 20 }}>
            نتيجة اختبار اللغة الإنجليزية
          </div>
          <div>{env.NEXT_PUBLIC_APP_NAME}</div>
        </div>
      ),
      { ...size },
    );
  }

  // Get username and band score
  const displayName = testData.user.displayName ?? params.username;
  const bandScore = testData.band;

  // Load SVG logo
  const logoData = await readFile(join(process.cwd(), "public/logo.svg"));
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(logoData).toString("base64")}`;

  // Color based on band score
  const badgeColor = bandScore >= 6 ? "#10b981" : "#6366f1";

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
            <h1 style={{ fontSize: "48px", margin: "0" }}>{displayName} - اختبار المحادثة</h1>
            <p style={{ fontSize: "24px", color: "#64748b" }}>{params.username}</p>
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
            <span style={{ fontSize: "80px", fontWeight: "bold" }}>{bandScore}</span>
            <span style={{ fontSize: "30px" }}>Band</span>
          </div>

          <div
            style={{
              marginBottom: "20px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <img src={logoSrc} width="60" height="60" style={{ borderRadius: "10px" }} />
            <h2 style={{ fontSize: "32px", margin: "0" }}>
              🎉 تهانينا على إكمال الاختبار في منصة {env.NEXT_PUBLIC_APP_NAME} 🎉
            </h2>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
