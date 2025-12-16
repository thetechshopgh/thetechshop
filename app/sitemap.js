// app/sitemap.js

import { supabase } from '@/lib/supabase'; // Import your Supabase client

// Hardcoded Base URL to fix the Module Not Found Error
const baseUrl = 'https://techycity.vercel.app'; 

export default async function sitemap() {
  
  // 1. Fetch Dynamic Product Data from Supabase
  // Fetch 'id' and 'updated_at' to build the URL and set the last modification date.
  const { data: products, error } = await supabase
    .from('products')
    .select('id, updated_at');

  if (error) {
    console.error('Error fetching products for sitemap:', error);
    // Return only static routes if the database fetch fails, ensuring the sitemap still works.
    return getStaticRoutes(baseUrl);
  }

  // 2. Generate Dynamic Product Routes
  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    // Ensure lastModified is a valid Date object by passing the timestamp:
    lastModified: new Date(product.updated_at), 
    changeFrequency: 'weekly', 
    priority: 0.8, 
  }));

  // 3. Get Static Routes
  const staticRoutes = getStaticRoutes(baseUrl);
  
  // 4. Combine and return all routes
  return [...staticRoutes, ...productRoutes];
}


// Function to define essential static routes
function getStaticRoutes(baseUrl) {
  return [
    {
      url: baseUrl, 
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // Highest priority for the Homepage
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Add other essential static pages here, e.g.:
    // {
    //   url: `${baseUrl}/contact`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.6,
    // },
    // {
    //   url: `${baseUrl}/policy`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.5,
    // },
  ];
}
