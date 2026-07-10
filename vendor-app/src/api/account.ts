import apiClient from './client';

export const fetchUserStats = async () => {
  try {
    const [ordersRes, wishlistRes] = await Promise.all([
      apiClient.get('/orders'),
      apiClient.get('/wishlist')
    ]);
    
    const orders = ordersRes.data?.data || [];
    const wishlist = wishlistRes.data?.data || [];
    
    // Calculate active orders (assuming everything not 'DELIVERED' or 'CANCELLED' is active)
    const activeOrders = orders.filter((o: any) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
    
    return {
      ordersCount: orders.length,
      activeOrdersCount: activeOrders.length,
      wishlistCount: wishlist.length,
      walletBalance: 0, // Mocked for now, until wallet API exists
    };
  } catch (error: any) {
    // Suppress console.error if the error is 403 Forbidden (e.g., Admin user trying to fetch customer stats)
    if (error?.response?.status !== 403) {
      console.warn('Failed to fetch user stats', error?.message || '');
    }
    return {
      ordersCount: 0,
      activeOrdersCount: 0,
      wishlistCount: 0,
      walletBalance: 0,
    };
  }
};
