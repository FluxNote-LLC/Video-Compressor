import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Frame — Free Video Compressor',
  icons: { icon: '/favicon.svg' },
  description: 'Make your videos smaller, right in your browser. Free, private, open-source video compression with no sign-up or watermark.',
  openGraph: { title: 'Frame — Small file. Big possibilities.', description: 'Private, free video compression. Your files stay on your device.' },
  twitter: { card: 'summary', title: 'Frame — Free Video Compressor', description: 'Small file. Big possibilities. Compress videos on your device.' },
};
export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
