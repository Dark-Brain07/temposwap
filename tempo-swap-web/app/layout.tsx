import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tempo SWAP',
  description: 'The Professional DEX for Tempo Testnet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-slate-950 text-white min-h-screen flex flex-col"}>
        <Providers>
          <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex-shrink-0 flex items-center gap-3">
                  {/* Logo Placeholder - User will replace with Image */}
                  <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                    TEMPO SWAP
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Link href="/" className="hover:text-cyan-400 transition-colors font-medium">Swap</Link>
                  <Link href="/liquidity" className="hover:text-cyan-400 transition-colors font-medium">Liquidity</Link>
                  <Link href="/create-token" className="hover:text-cyan-400 transition-colors font-medium">Create Token</Link>
                </div>
                <div>
                  <ConnectButton />
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-grow">
            {children}
          </main>

          <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-slate-400">
              <div className="text-sm">
                © 2026 Tempo SWAP. All rights reserved.
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-sm">Developed by</span>
                <Link href="https://x.com/rajuice007" target="_blank" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  @rajuice007
                </Link>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
