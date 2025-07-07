import { ImageResponse } from "next/og";
import { env } from "@/env";
import { api } from "@/trpc/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Add type for params
// Next.js 15+ passes params as a Promise
type PageProps = {
  params: Promise<{ username: string; testId: string }>;
};

export default async function Image({ params }: PageProps) {
  // Await the params since they're now a Promise in Next.js 15+
  const { username, testId } = await params;

  console.log("OpenGraph image generation started for:", { username, testId });

  let testData = null;
  try {
    console.log("Fetching test data...");
    testData = await api.users.getPublicTestById({ testId });
    console.log("Test data fetched successfully:", testData?.band);
  } catch (e) {
    console.error("Error fetching test data:", e);
  }

  // Fallbacks
  const band = testData?.band ?? 0;
  const displayName = testData?.user?.displayName ?? username.replace("@", "");
  const appName = env.NEXT_PUBLIC_APP_NAME ?? "john-al-shiekh.live";
  const badgeColor = band >= 6 ? "#10b981" : "#6366f1";

  console.log("Generating image with data:", { band, username: displayName, appName });

  try {
    // Simple fallback image if no test data
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

    console.log("Generating main image");
    // Main image generation
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
              padding: 40,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            {/* Score circle */}
            <div
              style={{
                background: badgeColor,
                color: "#ffffff",
                borderRadius: "50%",
                width: 140,
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 52,
                fontWeight: 800,
                marginBottom: 30,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
            >
              {Number(band)}
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              English Test Result
            </div>

            {/* Username */}
            <div
              style={{
                color: "#6b7280",
                fontSize: 24,
                fontWeight: 600,
                textAlign: "center",
                marginBottom: 30,
              }}
            >
              {displayName}
            </div>

            {/* App name */}
            <div
              style={{
                fontSize: 20,
                color: "#9ca3af",
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              {appName}
            </div>

            {/* Performance indicator */}
            <div
              style={{
                marginTop: 20,
                padding: "8px 16px",
                background: band >= 6 ? "#dcfce7" : "#f3f4f6",
                color: band >= 6 ? "#166534" : "#374151",
                borderRadius: 20,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {band >= 6 ? "Excellent Performance" : "Good Effort"}
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
  } catch (error) {
    console.error("Error generating ImageResponse:", error);

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
            <div>Error generating image</div>
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
