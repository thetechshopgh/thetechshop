// app/layout.js (FINAL STRUCTURAL FIX)
import './globals.css';
import { CartProvider } from '../components/CartContext';
import CartDisplay from '../components/CartDisplay'; // 🚨 NEW IMPORT

export const metadata = {
  title: {
    default: 'The Tech Shop | Affordable Electronics & Gadgets',
    template: '%s | The Tech Shop',
  },
  description:
    'The Tech Shop is your trusted hub for affordable laptops, phones, and electronic gadgets in Ghana.',

  cons: {
    icon: '/favicon.ico', // Standard favicon (place in /app directory)
    shortcut: '/favicon-16x16.png', // Shortcut icon (optional, place in /public)
    apple: '/apple-touch-icon.png', // Apple touch icon (optional, place in /public)
  },
  
  keywords: [
    'electronics shop',
    'buy laptops Ghana',
    'tech gadgets',
    'phones and accessories',
    'The Tech Shop',
  ],

  openGraph: {
    title: 'The Tech Shop | Affordable Electronics & Gadgets',
    description:
      'Shop laptops, phones, and quality electronic gadgets at the best prices.',
    url: 'https://thetechshop.vercel.app',
    siteName: 'The Tech Shop',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Tech Shop – Electronics & Gadgets',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'The Tech Shop | Affordable Electronics & Gadgets',
    description:
      'Your trusted hub for laptops, phones, and electronic gadgets.',
    images: ['/og-image.png'],
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>

          <CartDisplay />
          
          {children}
          
        </CartProvider>
      </body>
    </html>
  );
}
