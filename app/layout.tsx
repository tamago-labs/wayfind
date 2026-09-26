import type { Metadata } from "next";
import Script from "next/script";
import SolanaWalletProvider from "@/components/SolanaWalletProvider";
import ConfigureAmplify from "@/components/ConfigureAmplify";
import { PriceProvider } from "@/contexts/PriceContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zivic — AI Risk Engine for Tokenized Equities on Solana",
  description: "Zivic's AI Risk Engine turns tokenized equities on Solana into productive assets. Research, risk analysis, collateral readiness, and smart routing for xStocks, Ondo Stocks, and PreStocks — all in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=Zen+Tokyo+Zoo&display=swap" rel="stylesheet" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-51VBWDT3P2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-51VBWDT3P2');
          `}
        </Script>
      </head>
      <body className="font-sans">
        <ConfigureAmplify>
        <SolanaWalletProvider>
          <PriceProvider>{children}</PriceProvider>
        </SolanaWalletProvider>
        </ConfigureAmplify>
      </body>
    </html>
  );
}
