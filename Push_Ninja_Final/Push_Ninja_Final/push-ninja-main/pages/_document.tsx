import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#9B5DE5" />
        <meta
          name="description"
          content="Slash fruits, avoid bombs, and mint your achievements as NFTs on Push Chain blockchain. Play Push Ninja - the ultimate Web3 gaming experience!"
        />
        <meta
          name="keywords"
          content="Push Chain, Push Protocol, NFT, blockchain game, Web3, fruit ninja, gaming, crypto"
        />
        <meta name="author" content="Push Ninja" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://push-ninja.vercel.app/" />
        <meta property="og:title" content="Push Ninja - Blockchain Gaming on Push Chain" />
        <meta
          property="og:description"
          content="Slash fruits, avoid bombs, and mint your achievements as NFTs on Push Chain!"
        />
        <meta property="og:image" content="/android-chrome-512x512.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://push-ninja.vercel.app/" />
        <meta name="twitter:title" content="Push Ninja - Blockchain Gaming on Push Chain" />
        <meta
          name="twitter:description"
          content="Slash fruits, avoid bombs, and mint your achievements as NFTs on Push Chain!"
        />
        <meta name="twitter:image" content="/android-chrome-512x512.png" />
      </Head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
