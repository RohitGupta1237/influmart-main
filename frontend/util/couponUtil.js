const COUPONS = {
  INFLUMART100: { discount: 0.30, label: "30% off" },
};

export const applyCoupon = (code) => {
  const coupon = COUPONS[code.toUpperCase().trim()];
  if (!coupon) return { valid: false, message: "Invalid coupon code" };
  return { valid: true, ...coupon, message: `Coupon applied! ${coupon.label}` };
};

export const getDiscountedPrice = (originalPrice, discount) => {
  return Math.round(originalPrice * (1 - discount));
};
