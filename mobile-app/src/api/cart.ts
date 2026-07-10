import apiClient from './client';

export interface AddToCartParams {
  productId: string;
  variantId?: string;
  quantity: number;
}

export type CartSyncItem = AddToCartParams;

let syncQueue: Promise<void> = Promise.resolve();

export const syncCartToBackend = (items: CartSyncItem[]) => {
  const snapshot = items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }));
  syncQueue = syncQueue
    .catch(() => undefined)
    .then(async () => {
      await apiClient.post('/cart/sync', { items: snapshot });
    });
  return syncQueue;
};

export const fetchBackendCart = async () => {
  const { data } = await apiClient.get('/cart');
  return data.data;
};
