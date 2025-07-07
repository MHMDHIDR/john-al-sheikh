import { ImageResponse } from "next/og";
import { env } from "@/env";
import { formatTestType } from "@/lib/format-test-type";
import { api } from "@/trpc/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Next.js 15+ passes params as a Promise
type PageProps = {
  params: Promise<{ username: string; testId: string }>;
};

export default async function Image({ params }: PageProps) {
  // Await the params since they're now a Promise in Next.js 15+
  const { username, testId } = await params;

  let testData = null;
  try {
    testData = await api.users.getPublicTestById({ testId });
  } catch (e) {
    console.error("Error fetching test data:", e);
  }

  // Fallbacks
  const band = testData?.band ?? 0;
  const displayName = testData?.user?.displayName ?? username.replace("@", "");
  const appName = env.NEXT_PUBLIC_APP_NAME ?? "john-al-shiekh.live";
  const testType = testData?.type ?? "MOCK";
  const badgeColor = band >= 6 ? "#10b981" : "#6366f1";

  try {
    // Simple fallback image if no test data
    if (!testData) {
      console.log("Generating fallback Twitter image");
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
              fontSize: 32,
              color: "#ffffff",
              fontWeight: "bold",
              fontFamily: "Inter, Arial, sans-serif",
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

    console.log("Generating main Twitter image");
    // Main Twitter image generation - optimized for Twitter's requirements
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
            padding: 40,
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          <div
            style={{
              width: "90%",
              height: "80%",
              borderRadius: 24,
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 60,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: `4px solid ${badgeColor}`,
            }}
          >
            {/* Score circle - matching the Badge design */}
            <div
              style={{
                background: badgeColor,
                color: "#ffffff",
                borderRadius: "50%",
                width: 180,
                height: 180,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
                fontWeight: 800,
                marginBottom: 40,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
            >
              {Number(band)}
              <span style={{ fontSize: 24, fontWeight: 600, marginTop: 8 }}>Band</span>
            </div>

            {/* Title - matching the AuroraText design */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: 20,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              🎉 حصلت على {Number(band)} في {formatTestType(testType)} اللغة الإنجليزية 🎉
            </div>

            {/* Username */}
            <div
              style={{
                color: "#6b7280",
                fontSize: 32,
                fontWeight: 600,
                textAlign: "center",
                marginBottom: 40,
              }}
            >
              @{displayName}
            </div>

            {/* Divider */}
            <div
              style={{
                width: "80%",
                height: 2,
                background: "#e5e7eb",
                marginBottom: 40,
              }}
            />

            {/* App info */}
            <div
              style={{
                fontSize: 28,
                color: "#9ca3af",
                textAlign: "center",
                fontWeight: 500,
                marginBottom: 20,
              }}
            >
              شاهد التفاصيل الكاملة والتعليقات على {appName}
            </div>

            {/* Logo and app name */}
            <div
              style={{
                fontSize: 24,
                color: "#3b82f6",
                textAlign: "center",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                J
              </div>
              <strong>john-al-shiekh.live</strong>
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  } catch (error) {
    console.error("Error generating Twitter ImageResponse:", error);

    // Return a very basic fallback that should always work
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
            color: "#ffffff",
            fontWeight: "bold",
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div>Error generating Twitter image</div>
            <div style={{ fontSize: 16, marginTop: 10 }}>
              {displayName} - Band {band}
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  }
}
