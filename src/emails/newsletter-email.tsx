import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatDate } from "@/lib/format-date";
import type { CSSProperties } from "react";

export type NewsletterEmailProps = {
  name: string | null | undefined;
  senderName: string;
  subject: string;
  slug?: string;
  customContent: string;
  ctaUrl: string;
  ctaButtonLabel?: string;
  unsubscribeToken?: string;
  image?: string;
};

export default function NewsletterEmailTemplate({
  senderName = "فريق المنصة",
  name = "مشتركنا العزيز",
  subject,
  slug,
  image = process.env.NEXT_PUBLIC_APP_URL + "/newsletter-header.png",
  customContent,
  ctaUrl,
  ctaButtonLabel = "زيارة المنصة",
  unsubscribeToken,
}: NewsletterEmailProps) {
  const year = new Date().getFullYear();

  const getTimeOfDay = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) return "صباح";
    if (hours < 18) return "مساء";
    return "مساء";
  };

  return (
    <Html dir="rtl" lang="ar">
      <Head>
        <title>{subject}</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'IBM Plex Sans Arabic';
                src: url('/fonts/ibmplexsansarabic-regular.woff2') format('woff2');
                font-weight: 400;
                font-style: normal;
                font-display: swap;
              }
              @font-face {
                font-family: 'IBM Plex Sans Arabic';
                src: url('/fonts/ibmplexsansarabic-bold.woff2') format('woff2');
                font-weight: 700;
                font-style: normal;
                font-display: swap;
              }
              html, body, * {
                font-family: 'IBM Plex Sans Arabic', sans-serif !important;
              }
            `,
          }}
        />
      </Head>
      <Preview>{subject}</Preview>
      <Body style={{ ...main, fontFamily: "IBM Plex Sans Arabic" }}>
        <Container style={container}>
          {/* Header with gradient background */}
          <Section style={headerSection}>
            <div style={gradientOverlay}>
              <Img
                src={image}
                width="100%"
                height="350"
                alt={process.env.NEXT_PUBLIC_APP_NAME}
                style={headerImage}
              />
            </div>
          </Section>

          {/* Heading with Sender Name & Sending Date */}
          <Section style={headingSectionOuter}>
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              role="presentation"
              style={{ width: "100%" }}
            >
              <tr>
                <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                  <Text style={senderText}>من: {senderName}</Text>
                </td>
                <td style={{ textAlign: "left", verticalAlign: "middle" }}>
                  <Text style={dateText}>{formatDate(new Date().toDateString(), true)}</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Main content section */}
          <Section style={contentSection}>
            <div style={contentWrapper}>
              <div style={mainHeadingContainer}>
                <Heading as="h1" style={mainHeading}>
                  {subject ?? `نشرة ${process.env.NEXT_PUBLIC_APP_NAME}`}
                </Heading>
              </div>

              <Text style={greeting}>
                {getTimeOfDay()} الخير {name} {getTimeOfDay() === "صباح" ? "🌞" : "🌚"}
              </Text>

              {/* Custom content with better styling */}
              <div style={contentArea}>
                <div dangerouslySetInnerHTML={{ __html: customContent }} />
              </div>

              {/* CTA Section */}
              {ctaButtonLabel && (
                <Section style={ctaSection}>
                  <div style={ctaContainer}>
                    <div style={ctaGlow}>
                      <Button href={ctaUrl} style={ctaButton}>
                        <span style={ctaButtonText}>{ctaButtonLabel}</span>
                      </Button>
                    </div>
                  </div>
                </Section>
              )}
            </div>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <div style={{ padding: "10px 0 0 0", textAlign: "center" }}>
              <table
                width="100%"
                cellPadding="0"
                cellSpacing="0"
                style={{ margin: "0 auto", width: "auto" }}
              >
                <tr>
                  <td style={{ textAlign: "center", padding: "0 12px" }}>
                    <Link
                      href={`https://www.linkedin.com/company/john-al-shiekh`}
                      style={{ color: "#999", display: "inline-block" }}
                    >
                      <Img
                        src={process.env.NEXT_PUBLIC_APP_URL + "/newsletter-assets/linkedin.png"}
                        width="24"
                        height="24"
                        alt="LinkedIn"
                        style={logoImage}
                      />
                    </Link>
                  </td>
                  <td style={{ textAlign: "center", padding: "0 12px" }}>
                    <Link
                      href={process.env.NEXT_PUBLIC_APP_URL}
                      style={{ color: "#999", display: "inline-block" }}
                    >
                      <Img
                        src={process.env.NEXT_PUBLIC_APP_URL + "/newsletter-assets/website.png"}
                        width="24"
                        height="24"
                        alt="Website"
                        style={logoImage}
                      />
                    </Link>
                  </td>
                </tr>
              </table>

              <Text style={{ textAlign: "center", fontSize: "11px", margin: "10px 0" }}>
                <Link
                  href={
                    slug
                      ? `${process.env.NEXT_PUBLIC_APP_URL}/articles/${slug}`
                      : `${process.env.NEXT_PUBLIC_APP_URL}/articles`
                  }
                  style={{ color: "#999", textDecoration: "underline" }}
                >
                  لقراءة النشرة على منصة {process.env.NEXT_PUBLIC_APP_NAME}
                </Link>
              </Text>

              <hr style={{ border: "0.5px solid #efede8", margin: "10px 36px" }} />

              <Text style={{ textAlign: "center", fontSize: "11px", margin: 0 }}>
                <Link
                  href={`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${unsubscribeToken ?? ""}`}
                  style={{ color: "#999", textDecoration: "underline" }}
                >
                  لإلغاء الاشتراك من هنا
                </Link>
              </Text>
              <table width="100%" cellPadding="0" cellSpacing="0" style={{ textAlign: "center" }}>
                <tr>
                  <td style={{ textAlign: "center", paddingBottom: "20px" }}>
                    <table cellPadding="0" cellSpacing="0" style={{ display: "inline-table" }}>
                      <tr>
                        <td style={{ verticalAlign: "middle", paddingLeft: "16px" }}>
                          <div style={logoContainer}>
                            <Img
                              src={process.env.NEXT_PUBLIC_APP_URL + "/logo.png"}
                              width="50"
                              height="50"
                              alt={process.env.NEXT_PUBLIC_APP_NAME}
                              style={logoImage}
                            />
                          </div>
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          <span style={logoText}>{process.env.NEXT_PUBLIC_APP_NAME}</span>
                          <Text style={footerText}>
                            © {year} {process.env.NEXT_PUBLIC_APP_NAME} ● جميع الحقوق محفوظة.
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Enhanced Styles
const main: CSSProperties = {
  fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  backgroundColor: "#f8fafc",
  margin: 0,
  padding: 0,
  color: "#1a202c",
  direction: "rtl",
  textAlign: "right",
  lineHeight: "1.6",
};

const container: CSSProperties = {
  maxWidth: "640px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
};

const headerSection: CSSProperties = {
  // background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  padding: "20px 10px 5px",
  textAlign: "center",
  position: "relative",
};

const gradientOverlay: CSSProperties = {
  position: "relative",
  zIndex: 1,
};

const logoContainer: CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderRadius: "50%",
  padding: "8px",
  backdropFilter: "blur(10px)",
  border: "2px solid rgba(255, 255, 255, 0.3)",
};
const logoImage: CSSProperties = {
  display: "block",
  borderRadius: "50%",
  border: "2px solid #ffffff",
};

const logoText: CSSProperties = {
  fontSize: "26px",
  color: "#000",
  fontWeight: "700",
  textDecoration: "none",
  display: "inline-block",
  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
  letterSpacing: "0.5px",
};

const headerImage: CSSProperties = {
  display: "block",
  borderRadius: "16px",
  width: "100%",
  height: "auto",
};

const contentSection: CSSProperties = {
  padding: "0",
  backgroundColor: "#ffffff",
};

const contentWrapper: CSSProperties = {
  padding: "40px 30px",
};

const mainHeading: CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#2d3748",
  margin: "0",
  textAlign: "center",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  letterSpacing: "-0.5px",
};

const mainHeadingContainer: CSSProperties = {
  backgroundColor: "#f7fafc",
  padding: "20px",
  borderRadius: "12px",
  borderLeft: "4px solid #667eea",
  marginBottom: "12px",
};

const greeting: CSSProperties = {
  fontSize: "15px",
  color: "#4a5568",
  fontWeight: "600",
  margin: "0",
  lineHeight: "1.5",
};

const contentArea: CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.7",
  color: "#2d3748",
  marginBottom: "40px",
};

const ctaSection: CSSProperties = {
  textAlign: "center",
  margin: "40px 0",
};

const ctaContainer: CSSProperties = {
  display: "inline-block",
};

const ctaButton: CSSProperties = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#ffffff",
  padding: "16px 32px",
  borderRadius: "50px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "16px",
  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  border: "none",
  transition: "all 0.3s ease",
  display: "inline-block",
  textAlign: "center",
  cursor: "pointer",
  minWidth: "200px",
  position: "relative",
  overflow: "hidden",
  transform: "translateY(0)",
};

const ctaButtonText: CSSProperties = {
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "600",
  position: "relative",
  zIndex: 1,
};

const ctaGlow: CSSProperties = {
  position: "relative",
  display: "inline-block",
};

const footerSection: CSSProperties = {
  backgroundColor: "#f8fafc",
  borderTop: "1px solid #e2e8f0",
};

const footerText: CSSProperties = {
  fontSize: "11px",
  color: "#718096",
  margin: "0 0 8px 0",
  fontWeight: "500",
};

const headingSectionOuter: CSSProperties = {
  padding: "10px 30px",
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "14px",
  fontWeight: "500",
};

const senderText: CSSProperties = {
  color: "#4a5568",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const dateText: CSSProperties = {
  color: "#718096",
  fontSize: "14px",
  fontWeight: "400",
  margin: "0",
};
