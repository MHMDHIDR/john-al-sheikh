import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// Use Edge Runtime for faster cold starts
export const runtime = "edge";

// Define our supported page types
type PageType = "homepage" | "service" | "blog" | "blogArticle" | "about" | "contact";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // Extract parameters with defaults
    const type = (searchParams.get("type") as PageType) ?? "homepage";
    const title = searchParams.get("title") ?? "Welcome";
    const subtitle = searchParams.get("subtitle") ?? "";
    const backgroundImage = searchParams.get("image") ?? "";

    // Build background image URL if provided
    const imageUrl = backgroundImage
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.john-al-shiekh.live"}/${backgroundImage}`
      : null;

    // Define styles based on page type
    const getTypeStyles = (pageType: PageType) => {
      const baseStyles = {
        homepage: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", badge: "🏠 HOME" },
        service: { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", badge: "🔧 SERVICES" },
        blog: { bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", badge: "📝 BLOG" },
        blogArticle: {
          bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          badge: "📖 ARTICLE",
        },
        about: { bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", badge: "👋 ABOUT" },
        contact: { bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", badge: "📧 CONTACT" },
      };
      return baseStyles[pageType] ?? baseStyles.homepage;
    };

    const styles = getTypeStyles(type);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: imageUrl ? `url(${imageUrl})` : styles.bg,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: "60px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Overlay for better text readability when using background images */}
          {imageUrl && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.4)",
              }}
            />
          )}

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
            {/* Badge */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                borderRadius: "25px",
                padding: "12px 24px",
                fontSize: "24px",
                fontWeight: "600",
                color: "white",
                marginBottom: "40px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {styles.badge}
            </div>

            {/* Main Title */}
            <div
              style={{
                fontSize: title.length > 50 ? "56px" : "72px",
                fontWeight: "800",
                color: "white",
                lineHeight: "1.1",
                textShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                marginBottom: subtitle ? "20px" : "0",
                maxWidth: "1000px",
              }}
            >
              {title}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "400",
                  color: "rgba(255, 255, 255, 0.9)",
                  lineHeight: "1.3",
                  maxWidth: "900px",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Bottom branding/domain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "24px",
              color: "rgba(255, 255, 255, 0.8)",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
                marginRight: "12px",
              }}
            />
            yourdomain.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontSize: "48px",
            fontWeight: "bold",
          }}
        >
          Something went wrong
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }
}
