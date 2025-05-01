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

export type WelcomeEmailProps = {
  name: string;
  ieltsGoal: string;
  signupUrl: string;
};

export function WelcomeEmailTemplate({ name, ieltsGoal, signupUrl }: WelcomeEmailProps) {
  const year = new Date().getFullYear();

  return (
    <Html dir="rtl" lang="ar">
      <Head>
        <title>مرحباً بك في منصة {env.NEXT_PUBLIC_APP_NAME} للايلتس</title>
      </Head>
      <Preview>نرحب بك في رحلتك نحو النجاح في اختبار الايلتس!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading as="h1" style={logo}>
              <Img
                src={env.NEXT_PUBLIC_APP_URL + "/logo.png"}
                width="40"
                height="40"
                alt={env.NEXT_PUBLIC_APP_NAME}
                className="rounded-full"
              />
              {env.NEXT_PUBLIC_APP_NAME}
            </Heading>
            <small style={smallText}>منصتك لتعلم وممارسة الايلتس</small>
          </Section>

          <Section style={contentSection}>
            <Heading as="h2" style={greeting}>
              مرحباً {name}،
            </Heading>

            <Text style={paragraph}>
              شكراً على اشتراكك في النشرة البريدية الخاصة بتعليم الايلتس. يسعدنا انضمامك إلى
              مجتمعنا!
            </Text>

            <Text style={paragraph}>
              هدفك هو الوصول إلى درجة {ieltsGoal} في الايلتس، ونحن هنا لمساعدتك على تحقيق ذلك خطوة
              بخطوة.
            </Text>

            <Text style={paragraph}>
              سنرسل لك نصائح وإرشادات منتظمة، إضافة إلى موارد مفيدة ستساعدك في رحلتك التعليمية.
            </Text>

            <Section style={ctaContainer}>
              <Button href={signupUrl} style={ctaButton}>
                إنشاء حساب الآن
              </Button>
            </Section>

            <Text style={paragraph}>
              قم بإنشاء حساب للوصول إلى مزيد من الميزات والموارد المخصصة لتعلم الايلتس وتحقيق درجة
              أعلى.
            </Text>

            <Text style={paragraph}>نتطلع إلى مساعدتك في تحقيق أهدافك التعليمية!</Text>
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

const logo: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  fontSize: "24px",
  color: "#333333",
  fontWeight: "bold",
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
