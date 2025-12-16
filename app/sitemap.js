// app/sitemap.js

import { supabase } from '@/lib/supabase'; // Import your Supabase client
import { absoluteUrl } from '@/lib/utils'; // Assuming you have a utility to create absolute URLs

// NOTE: If you don't have a utils file, you can hardcode the base URL as before:
// const baseUrl = 'https://techycity.vercel.app'; 

export default async function sitemap() {
  // Use absoluteUrl to ensure all URLs are complete, e.g., https://techycity.vercel.app
  // If absoluteUrl is not available, replace it with your hardcoded domain.
  const baseUrl = 'https://techycity.vercel.app'; 

  // 1. Fetch Dynamic Product Data from Supabase
  // We need the 'id' for the URL and 'updated_at' for the <lastmod> tag.
  const { data: products, error } = await supabase
    .from('products')
    .select('id, updated_at');

  if (error) {
    console.error('Error fetching products for sitemap:', error);
    // Return only static routes if the database fetch fails
    return getStaticRoutes(baseUrl);
  }

  // 2. Generate Product Routes
  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    // Set lastModified using the 'updated_at' timestamp from Supabase
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly', // Products may be updated weekly (e.g., price, stock, description)
    priority: 0.8, 
  }));

  // 3. Get Static Routes
  const staticRoutes = getStaticRoutes(baseUrl);
  
  // 4. Combine and return all routes
  return [...staticRoutes, ...productRoutes];
}


// Function to define static routes (Homepage, About, etc.)
function getStaticRoutes(baseUrl) {
  return [
    {
      url: baseUrl, 
      lastModified: new Date(),
      changeFrequency: 'daily', // Homepage changes often (new arrivals, specials)
      priority: 1.0, 
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Add other essential static pages here:
    // {
    //   url: `${baseUrl}/contact`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.6,
    // },
  ];
}
