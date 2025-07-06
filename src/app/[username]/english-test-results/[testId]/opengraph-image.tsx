import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { env } from "@/env";
import { api } from "@/trpc/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { username: string; testId: string } }) {
  console.log("OpenGraph image generation started for:", params);

  let testData = null;
  let logoSrc: string | undefined = undefined;

  try {
    console.log("Fetching test data...");
    testData = await api.users.getPublicTestById({ testId: params.testId });
    console.log("Test data fetched successfully:", testData?.band);
  } catch (e) {
    console.error("Error fetching test data:", e);
  }

  try {
    console.log("Loading logo...");
    const logoData = await readFile(join(process.cwd(), "public/logo.svg"));
    logoSrc = `data:image/svg+xml;base64,${Buffer.from(logoData).toString("base64")}`;
    console.log("Logo loaded successfully");
  } catch (e) {
    console.error("Error loading logo:", e);
  }

  // Fallbacks
  const band = testData?.band ?? 0;
  const username = testData?.user?.displayName ?? params.username;
  const appName = env.NEXT_PUBLIC_APP_NAME ?? "john-al-shiekh.live";
  const badgeColor = band >= 6 ? "#10b981" : "#6366f1";

  console.log("Generating image with data:", { band, username, appName });

  try {
    // Very simple fallback image to test
    if (!testData) {
      console.log("Generating fallback image");
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f3f4f6",
              fontSize: 32,
              color: "#1f2937",
              fontWeight: "bold",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 20 }}>Test Result Not Found</div>
              <div style={{ fontSize: 18, fontWeight: "normal" }}>{appName}</div>
            </div>
          </div>
        ),
        { ...size },
      );
    }

    console.log("Generating main image");
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
            background: "#ffffff",
            padding: 40,
          }}
        >
          <div
            style={{
              width: "90%",
              height: "80%",
              borderRadius: 24,
              border: `4px solid ${badgeColor}`,
              background: "#f9fafb",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            {/* Simple score display */}
            <div
              style={{
                background: badgeColor,
                color: "#fff",
                borderRadius: "50%",
                width: 120,
                height: 120,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 700,
                marginBottom: 30,
              }}
            >
              {Number(band)}
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              English Test Result
            </div>

            <div
              style={{
                color: "#6b7280",
                fontSize: 20,
                fontWeight: 500,
                textAlign: "center",
                marginBottom: 30,
              }}
            >
              @{username}
            </div>

            <div
              style={{
                fontSize: 18,
                color: "#1f2937",
                textAlign: "center",
              }}
            >
              {appName}
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  } catch (error) {
    console.error("Error generating ImageResponse:", error);

    // Return a very basic fallback
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ef4444",
            fontSize: 24,
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          Error generating image
        </div>
      ),
      { ...size },
    );
  }
}
