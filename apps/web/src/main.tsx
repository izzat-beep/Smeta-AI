import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { bootstrapLangRouting } from './i18n'; // i18next init + URL til prefiksi
import { App } from './App';
import { AuthProvider } from './lib/auth';
import { CurrencyProvider } from './lib/currency';
import { CartProvider } from './lib/cart';
import { ThemeProvider } from './lib/theme';

// URLni til prefiksi bilan ta'minlaydi (/uz yoki /ru) va router basename'ini
// beradi — barcha havolalar shu prefiks ostida ishlaydi.
const basename = bootstrapLangRouting();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
