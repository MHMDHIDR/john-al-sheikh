import { ImageResponse } from "next/og";
import { env } from "@/env";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // Extract parameters with defaults
    const band = searchParams.get("band") ?? "6.5";
    const username = searchParams.get("username") ?? "John-Al-Shiekh.live User";

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
            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
            padding: "40px",
            fontFamily: '"Noto Sans Arabic", system-ui, serif',
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
              border: "20px solid #8B4513",
              borderRadius: "25px",
              padding: "50px 60px",
              position: "relative",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* Decorative Inner Border */}
            <div
              style={{
                position: "absolute",
                top: "30px",
                left: "30px",
                right: "30px",
                bottom: "30px",
                border: "3px solid #DAA520",
                borderRadius: "15px",
                background:
                  "linear-gradient(45deg, rgba(218, 165, 32, 0.05) 0%, rgba(139, 69, 19, 0.05) 100%)",
              }}
            />

            {/* Ornate Corner Decorations */}
            <div
              style={{
                position: "absolute",
                top: "40px",
                left: "40px",
                width: "60px",
                height: "60px",
                background: "linear-gradient(45deg, #DAA520, #B8860B)",
                clipPath: "polygon(0 0, 100% 0, 0 100%)",
                borderRadius: "5px",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "40px",
                right: "40px",
                width: "60px",
                height: "60px",
                background: "linear-gradient(45deg, #DAA520, #B8860B)",
                clipPath: "polygon(100% 0, 100% 100%, 0 0)",
                borderRadius: "5px",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                left: "40px",
                width: "60px",
                height: "60px",
                background: "linear-gradient(45deg, #DAA520, #B8860B)",
                clipPath: "polygon(0 0, 100% 100%, 0 100%)",
                borderRadius: "5px",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                right: "40px",
                width: "60px",
                height: "60px",
                background: "linear-gradient(45deg, #DAA520, #B8860B)",
                clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                borderRadius: "5px",
              }}
            />

            {/* Logo at Top Left */}
            <div
              style={{
                position: "absolute",
                top: "60px",
                left: "80px",
                display: "flex",
                alignItems: "center",
                gap: "15px",
                zIndex: 10,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${env.NEXT_PUBLIC_APP_URL}/logo.svg`}
                alt="John Al-Shiekh Icon"
                width={50}
                height={50}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "50%",
                  padding: "8px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  border: "2px solid #DAA520",
                }}
              />
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#8B4513",
                  letterSpacing: "1px",
                }}
              >
                JOHN AL-SHIEKH
              </div>
            </div>

            {/* Certificate Title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "10px",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "#8B4513",
                  marginBottom: "2px",
                  letterSpacing: "3px",
                  textAlign: "center",
                }}
              >
                CERTIFICATE
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: "#DAA520",
                  fontWeight: "500",
                  letterSpacing: "2px",
                  textAlign: "center",
                }}
              >
                OF ACHIEVEMENT
              </div>
            </div>

            {/* Decorative Line */}
            <div
              style={{
                width: "300px",
                height: "3px",
                background: "linear-gradient(90deg, transparent, #DAA520, transparent)",
                margin: "10px 0",
              }}
            />

            {/* This is to certify that */}
            <div
              style={{
                fontSize: "14px",
                color: "#666666",
                fontStyle: "italic",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              This is to certify that
            </div>

            {/* Student Name */}
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#000000",
                textAlign: "center",
                marginBottom: "15px",
                padding: "0 20px",
                paddingBottom: "10px",
              }}
            >
              {decodeURIComponent(username)}
            </div>

            {/* Achievement Text */}
            <div
              style={{
                fontSize: "20px",
                color: "#333333",
                textAlign: "center",
                marginBottom: "30px",
                lineHeight: "1.4",
                maxWidth: "800px",
              }}
            >
              has successfully achieved a band score of
            </div>

            {/* Band Score Display */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white",
                  fontSize: "24px",
                  fontWeight: "bold",
                  boxShadow: "0 8px 16px rgba(34, 197, 94, 0.3)",
                }}
              >
                <div style={{ fontSize: "24px", fontWeight: "bold", lineHeight: "1" }}>{band}</div>
                <div style={{ fontSize: "14px", fontWeight: "normal", marginTop: "5px" }}>BAND</div>
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#8B4513",
                }}
              >
                in English Speaking Practice
              </div>
            </div>

            {/* Bottom Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "-10px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  color: "#666666",
                  textAlign: "center",
                  marginBottom: "30px",
                }}
              >
                View full details and feedback at
              </div>

              {/* Website Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #8B4513, #A0522D)",
                  color: "white",
                  padding: "15px 30px",
                  borderRadius: "50px",
                  fontSize: "22px",
                  fontWeight: "bold",
                  gap: "10px",
                  boxShadow: "0 4px 8px rgba(139, 69, 19, 0.3)",
                }}
              >
                john-al-shiekh.live
              </div>
            </div>

            {/* Decorative Seal */}
            <div
              style={{
                position: "absolute",
                bottom: "80px",
                right: "100px",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #DAA520, #B8860B)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
                textAlign: "center",
                boxShadow: "0 4px 8px rgba(218, 165, 32, 0.4)",
                border: "3px solid #8B4513",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${env.NEXT_PUBLIC_APP_URL}/logo.svg`}
                alt="John Al-Shiekh Icon"
                width={70}
                height={70}
                style={{
                  opacity: 0.3,
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "5px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                {new Date().toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
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
