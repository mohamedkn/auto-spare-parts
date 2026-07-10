import apiClient from './client';

export interface Vendor {
  id: string;
  storeName: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  avgRating: number | null;
  reviewsCount: number;
  createdAt: string;
}

interface VendorsResponse {
  data: {
    vendors: Vendor[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface VendorDetailsResponse {
  data: {
    vendor: Vendor;
  };
}

export const fetchVendors = async () => {
  const { data } = await apiClient.get<VendorsResponse>('/vendors');
  return data.data;
};

export const fetchVendorById = async (id: string) => {
  const { data } = await apiClient.get<VendorDetailsResponse>(`/vendors/${id}`);
  return data.data.vendor;
};
