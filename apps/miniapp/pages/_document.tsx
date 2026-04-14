import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/*
          Telegram WebApp SDK.
          Must load SYNCHRONOUSLY before any app JS runs.
          Do NOT add async or defer here.
        */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </Head>
      <body style={{ margin: 0, padding: 0, background: '#050810' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}