import type { Metadata, Viewport } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: 'AskNeer - AI Parenting Companion',
  description: 'Personalized parenting guidance for your child',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AskNeer',
  },
}

export const viewport: Viewport = {
  themeColor: '#E07A5F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}