import type { Metadata } from 'next';
import './globals.css';
import { LangProvider } from '@/i18n/LangProvider';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'HUMAN-HUB — Salon System',
  description: '美容サービス管理システム / Salon management system',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Loaded via <link> (not next/font) to keep the Japanese serif/sans
            subsets identical to the original design and avoid build-time fetch. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LangProvider>
          <AppShell>{children}</AppShell>
        </LangProvider>
      </body>
    </html>
  );
}
