import { SessionProvider } from "next-auth/react";
import { FeedbackButton } from "@/components/custom/feedback-button";
import Nav from "@/components/custom/nav";
import { auth } from "@/server/auth";
import { Providers } from "./providers";
import { ThemeProvider } from "./providers/theme-provider";
import "@/styles/globals.css";
import { Geist, IBM_Plex_Sans_Arabic } from "next/font/google";
import type { Metadata } from "next";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
});

export const metadata: Metadata = {
  title: "John Al-Shiekh – IELTS Speaking Practice with Instant Feedback",
  description:
    "Enhance your IELTS speaking skills with John Al-Shiekh's AI-powered platform. Engage in realistic mock interviews and receive instant, detailed feedback to boost your performance.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user;
  const theme = user?.theme ?? "light";

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geist.variable} ${ibmPlexSansArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta content="width=device-width, initial-scale=1 maximum-scale=1" name="viewport" />
        <link href="/logo.svg" rel="icon" type="image/svg+xml" />
        <script
          defer
          src="https://analytics.technodevlabs.com/script.js"
          data-website-id="594e98df-99fc-4109-9dd4-01ce8549432d"
        ></script>
        <script
          defer
          data-website-id="6836c3c8e0a4cec51964d50f"
          data-domain="www.john-al-shiekh.live"
          src="https://datafa.st/js/script.js"
        ></script>
        <meta
          name="google-site-verification"
          content="KhZvqrqDjQJS93D-wVNVN55qmqI0C1a93a7lB1V66QA"
        />
      </head>
      <body
        className={`font-ibm-arabic antialiased ${geist.className} ${ibmPlexSansArabic.className}`}
      >
        <SessionProvider>
          <Providers>
            <Nav user={user} key={user?.image} isHidden />
            <ThemeProvider
              attribute="class"
              defaultTheme={theme}
              disableTransitionOnChange
              enableSystem
            >
              {children}
              <FeedbackButton />
            </ThemeProvider>
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
