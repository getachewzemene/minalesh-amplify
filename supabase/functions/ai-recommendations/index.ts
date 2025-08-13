import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecommendationRequest {
  user_id?: string;
  product_id?: string;
  category_id?: string;
  limit?: number;
  type: 'similar' | 'recommended' | 'trending' | 'personalized';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { user_id, product_id, category_id, limit = 10, type }: RecommendationRequest = await req.json();

    let recommendations = [];

    switch (type) {
      case 'similar':
        if (!product_id) {
          throw new Error("product_id is required for similar products");
        }
        recommendations = await getSimilarProducts(supabaseClient, product_id, limit);
        break;

      case 'trending':
        recommendations = await getTrendingProducts(supabaseClient, limit);
        break;

      case 'personalized':
        if (!user_id) {
          throw new Error("user_id is required for personalized recommendations");
        }
        recommendations = await getPersonalizedRecommendations(supabaseClient, user_id, limit);
        break;

      case 'recommended':
      default:
        recommendations = await getRecommendedProducts(supabaseClient, category_id, limit);
        break;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations,
        type,
        count: recommendations.length 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function getSimilarProducts(supabaseClient: any, productId: string, limit: number) {
  // Get the current product to find similar ones
  const { data: currentProduct } = await supabaseClient
    .from('products')
    .select('category_id, price')
    .eq('id', productId)
    .single();

  if (!currentProduct) return [];

  // Find products in same category with similar price range
  const priceRange = currentProduct.price * 0.3; // 30% price variance

  const { data: products } = await supabaseClient
    .from('products')
    .select(`
      id, name, slug, price, sale_price, images,
      rating_average, rating_count, is_featured,
      profiles!vendor_id (display_name, vendor_status)
    `)
    .eq('category_id', currentProduct.category_id)
    .neq('id', productId)
    .eq('is_active', true)
    .gte('price', currentProduct.price - priceRange)
    .lte('price', currentProduct.price + priceRange)
    .order('rating_average', { ascending: false })
    .limit(limit);

  return products || [];
}

async function getTrendingProducts(supabaseClient: any, limit: number) {
  // Get products with highest view count and sales in last 30 days
  const { data: products } = await supabaseClient
    .from('products')
    .select(`
      id, name, slug, price, sale_price, images,
      rating_average, rating_count, view_count, sale_count,
      profiles!vendor_id (display_name, vendor_status)
    `)
    .eq('is_active', true)
    .order('view_count', { ascending: false })
    .order('sale_count', { ascending: false })
    .limit(limit);

  return products || [];
}

async function getPersonalizedRecommendations(supabaseClient: any, userId: string, limit: number) {
  // Get user's purchase history and wishlist
  const { data: orderItems } = await supabaseClient
    .from('order_items')
    .select('product_id, products!inner(category_id)')
    .eq('orders.user_id', userId);

  const { data: wishlistItems } = await supabaseClient
    .from('wishlists')
    .select('product_id, products!inner(category_id)')
    .eq('user_id', userId);

  // Extract preferred categories
  const preferredCategories = new Set();
  [...(orderItems || []), ...(wishlistItems || [])].forEach(item => {
    if (item.products?.category_id) {
      preferredCategories.add(item.products.category_id);
    }
  });

  if (preferredCategories.size === 0) {
    // Fall back to trending products
    return await getTrendingProducts(supabaseClient, limit);
  }

  // Get products from preferred categories
  const { data: products } = await supabaseClient
    .from('products')
    .select(`
      id, name, slug, price, sale_price, images,
      rating_average, rating_count, is_featured,
      profiles!vendor_id (display_name, vendor_status)
    `)
    .in('category_id', Array.from(preferredCategories))
    .eq('is_active', true)
    .order('rating_average', { ascending: false })
    .order('is_featured', { ascending: false })
    .limit(limit);

  return products || [];
}

async function getRecommendedProducts(supabaseClient: any, categoryId?: string, limit: number) {
  let query = supabaseClient
    .from('products')
    .select(`
      id, name, slug, price, sale_price, images,
      rating_average, rating_count, is_featured,
      profiles!vendor_id (display_name, vendor_status)
    `)
    .eq('is_active', true);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data: products } = await query
    .order('is_featured', { ascending: false })
    .order('rating_average', { ascending: false })
    .limit(limit);

  return products || [];
}