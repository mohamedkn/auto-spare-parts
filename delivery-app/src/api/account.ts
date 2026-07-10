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
  } catch (error) {
    console.error('Failed to fetch user stats', error);
    return {
      ordersCount: 0,
      activeOrdersCount: 0,
      wishlistCount: 0,
      walletBalance: 0,
    };
  }
};
