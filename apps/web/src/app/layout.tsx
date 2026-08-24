import React from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ZOBBRA | Premium B2B Custom Merchandise & Corporate Branding Platform',
  description:
    'Custom apparel, corporate merchandise and branded products for businesses, teams and events. Get a free quote today.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-[#F8F9FC] text-[#111111] antialiased selection:bg-[#3B6FEB] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
