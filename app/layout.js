// app/layout.js (FINAL STRUCTURAL FIX)
import './globals.css';
import { CartProvider } from '../components/CartContext';
import CartDisplay from '../components/CartDisplay'; // 🚨 NEW IMPORT

// Metadata is optional but good practice
export const metadata = {
  title: 'The Tech Shop',
  description: 'The best place to get all your tech gadgets.',
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
