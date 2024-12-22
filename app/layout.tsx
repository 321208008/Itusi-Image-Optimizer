import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Image Optimizer',
  description: 'Compress and convert your images with ease',
  icons: {
    icon: '/icon.svg',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="fixed top-4 right-4 flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}