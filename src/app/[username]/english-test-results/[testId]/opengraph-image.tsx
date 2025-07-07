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

export default async function OpenGraphImage({ params }: Props) {
  const { username, testId } = await params;

  try {
    const testData = await api.users.getPublicTestById({ testId });

    if (!testData) {
      return notFound();
    }

    const userName = testData.user.displayName ?? `@${username}`;
    const band = testData.band;
    const testDate = new Date(testData.createdAt).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            fontFamily: "system-ui",
            direction: "rtl",
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
              borderRadius: "24px",
              padding: "60px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "900px",
              height: "450px",
            }}
          >
            {/* Band Score Circle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: bandBg,
                border: `4px solid ${bandColor}`,
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: bandColor,
                }}
              >
                {band}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: "42px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              نتيجة اختبار المحادثة
            </h1>

            {/* User Info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "#6b7280",
                fontSize: "24px",
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                تم الاختبار بواسطة <strong style={{ color: "#374151" }}>{userName}</strong>
              </div>
              <div>{testDate}</div>
            </div>

            {/* Performance Indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "24px",
                padding: "12px 24px",
                background: bandBg,
                borderRadius: "12px",
                border: `2px solid ${bandColor}`,
              }}
            >
              <span style={{ fontSize: "20px", color: bandColor, fontWeight: "600" }}>
                {band >= 6 ? "أداء ممتاز" : "يمكن التحسين"}
              </span>
            </div>
          </div>

          {/* App Name Footer */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              right: "30px",
              color: "white",
              fontSize: "18px",
              opacity: 0.8,
            }}
          >
            اختبار اللغة الإنجليزية
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
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            fontFamily: "system-ui",
            direction: "rtl",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "white",
              borderRadius: "24px",
              padding: "60px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <h1
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "#1f2937",
                textAlign: "center",
              }}
            >
              نتيجة اختبار اللغة الإنجليزية
            </h1>
            <p
              style={{
                fontSize: "24px",
                color: "#6b7280",
                marginTop: "16px",
                textAlign: "center",
              }}
            >
              مشاركة نتائج اختبار المحادثة
            </p>
          </div>
        </div>
      ),
      {
        ...size,
      },
    );
  }
}
