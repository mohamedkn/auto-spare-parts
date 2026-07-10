import apiClient from './client';
import * as Crypto from 'expo-crypto';

export interface CheckoutParams {
  paymentMethod: 'paymob' | 'instapay' | 'cash_on_delivery';
  addressId?: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    governorate: string;
  };
  items: any[];
}

import { syncCartToBackend } from './cart';

export const processCheckout = async (params: CheckoutParams) => {
  // 1. Sync local cart to backend first
  await syncCartToBackend(params.items);

  // 2. Generate Idempotency-Key
  const idempotencyKey = Crypto.randomUUID();

  // 3. Process checkout
  const { data } = await apiClient.post('/checkout', {
    paymentMethod: params.paymentMethod,
    shippingAddress: params.shippingAddress,
    addressId: params.addressId,
  }, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    }
  });
  return data.data; // { order, paymentUrl }
};
