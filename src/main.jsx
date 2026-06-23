import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

import { config } from './config/wagmi'
import App from './App.jsx'
import './index.css'

import useAppStore from './store/useAppStore'

const queryClient = new QueryClient()

function RainbowKitThemeBoundProvider({ children }) {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  return (
    <RainbowKitProvider theme={isDarkMode ? darkTheme() : lightTheme()}>
      {children}
    </RainbowKitProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemeBoundProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RainbowKitThemeBoundProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
