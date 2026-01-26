/**
 * Django API Client for Next.js
 * 
 * This client provides type-safe methods to interact with the Django backend.
 * Place this file in: src/lib/django-api-client.ts
 */

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

interface ApiError {
  detail?: string;
  [key: string]: any;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  price_with_vat: string;
  stock: number;
  category: Category;
  images: string[];
  is_active: boolean;
  vendor: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  description: string;
  parent?: number;
  image_url?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

class DjangoAPIClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string = DJANGO_API_URL) {
    this.baseURL = baseURL;
    
    // Try to get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || `API Error: ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // ==================== Authentication ====================

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/token/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.access);
    
    if (typeof window !== 'undefined' && response.refresh) {
      localStorage.setItem('refresh_token', response.refresh);
    }
    
    return response;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ access: string }> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<{ access: string }>('/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    this.setToken(response.access);
    return response;
  }

  /**
   * Logout
   */
  logout() {
    this.clearToken();
  }

  // ==================== Products ====================

  /**
   * Get paginated list of products
   */
  async getProducts(params?: {
    page?: number;
    search?: string;
    category?: number;
    ordering?: string;
  }): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<PaginatedResponse<Product>>(
      `/products/${query ? `?${query}` : ''}`
    );
  }

  /**
   * Get single product by ID
   */
  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}/`);
  }

  /**
   * Get single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await this.getProducts({ search: slug });
    const product = response.results.find(p => p.slug === slug);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  }

  /**
   * Create new product (vendors only)
   */
  async createProduct(data: Partial<Product>): Promise<Product> {
    return this.request<Product>('/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update product (owner only)
   */
  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete product (owner only)
   */
  async deleteProduct(id: number): Promise<void> {
    return this.request<void>(`/products/${id}/`, {
      method: 'DELETE',
    });
  }

  // ==================== Categories ====================

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories/');
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    return this.request<Category>(`/categories/${slug}/`);
  }

  // ==================== Ethiopian-Specific ====================

  /**
   * Calculate price with Ethiopian VAT (15%)
   */
  calculatePriceWithVAT(price: number): number {
    return price * 1.15;
  }

  /**
   * Format price in Ethiopian Birr
   */
  formatETB(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${numAmount.toFixed(2)} ብር`;
  }
}

// Export singleton instance
export const djangoAPI = new DjangoAPIClient();

// Export class for custom instances
export default DjangoAPIClient;

// ==================== React Hooks ====================

/**
 * Custom hooks for using Django API in React components
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProducts(params?: Parameters<typeof djangoAPI.getProducts>[0]) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => djangoAPI.getProducts(params),
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => djangoAPI.getProduct(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => djangoAPI.getCategories(),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Product>) => djangoAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) => 
      djangoAPI.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => djangoAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ==================== Usage Examples ====================

/*
// In a Next.js Server Component:
import { djangoAPI } from '@/lib/django-api-client';

export default async function ProductsPage() {
  const { results: products } = await djangoAPI.getProducts();
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h2>{product.name}</h2>
          <p>{djangoAPI.formatETB(product.price_with_vat)}</p>
        </div>
      ))}
    </div>
  );
}

// In a Client Component with React Query:
'use client';
import { useProducts, useCreateProduct } from '@/lib/django-api-client';

export default function ProductsClient() {
  const { data, isLoading, error } = useProducts({ ordering: '-created_at' });
  const createProduct = useCreateProduct();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.results.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
      
      <button onClick={() => createProduct.mutate({
        name: 'New Product',
        price: '100',
        description: 'Description',
      })}>
        Create Product
      </button>
    </div>
  );
}

// Authentication:
import { djangoAPI } from '@/lib/django-api-client';

async function handleLogin(email: string, password: string) {
  try {
    const response = await djangoAPI.login(email, password);
    console.log('Logged in:', response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
}

async function handleLogout() {
  djangoAPI.logout();
}
*/
