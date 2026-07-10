import apiClient from './client';

export interface LoginParams {
  email: string;
  password?: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  password?: string;
  phone?: string;
}

export const login = async (params: LoginParams) => {
  const { data } = await apiClient.post('/auth/login', params);
  return data.data; // Since Next.js returns { success: true, data: { user, token } }
};

export const register = async (params: RegisterParams) => {
  const { data } = await apiClient.post('/auth/register', params);
  return data.data;
};
