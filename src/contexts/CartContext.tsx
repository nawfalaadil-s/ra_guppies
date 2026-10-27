import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Coupon } from '../lib/types';
import { useStoreSettings } from './StoreSettingsContext';
import { useToast } from './ToastContext';
import { mockDb } from '../lib/mockDatabase';
import { calculateShipping, ShippingCalculation, getStateFromPincode } from '../lib/shipping';
import { fetchSupabaseCoupons } from '../lib/supabaseSync';
import { recordAnalyticsEvent } from '../lib/analyticsService';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  isShippingCalculated: boolean;
  packingCharge: number;
  discountAmount: number;
  appliedCoupon: Coupon | null;
  total: number;
  shippingState: string;
  setShippingState: (state: string) => void;
  shippingPincode: string;
  setShippingPincode: (pincode: string) => void;
  shippingDetails: ShippingCalculation;
  freeShippingRemaining: number;
  freeShippingProgress: number;
  addToCart: (product: Product, quantity?: number, variant?: string) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useStoreSettings();
  const { showToast } = useToast();

  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ba_cart_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [shippingState, setShippingState] = useState<string>(() => {
    const savedPin = localStorage.getItem('ba_shipping_pincode');
    const savedState = localStorage.getItem('ba_shipping_state');
    // If only state was saved as legacy default 'Kerala' without a PIN or address, start blank
    if (!savedPin && savedState === 'Kerala') {
      return '';
    }
    return savedState || '';
  });

  const [shippingPincode, setShippingPincodeState] = useState<string>(() => {
    return localStorage.getItem('ba_shipping_pincode') || '';
  });

  const setShippingPincode = (pin: string) => {
    const clean = pin.replace(/\D/g, '').slice(0, 6);
    setShippingPincodeState(clean);
    if (clean) {
      localStorage.setItem('ba_shipping_pincode', clean);
    } else {
      localStorage.removeItem('ba_shipping_pincode');
    }
    if (clean.length === 6) {
      const info = getStateFromPincode(clean);
      if (info && info.state) {
        setShippingState(info.state);
        localStorage.setItem('ba_shipping_state', info.state);
      }
    }
  };

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('ba_applied_coupon');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    fetchSupabaseCoupons().catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('ba_cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (shippingState) {
      localStorage.setItem('ba_shipping_state', shippingState);
    } else {
      localStorage.removeItem('ba_shipping_state');
    }
  }, [shippingState]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('ba_applied_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('ba_applied_coupon');
    }
  }, [appliedCoupon]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Live fish road courier calculation via The Professional Couriers (auto-calculated from PIN or State)
  const shippingLocation = shippingPincode.length === 6 ? shippingPincode : shippingState;
  const shippingDetails = calculateShipping(
    shippingLocation || undefined, 
    itemCount
  );
  const isShippingCalculated = items.length > 0 && shippingDetails.isCalculated;
  const deliveryFee = isShippingCalculated ? shippingDetails.finalFee : 0;

  // Live fish packing fee is included or nominal
  const packingCharge = 0;

  const freeShippingRemaining = 0;
  const freeShippingProgress = 100;

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.discount_value) / 100);
      if (appliedCoupon.max_discount && discountAmount > appliedCoupon.max_discount) {
        discountAmount = appliedCoupon.max_discount;
      }
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  }

  const total = Math.max(0, subtotal + (isShippingCalculated ? deliveryFee : 0) + packingCharge - discountAmount);

  const addToCart = (product: Product, quantity: number = 1, variant?: string): boolean => {
    // Check if unique specimen and already in cart
    const existingIndex = items.findIndex(item => item.product.id === product.id);

    if (product.is_unique_specimen && existingIndex >= 0) {
      showToast('This rare specimen is 1-of-a-kind and already in your cart!', 'info');
      return false;
    }

    if (existingIndex >= 0) {
      const currentQty = items[existingIndex].quantity;
      if (currentQty + quantity > product.stock_quantity) {
        showToast(`Only ${product.stock_quantity} available in stock!`, 'error');
        return false;
      }
      setItems(prev => {
        const copy = [...prev];
        copy[existingIndex].quantity += quantity;
        return copy;
      });
    } else {
      if (product.stock_quantity < quantity) {
        showToast(`Product is out of stock!`, 'error');
        return false;
      }
      setItems(prev => [...prev, { product, quantity, selected_variant: variant }]);
    }

    showToast(`Added ${product.name} to cart!`, 'success');
    recordAnalyticsEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      category_name: product.category_name,
      price: product.price,
      quantity,
    });
    return true;
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart', 'info');
    recordAnalyticsEvent('remove_from_cart', {
      product_id: productId,
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = items.find(i => i.product.id === productId);
    if (!item) return;

    if (item.product.is_unique_specimen && quantity > 1) {
      showToast('Unique specimens are strictly limited to 1 piece.', 'info');
      return;
    }

    if (quantity > item.product.stock_quantity) {
      showToast(`Cannot exceed available stock of ${item.product.stock_quantity}`, 'error');
      return;
    }

    setItems(prev => 
      prev.map(i => i.product.id === productId ? { ...i, quantity } : i)
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string): boolean => {
    const result = mockDb.validateCoupon(code, subtotal);
    if (result.valid) {
      const coupon = mockDb.getCoupons().find(c => c.code.toUpperCase() === code.trim().toUpperCase());
      if (coupon) {
        setAppliedCoupon(coupon);
        showToast(result.message, 'success');
        return true;
      }
    }
    showToast(result.message, 'error');
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        deliveryFee,
        isShippingCalculated,
        packingCharge,
        discountAmount,
        appliedCoupon,
        total,
        shippingState,
        setShippingState,
        shippingPincode,
        setShippingPincode,
        shippingDetails,
        freeShippingRemaining,
        freeShippingProgress,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
