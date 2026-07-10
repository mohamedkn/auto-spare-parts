import apiClient from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  children?: Category[];
}

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await apiClient.get('/categories');
  return data.data; // Since response is { success: true, data: [...] }
};
