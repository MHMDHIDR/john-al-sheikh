import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { env } from "@/env";
import { api } from "@/trpc/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { username: string; testId: string } }) {
  let testData = null;
  let logoSrc: string | undefined = undefined;

  try {
    testData = await api.users.getPublicTestById({ testId: params.testId });
  } catch (e) {
    // log error if needed
  }

  try {
    const logoData = await readFile(join(process.cwd(), "public/logo.svg"));
    logoSrc = `data:image/svg+xml;base64,${Buffer.from(logoData).toString("base64")}`;
  } catch (e) {
    // logo is optional, don't throw
  }

  // Fallbacks
  const band = testData?.band ?? 0;
  const username = testData?.user?.displayName ?? params.username;
  const appName = env.NEXT_PUBLIC_APP_NAME ?? "john-al-shiekh.live";
  const badgeColor = band >= 6 ? "#10b981" : "#6366f1";

  // If testData is missing, show a fallback image
  if (!testData) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            fontSize: 48,
            color: "#222",
          }}
        >
          <div>
            <div style={{ fontWeight: "bold", marginBottom: 20 }}>
              نتيجة اختبار اللغة الإنجليزية
            </div>
            <div>{appName}</div>
          </div>
        </div>
      ),
      { ...size },
    );
  }

  // Normal OG image
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
          background: "#fff",
          padding: 0,
        }}
      >
        <div
          style={{
            width: 1100,
            height: 530,
            borderRadius: 32,
            border: `6px solid ${badgeColor}`,
            background: "#f9fafb",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 48,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div
                style={{
                  background: badgeColor,
                  color: "#fff",
                  borderRadius: "50%",
                  width: 140,
                  height: 140,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 56,
                  fontWeight: 700,
                  boxShadow: "0 4px 24px #0001",
                }}
              >
                {Number(band)}
                <span style={{ fontSize: 22, fontWeight: 400, marginTop: 2 }}>Band</span>
              </div>
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                color: "#22223b",
                marginBottom: 8,
                fontFamily: "Cairo, Arial, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              🎉 حصلت على {Number(band)} في اختبار المحادثة 🎉
            </div>
            <div style={{ color: "#64748b", fontSize: 24, fontWeight: 500 }}>@{username}</div>
          </div>
          <div style={{ borderTop: "2px solid #e5e7eb", width: "100%", margin: "32px 0 16px 0" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, color: "#22223b", marginBottom: 12 }}>
              شاهد التفاصيل الكاملة والتعليقات على {appName}
            </div>
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}
            >
              {logoSrc && (
                <img src={logoSrc} width={56} height={56} style={{ borderRadius: 12 }} alt="Logo" />
              )}
              <span style={{ fontWeight: 700, fontSize: 26, color: "#0a2540" }}>{appName}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
