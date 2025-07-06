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
    console.error("Error fetching test data:", e);
  }

  try {
    const logoData = await readFile(join(process.cwd(), "public/logo.svg"));
    logoSrc = `data:image/svg+xml;base64,${Buffer.from(logoData).toString("base64")}`;
  } catch (e) {
    console.error("Error loading logo:", e);
  }

  // Load fonts to avoid rendering issues
  let regularFont: ArrayBuffer | undefined;
  let boldFont: ArrayBuffer | undefined;

  try {
    // Use system fonts or load your own Arabic-compatible fonts
    regularFont = await readFile(join(process.cwd(), "public/fonts/Cairo-Regular.ttf"));
    boldFont = await readFile(join(process.cwd(), "public/fonts/Cairo-Bold.ttf"));
  } catch (e) {
    console.error("Error loading fonts:", e);
    // Fallback to no custom fonts
  }

  // Fallbacks
  const band = testData?.band ?? 0;
  const username = testData?.user?.displayName ?? params.username;
  const appName = env.NEXT_PUBLIC_APP_NAME ?? "john-al-shiekh.live";
  const badgeColor = band >= 6 ? "#10b981" : "#6366f1";

  // Simplified Arabic text to avoid complex rendering issues
  const resultText = `English Test Result`;
  const scoreText = `Score: ${band}`;
  const userText = `@${username}`;
  const siteText = appName;

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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            fontSize: 48,
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 20 }}>English Test Result</div>
            <div style={{ fontSize: 24, fontWeight: "normal" }}>{siteText}</div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts:
          regularFont && boldFont
            ? [
                {
                  name: "Cairo",
                  data: regularFont,
                  style: "normal",
                  weight: 400,
                },
                {
                  name: "Cairo",
                  data: boldFont,
                  style: "normal",
                  weight: 700,
                },
              ]
            : undefined,
      },
    );
  }

  // Normal OG image with simplified design
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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: 0,
        }}
      >
        <div
          style={{
            width: 1100,
            height: 530,
            borderRadius: 32,
            border: `6px solid ${badgeColor}`,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 48,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
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
                  fontSize: 48,
                  fontWeight: 700,
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                }}
              >
                {Number(band)}
                <span style={{ fontSize: 18, fontWeight: 400, marginTop: 4 }}>Band</span>
              </div>
            </div>

            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              🎉 English Speaking Test Result 🎉
            </div>

            <div
              style={{
                color: "#6b7280",
                fontSize: 24,
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {userText}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: "3px solid #e5e7eb",
              width: "100%",
              margin: "24px 0",
            }}
          />

          {/* Footer */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 28,
                color: "#1f2937",
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              View full details and feedback
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              {logoSrc && (
                <img src={logoSrc} width={48} height={48} style={{ borderRadius: 8 }} alt="Logo" />
              )}
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 26,
                  color: badgeColor,
                }}
              >
                {siteText}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts:
        regularFont && boldFont
          ? [
              {
                name: "Cairo",
                data: regularFont,
                style: "normal",
                weight: 400,
              },
              {
                name: "Cairo",
                data: boldFont,
                style: "normal",
                weight: 700,
              },
            ]
          : undefined,
    },
  );
}
