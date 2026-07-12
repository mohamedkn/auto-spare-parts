import apiClient from './client';

export interface VehicleModel {
  id: string;
  name: string;
}

export interface VehicleMake {
  id: string;
  name: string;
  market: string;
  models: VehicleModel[];
}

export const fetchVehicles = async (): Promise<VehicleMake[]> => {
  const { data } = await apiClient.get('/vehicles');
  return data.data;
};
