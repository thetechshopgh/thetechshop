// app/layout.js (UPDATED)
import './globals.css';
import { CartProvider } from '../components/CartContext'; // Adjust path as needed

// Metadata is optional but good practice
export const metadata = {
  title: 'Future Tech Retail',
  description: 'Premium gadgets for the modern creator.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* WRAP CHILDREN IN THE CART PROVIDER */}
        <CartProvider> 
            {children}
        </CartProvider>
      </body>
    </html>
  );
}
