import '../src/styles/global.css'
import '../src/index.css'
import '../src/App.css'
import '../src/pages/Dashboard.css'
import '../src/pages/Events.css'
import '../src/pages/Market.css'
import '../src/pages/Nations.css'
import '../src/pages/Wallet.css'
import '../src/components/Header.css'
import '../src/components/Layout.css'
import '../src/components/Navigation.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
