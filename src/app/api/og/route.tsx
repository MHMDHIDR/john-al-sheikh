import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { env } from "@/env";
import { formatDate } from "@/lib/format-date";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

function processArabicName(str: string): string {
  const words = str.trim().split(" ");

  const reversedWords = words.reverse().map(word => {
    if (word.includes("-")) {
      const parts = word.split("-");
      return parts.reverse().join("-");
    }
    return word;
  });

  return reversedWords.join(" ");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    // Extract parameters with defaults
    const band = searchParams.get("band") ?? "6.5";
    const username = searchParams.get("username") ?? "John-Al-Shiekh.live User";
    const testId = searchParams.get("testId") ?? "test-id-placeholder";

    // Load Arabic font (using the working URL from your original code)
    const arabicFont = await fetch(
      "https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyvu3CBFQLaig.ttf",
    ).then(res => res.arrayBuffer());

    const certificateUrl = `${env.NEXT_PUBLIC_APP_URL}/${username}/english-test-results/${testId}`;
    const qrDataUrl = await QRCode.toDataURL(certificateUrl, { margin: 1, width: 100 });

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
            // Remove direction: "rtl" from here
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
                  direction: "ltr",
                  textAlign: "right",
                }}
              >
                {processArabicName(env.NEXT_PUBLIC_APP_NAME)}
              </div>
            </div>

            {/* Certificate Title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  fontWeight: "bold",
                  color: "#8B4513",
                  textAlign: "center",
                  direction: "rtl",
                  marginTop: "-20px",
                }}
              >
                الشهادة
              </div>
              <div
                style={{
                  fontSize: "18px",
                  color: "#DAA520",
                  fontWeight: "500",
                  textAlign: "center",
                  direction: "rtl",
                  marginTop: "-10px",
                }}
              >
                {processArabicName("شهادة إنجاز")}
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
                fontSize: "16px",
                color: "#666666",
                fontStyle: "italic",
                textAlign: "center",
                marginBottom: "20px",
                direction: "rtl",
              }}
            >
              {processArabicName("هذا لتأكيد أن")}
            </div>

            {/* Student Name */}
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#000000",
                textAlign: "center",
                paddingBottom: "24px",
                direction: "ltr", // Keep username in LTR for proper display
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
                lineHeight: "2.4",
                maxWidth: "800px",
                direction: "rtl",
              }}
            >
              درجة على بنجاح حصل قد
            </div>

            {/* Band Score Display */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                marginBottom: "30px",
                direction: "rtl",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#8B4513",
                  textAlign: "center",
                  direction: "rtl",
                }}
              >
                {processArabicName("في التحدث باللغة الإنجليزية")}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  width: "72px",
                  height: "72px",
                  padding: "2px",
                  lineHeight: "1",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white",
                  fontSize: "20px",
                  fontWeight: "bold",
                  boxShadow: "0 8px 16px rgba(34, 197, 94, 0.3)",
                }}
              >
                <strong style={{ fontSize: "24px", fontWeight: "bold", lineHeight: "1" }}>
                  {band}
                </strong>
                <small>درجة</small>
              </div>
            </div>

            {/* Bottom Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "-16px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  color: "#666666",
                  textAlign: "center",
                  marginBottom: "30px",
                  direction: "rtl",
                }}
              >
                {processArabicName("تم إصدار هذه الشهادة من قبل")}
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
                  opacity: 0.5,
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "5px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "-1px",
                }}
              >
                {processArabicName(formatDate(new Date().toDateString(), true))}
              </div>
            </div>

            {/* QR Code */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code"
              width={110}
              height={110}
              style={{
                position: "absolute",
                bottom: "64px",
                left: "100px",
                border: "2px solid #8B4513",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            />
            <small
              style={{
                position: "absolute",
                bottom: "40px",
                left: "100px",
                fontSize: "12px",
              }}
            >
              {processArabicName("للتأكد من صلاحية الشهادة")}
            </small>
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
