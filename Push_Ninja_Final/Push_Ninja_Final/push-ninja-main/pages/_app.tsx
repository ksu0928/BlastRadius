import type { AppProps } from 'next/app';
import { PushUniversalWalletProvider, PushUI } from '@pushchain/ui-kit';
import '../styles/index.css';
import '../styles/App.css';
import '../styles/design-system.css';
import '../styles/unified-design.css';
import '../styles/push-theme.css';

// Component styles
import '../src/components/AchievementModal.css';
import '../src/components/LandingPage.css';
import '../src/components/MissedTokenNotification.css';
import '../src/components/ModeSelection.css';
import '../src/components/MultiplayerLobby.css';
import '../src/components/PointPopup.css';
import '../src/components/ResultsScreen.css';
import '../styles/results-screen.css';
import '../src/components/TierDisplay.css';


import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PushUniversalWalletProvider
      config={{
        network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET,
      }}
    >
      <Component {...pageProps} />
      <SpeedInsights />
      <Analytics />
    </PushUniversalWalletProvider>
  );
}
