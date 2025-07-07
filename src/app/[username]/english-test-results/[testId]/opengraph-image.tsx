import { ImageResponse } from "next/og";
import { env } from "@/env";
import { formatTestType } from "@/lib/format-test-type";
import { api } from "@/trpc/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type PageProps = {
  params: Promise<{ username: string; testId: string }>;
};

export default async function Image({ params }: PageProps) {
  const { username, testId } = await params;

  let testData = null;
  try {
    testData = await api.users.getPublicTestById({ testId });
  } catch (e) {
    console.error("Error fetching test data for OG image:", e);
  }

  // Fallbacks
  const band = testData?.band ?? 0;
  const displayName = testData?.user?.displayName ?? username.replace("@", "");
  const appName = env.NEXT_PUBLIC_APP_NAME ?? "john-al-shiekh.live";
  const testType = testData?.type ?? "MOCK";

  try {
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
            backgroundColor: "#0070f3", // Simple solid background
            color: "#ffffff",
            fontSize: 60,
            fontWeight: "bold",
            textAlign: "center",
            padding: 40,
          }}
        >
          <div>Band: {Number(band)}</div>
          <div style={{ fontSize: 40, marginTop: 10 }}>@{displayName}</div>
          <div style={{ fontSize: 30, marginTop: 5 }}>
            {formatTestType(testType)} Test Result on {appName}
          </div>
        </div>
      ),
      { ...size },
    );
  } catch (error) {
    console.error("Error generating ImageResponse for OG image:", error);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ef4444", // Red background for error
            fontSize: 48,
            color: "#ffffff",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          <div>
            <div>Error generating OG image</div>
            <div style={{ fontSize: 24, marginTop: 10 }}>Please try again later.</div>
          </div>
        </div>
      ),
      { ...size },
    );
  }
}
