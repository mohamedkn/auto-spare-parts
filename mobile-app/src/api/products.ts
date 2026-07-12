import apiClient from './client';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  stockQuantity: number;
  status: string;
  oemNumber?: string;
  partNumber?: string;
  brand?: string;
  placement?: string;
  condition: string;
  createdAt: string;
  vendor?: { id: string; storeName: string; slug: string };
  category?: { id: string; name: string; slug: string };
  images: { url: string }[];
  avgRating?: number;
  reviewsCount?: number;
}

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  vendorId?: string;
  oemNumber?: string;
  brand?: string;
  condition?: 'new_original' | 'new_aftermarket' | 'used' | 'refurbished';
  vehicleMakeId?: string;
  vehicleModelId?: string;
  vehicleMarkets?: string;
  year?: string | number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: 'true' | 'false';
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating_desc';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchProducts = async (params?: ProductQueryParams): Promise<ProductsResponse> => {
  const { data } = await apiClient.get('/products', { params });
  return data.data; 
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data;
};

export const fetchBestSellers = async (limit: number = 10): Promise<{ products: Product[] }> => {
  const { data } = await apiClient.get('/products/best-sellers', { params: { limit } });
  return data.data;
};
