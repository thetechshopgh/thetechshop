import './globals.css'; // Import global CSS here

// Metadata is optional but good practice
export const metadata = {
  title: 'Future Tech Retail',
  description: 'Premium gadgets for the modern creator.',
};

// The Root Layout Component
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* The body tag wraps your entire application */}
      <body>
        {/* The 'children' prop is where all your pages and nested layouts will be rendered */}
        {children}
      </body>
    </html>
  );
}
