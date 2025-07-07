import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { api } from "@/trpc/server";

export const runtime = "nodejs";
export const alt = "نتيجة اختبار اللغة الإنجليزية";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type Props = {
  params: Promise<{ username: string; testId: string }>;
};

type TestDataResponse = {
  user: {
    displayName: string | null;
  };
  band: number;
  createdAt: Date;
};

export default async function OpenGraphImage({ params }: Props) {
  const { username, testId } = await params;

  try {
    const testData: TestDataResponse | null = await api.users.getPublicTestById({ testId });

    if (!testData) {
      return notFound();
    }

    const userName = testData.user.displayName ?? `@${username}`;
    const band = testData.band;

    // Determine band color
    const bandColor = band >= 6 ? "#10b981" : "#6b7280";
    const bandBg = band >= 6 ? "#d1fae5" : "#f3f4f6";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            fontFamily: "system-ui",
          }}
        >
          {/* Main Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "white",
              borderRadius: "20px",
              padding: "80px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              textAlign: "center",
            }}
          >
            {/* Band Score */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: bandColor,
                marginBottom: "30px",
              }}
            >
              <span
                style={{
                  fontSize: "40px",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                {band}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "20px",
                margin: 0,
              }}
            >
              English Test Result
            </h1>

            {/* User Info */}
            <div
              style={{
                fontSize: "24px",
                color: "#6b7280",
                marginBottom: "20px",
              }}
            >
              {userName}
            </div>

            {/* Performance Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 20px",
                background: bandBg,
                borderRadius: "10px",
                border: `2px solid ${bandColor}`,
              }}
            >
              <span style={{ fontSize: "18px", color: bandColor, fontWeight: "600" }}>
                Band {band}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      },
    );
  } catch (error) {
    console.error("Error generating OpenGraph image:", error);

    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            fontFamily: "system-ui",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "white",
              borderRadius: "20px",
              padding: "60px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: 0,
              }}
            >
              English Test Result
            </h1>
          </div>
        </div>
      ),
      {
        ...size,
      },
    );
  }
}
