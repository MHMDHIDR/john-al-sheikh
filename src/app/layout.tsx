import { SessionProvider } from "next-auth/react";
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
  title: "John Al-Sheikh",
  description: "John Al-Sheikh helps you practice your IELTS speaking skills with instant feedback",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user;

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
      </head>
      <body
        className={`font-ibm-arabic antialiased ${geist.className} ${ibmPlexSansArabic.className}`}
      >
        <SessionProvider>
          <Providers>
            <Nav user={user} key={user?.image} isHidden />
            <ThemeProvider
              attribute="class"
              defaultTheme={session?.user.theme ?? "light"}
              disableTransitionOnChange
              enableSystem
            >
              {children}
            </ThemeProvider>
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
