import '../styles/globals.css';
import '../styles/landing.css';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  // Force dark mode on mount: the brand is dark
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  }, []);

  return (
    <>
      <Head>
        <title>VibeCheck AI</title>
        <meta
          name="description"
          content="Autonomous Self-Correcting CI/CD Pipeline Triage Agent. Detects failures, diagnoses root causes with Gemini AI, patches code, and opens verified Pull Requests."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <link rel="icon" type="image/jpeg" href="/logo.jpg" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
