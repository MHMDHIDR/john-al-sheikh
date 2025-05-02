import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { env } from "@/env";
import type { CSSProperties } from "react";

export type FeedbackEmailProps = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function FeedbackEmailTemplate({ name, email, subject, message }: FeedbackEmailProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head>
        <title>New Feedback from {name}</title>
      </Head>
      <Preview>
        New feedback received from {name} on {env.NEXT_PUBLIC_APP_NAME}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading as="h1" style={logo}>
              {env.NEXT_PUBLIC_APP_NAME} - User Feedback
            </Heading>
          </Section>

          <Section style={contentSection}>
            <Heading as="h2" style={heading}>
              New Feedback Received
            </Heading>

            <Text style={infoItem}>
              <strong>From:</strong> {name} ({email})
            </Text>
            <Text style={infoItem}>
              <strong>Subject:</strong> {subject}
            </Text>

            <Hr style={divider} />

            <Heading as="h3" style={messageHeading}>
              Message:
            </Heading>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {year} {env.NEXT_PUBLIC_APP_NAME}. All rights reserved.
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

const logo: CSSProperties = {
  fontSize: "24px",
  color: "#333333",
  fontWeight: "bold",
};

const contentSection: CSSProperties = {
  padding: "20px 0",
};

const heading: CSSProperties = {
  fontSize: "20px",
  color: "#333333",
  fontWeight: 500,
  marginBottom: "20px",
};

const infoItem: CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "12px 0",
};

const messageHeading: CSSProperties = {
  fontSize: "18px",
  color: "#333333",
  fontWeight: 500,
  marginTop: "20px",
};

const messageText: CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "12px 0",
  whiteSpace: "pre-wrap",
  padding: "15px",
  backgroundColor: "#f7f7f7",
  borderRadius: "4px",
  border: "1px solid #eeeeee",
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
