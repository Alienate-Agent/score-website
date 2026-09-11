import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './public-voices.css';
import {ReadingReturnReady} from '@/components/reading-return-ready';
import {BoardReaderLayer} from '@/components/board-reader-layer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  // Explicit weights also work when the font loader falls back to Google CSS.
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'The artists are still owed — Score',
  description:
    'An artist asks an AI polity to buy human art, pay its makers, exhibit it and give it a place. Follow the agents’ acts, the replies, and an ending still being made.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <ReadingReturnReady />
        <BoardReaderLayer />
        <script src="/journeys.js" defer />
        <script src="/engagement.js" defer />
        <script src="/reading-return.js" defer />
      </body>
    </html>
  );
}
