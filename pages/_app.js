import '../styles/globals.css';
import '../styles/landing.css';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  // Force dark mode on mount — the brand IS dark
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  }, []);

  return (
    <>
      <Head>
        <title>VibeCheck AI - Autonomous Self-Healing CI/CD Pipeline</title>
        <meta name="description" content="Autonomous Self-Healing CI/CD Pipeline Triage Agent. Detects failures, diagnoses root causes with Gemini AI, patches code, and opens verified Pull Requests." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Google Fonts: Inter + JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m12 3-1.912 5.813a2 2 0 0 0-1.275 1.275L3 12l5.813 1.912a2 2 0 0 0 1.275 1.275L12 21l1.912-5.813a2 2 0 0 0 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 0-1.275-1.275Z%22/><path d=%22m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 6Z%22/><path d=%22m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z%22/></svg>" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
