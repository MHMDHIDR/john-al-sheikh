import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Next.js 15+ passes params as a Promise
type PageProps = {
  params: Promise<{ username: string; testId: string }>;
};

export default async function Image({ params }: PageProps) {
  // Await the params since they're now a Promise in Next.js 15+
  const { username, testId } = await params;

  // Returning a very basic image response to isolate the issue.
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
          backgroundColor: "#1da1f2", // Twitter blue background
          color: "#ffffff",
          fontSize: 60,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        <div>{username}</div>
        <div style={{ fontSize: 40, marginTop: 10 }}>Band {testId}</div>
        <div style={{ fontSize: 30, marginTop: 5 }}>John-Al-Shekh.live</div>
      </div>
    ),
    { ...size },
  );
}
