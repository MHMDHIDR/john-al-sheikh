import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { env } from "@/env";
import type { CSSProperties } from "react";

export function SignInEmailTemplate({ url }: { url: string }) {
  const year = new Date().getFullYear();

  return (
    <Html dir="rtl" lang="ar">
      <Head>
        <title>تسجيل الدخول إلى {env.NEXT_PUBLIC_APP_NAME}</title>
      </Head>
      <Preview>تسجيل الدخول إلى {env.NEXT_PUBLIC_APP_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              style={{ textAlign: "center", margin: "0 auto" }}
            >
              <tr>
                <td style={{ textAlign: "center", paddingBottom: "0" }}>
                  <table cellPadding="0" cellSpacing="0" style={{ display: "inline-table" }}>
                    <tr>
                      <td style={{ verticalAlign: "middle", paddingLeft: "16px" }}>
                        <div
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            borderRadius: "50%",
                            padding: "8px",
                            border: "2px solid rgba(255, 255, 255, 0.3)",
                            display: "inline-block",
                          }}
                        >
                          <Img
                            src={env.NEXT_PUBLIC_APP_URL + "/logo.png"}
                            width="50"
                            height="50"
                            alt={env.NEXT_PUBLIC_APP_NAME}
                            style={{
                              display: "block",
                              borderRadius: "50%",
                              border: "2px solid #ffffff",
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ verticalAlign: "middle" }}>
                        <span
                          style={{
                            fontSize: "26px",
                            color: "#000",
                            fontWeight: "700",
                            textDecoration: "none",
                            display: "inline-block",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {env.NEXT_PUBLIC_APP_NAME}
                        </span>
                        <br />
                        <small style={smallText}>منصتك للمحادثة بالللغة الإنجليزية</small>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </Section>

          <Section style={contentSection}>
            <Heading as="h2" style={greeting}>
              تسجيل الدخول إلى {env.NEXT_PUBLIC_APP_NAME}
            </Heading>

            <Text style={paragraph}>اضغط على الزر أدناه لتسجيل الدخول إلى حسابك.</Text>

            <Section style={ctaContainer}>
              <Button href={url} style={ctaButton}>
                تسجيل الدخول
              </Button>
            </Section>

            <Text style={paragraph}>
              إذا لم تطلب تسجيل الدخول، يمكنك تجاهل هذا البريد الإلكتروني بأمان.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {year} {env.NEXT_PUBLIC_APP_NAME}. جميع الحقوق محفوظة.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main: CSSProperties = {
  fontFamily: "Arial, sans-serif",
  backgroundColor: "#f9f9f9",
  margin: 0,
  padding: 0,
  color: "#333333",
  direction: "rtl",
  textAlign: "right",
};

const container: CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
};

const headerSection: CSSProperties = {
  textAlign: "center",
  margin: "20px 0",
  padding: "20px 0",
  borderBottom: "1px solid #eeeeee",
};

const contentSection: CSSProperties = {
  padding: "20px 0",
};

const greeting: CSSProperties = {
  fontSize: "20px",
  color: "#333333",
  fontWeight: 500,
};

const paragraph: CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "12px 0",
};

const ctaContainer: CSSProperties = {
  textAlign: "center",
  margin: "30px 0",
};

const ctaButton: CSSProperties = {
  backgroundColor: "#000000",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "4px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "16px",
};

const divider: CSSProperties = {
  borderTop: "1px solid #eeeeee",
  margin: "20px 0",
};

const footer: CSSProperties = {
  textAlign: "center",
  color: "#999999",
  fontSize: "14px",
  padding: "10px 0",
};

const footerText: CSSProperties = {
  margin: "6px 0",
};

const smallText: CSSProperties = {
  fontSize: "12px",
  color: "#999999",
};
