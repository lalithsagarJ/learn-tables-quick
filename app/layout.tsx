import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tables Quest',
  description: 'An animated multiplication learning game for kids from tables 2 to 20.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
