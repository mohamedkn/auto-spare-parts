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
  brand?: string;
  condition: string;
  createdAt: string;
  vendor?: { id: string; storeName: string; slug: string };
  category?: { id: string; name: string; slug: string };
  images: { url: string }[];
  avgRating?: number;
  reviewsCount?: number;
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

export const fetchProducts = async (params?: any): Promise<ProductsResponse> => {
  const { data } = await apiClient.get('/products', { params });
  return data.data; 
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data;
};
