import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// Use Edge Runtime for faster cold starts
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // Extract parameters with defaults
    const title = searchParams.get("title") ?? "English Test Result";
    const subtitle = searchParams.get("subtitle") ?? "";
    const band = searchParams.get("band") ?? "6.5";
    const username = searchParams.get("username") ?? "@username";

    // Load Arabic font (still used for fallback, but text is English)
    const arabicFont = await fetch(
      "https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyvu3CBFQLaig.ttf",
    ).then(res => res.arrayBuffer());

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
            background: "white",
            padding: "40px",
            fontFamily: '"Noto Sans Arabic", system-ui, sans-serif',
          }}
        >
          {/* Certificate Container */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              background: "white",
              border: "8px solid #000000",
              borderRadius: "20px",
              padding: "60px 40px",
              position: "relative",
            }}
          >
            {/* Band Score Circle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                background: "#22c55e",
                color: "white",
                fontSize: "48px",
                fontWeight: "bold",
                marginBottom: "30px",
              }}
            >
              <div style={{ fontSize: "48px", fontWeight: "bold", lineHeight: "1" }}>{band}</div>
              <div style={{ fontSize: "18px", fontWeight: "normal", marginTop: "5px" }}>Band</div>
            </div>

            {/* Main Title with Emojis */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: "bold",
                color: "#000000",
                textAlign: "center",
                marginBottom: "20px",
                direction: "ltr",
                gap: "15px",
              }}
            >
              <div style={{ fontSize: "40px" }}>🎉</div>
              <div style={{ color: "#3b82f6" }}>Achieved</div>
              <div style={{ color: "#22c55e" }}>{band}</div>
              <div style={{ color: "#8b5cf6" }}>in English Speaking Practice</div>
              <div style={{ fontSize: "40px" }}>🎉</div>
            </div>

            {/* Username */}
            <div
              style={{
                fontSize: "28px",
                color: "#6b7280",
                marginBottom: "30px",
                textAlign: "center",
              }}
            >
              {username}
            </div>

            {/* Separator Line */}
            <div
              style={{
                width: "80%",
                height: "2px",
                background: "#e5e7eb",
                marginBottom: "30px",
              }}
            />

            {/* English Description */}
            <div
              style={{
                fontSize: "32px",
                color: "#000000",
                textAlign: "center",
                direction: "ltr",
                fontWeight: "500",
                marginBottom: "40px",
                lineHeight: "1.2",
              }}
            >
              View full details and feedback at John Al Sheikh
            </div>

            {/* Website Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000000",
                color: "white",
                padding: "15px 30px",
                borderRadius: "50px",
                fontSize: "24px",
                fontWeight: "bold",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ color: "#000000", fontSize: "18px" }}>∞</div>
              </div>
              john-al-shiekh.live
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Noto Sans Arabic",
            data: arabicFont,
            style: "normal",
            weight: 400,
          },
        ],
      },
    );
  } catch (error) {
    console.error("Error generating OG image:", error);

    // Return a fallback image on error
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
            background: "white",
            color: "#000000",
            fontSize: "48px",
            fontWeight: "bold",
          }}
        >
          Checkout My English Speaking Result!
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }
}
