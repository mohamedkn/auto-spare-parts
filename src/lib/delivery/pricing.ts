export const DELIVERY_FEE_EGP = 30;
export const DRIVER_EARNING_EGP = 20;
export const DELIVERY_PLATFORM_COMMISSION_EGP = 10;

if (DRIVER_EARNING_EGP + DELIVERY_PLATFORM_COMMISSION_EGP !== DELIVERY_FEE_EGP) {
  throw new Error("Delivery fee allocation is inconsistent");
}
