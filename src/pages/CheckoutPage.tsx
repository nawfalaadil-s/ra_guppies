import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, QrCode, 
  Upload, CheckCircle2, ArrowRight, 
  Copy, Lock, MessageSquare,
  Smartphone, ExternalLink, X, FileText,
  Truck, AlertCircle, User, UserPlus, LogIn, LogOut, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { useToast } from '../contexts/ToastContext';
import { mockDb } from '../lib/mockDatabase';
import { Address, Order } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { SEO } from '../components/common/SEO';
import { TaxInvoiceModal } from '../components/common/TaxInvoiceModal';
import { INDIAN_STATES, getStateFromPincode, lookupPincode } from '../lib/shipping';
import { syncOrderToSupabase, incrementSupabaseCouponUsage } from '../lib/supabaseSync';
import { generateOrderConfirmationMessage, dispatchWhatsAppHandoff } from '../lib/whatsappService';

export const CheckoutPage: React.FC = () => {
  const { user, addresses, addAddress, register, login, logout } = useAuth();
  const { 
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
    clearCart 
  } = useCart();
  const { settings } = useStoreSettings();
  const { showToast } = useToast();

  // Authentication Gate State (when customer is not logged in)
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Selected address state: automatically select customer's default address or first saved address
  const defaultSaved = addresses.find(a => a.is_default) || addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultSaved ? defaultSaved.id : 'new'
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(!defaultSaved);
  const [saveNewAddress, setSaveNewAddress] = useState<boolean>(true);

  // Loading & error state for shipping calculation
  const [isCalculatingShipping, setIsCalculatingShipping] = useState<boolean>(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [pincodeValidationMessage, setPincodeValidationMessage] = useState<string | null>(null);

  // New address form state
  const [newAddrFullName, setNewAddrFullName] = useState(user?.full_name || '');
  const [newAddrPhone, setNewAddrPhone] = useState(user?.phone || '');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrLandmark, setNewAddrLandmark] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState(shippingState || (defaultSaved ? defaultSaved.state : ''));
  const [newAddrPostalCode, setNewAddrPostalCode] = useState(shippingPincode || (defaultSaved ? defaultSaved.postal_code : ''));

  // Sync new address fields when user signs in or registers
  useEffect(() => {
    if (user) {
      if (!newAddrFullName && user.full_name) setNewAddrFullName(user.full_name);
      if (!newAddrPhone && user.phone) setNewAddrPhone(user.phone);
    }
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'register') {
      if (!authName.trim()) {
        setAuthError('Please enter your full name.');
        return;
      }
      if (!authEmail.trim() || !authEmail.includes('@')) {
        setAuthError('Please enter a valid email address.');
        return;
      }
      const digitsOnly = authPhone.replace(/\D/g, '');
      if (!authPhone.trim() || digitsOnly.length < 10) {
        setAuthError('Please enter a valid 10-digit mobile number for courier notifications.');
        return;
      }
      if (!authPassword || authPassword.length < 6) {
        setAuthError('Password must be at least 6 characters long.');
        return;
      }

      setIsSubmittingAuth(true);
      try {
        const res = await register(
          authName.trim(),
          authEmail.trim().toLowerCase(),
          authPassword,
          authPhone.trim()
        );

        if (res.success && res.user) {
          showToast(`Account created! Welcome to RA Guppy, ${res.user.full_name}.`, 'success');
          setNewAddrFullName(res.user.full_name);
          setNewAddrPhone(res.user.phone || authPhone.trim());
        } else {
          setAuthError(res.message || 'Failed to create account. Please check your details.');
        }
      } catch (err: any) {
        setAuthError(err.message || 'An error occurred during account creation.');
      } finally {
        setIsSubmittingAuth(false);
      }
    } else {
      // Login mode
      if (!authEmail.trim()) {
        setAuthError('Please enter your registered email address.');
        return;
      }
      if (!authPassword) {
        setAuthError('Please enter your password.');
        return;
      }

      setIsSubmittingAuth(true);
      try {
        const res = await login(authEmail.trim().toLowerCase(), authPassword);
        if (res.success && res.user) {
          showToast(`Welcome back, ${res.user.full_name}!`, 'success');
          setNewAddrFullName(res.user.full_name);
          if (res.user.phone) setNewAddrPhone(res.user.phone);
        } else {
          setAuthError(res.message || 'Invalid email or password.');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Login failed. Please check your credentials.');
      } finally {
        setIsSubmittingAuth(false);
      }
    }
  };

  // Auto-sync initial shipping calculation on mount or when addresses load
  useEffect(() => {
    if (addresses.length > 0) {
      const active = addresses.find(a => a.id === selectedAddressId);
      const chosen = active || defaultSaved;
      if (chosen && !isAddingNewAddress) {
        setSelectedAddressId(chosen.id);
        const pin = (chosen.postal_code || '').trim();
        const st = (chosen.state || '').trim();
        if (pin.length === 6) {
          const pinInfo = getStateFromPincode(pin);
          if (pinInfo) {
            setShippingPincode(pin);
            setShippingState(pinInfo.state);
            setShippingError(null);
            setPincodeValidationMessage(null);
            return;
          }
        }
        if (st) {
          setShippingState(st);
          if (pin) setShippingPincode(pin);
          setShippingError(null);
          setPincodeValidationMessage(null);
        }
      }
    }
  }, [addresses]);

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    setIsAddingNewAddress(false);
    const matched = addresses.find(a => a.id === addrId);
    if (matched) {
      setIsCalculatingShipping(true);
      setShippingError(null);
      setPincodeValidationMessage(null);

      const pin = (matched.postal_code || '').trim();
      const st = (matched.state || '').trim();

      setTimeout(() => {
        if (pin.length === 6) {
          const pinInfo = getStateFromPincode(pin);
          if (pinInfo) {
            setShippingPincode(pin);
            setShippingState(pinInfo.state);
            setNewAddrPostalCode(pin);
            setNewAddrState(pinInfo.state);
            setIsCalculatingShipping(false);
            showToast(`Selected: ${matched.city ? matched.city + ', ' : ''}${pinInfo.state} • Courier charge calculated!`, 'info');
            return;
          }
        }

        if (st) {
          setShippingState(st);
          setNewAddrState(st);
          if (pin) {
            setShippingPincode(pin);
            setNewAddrPostalCode(pin);
          }
          setIsCalculatingShipping(false);
          showToast(`Selected: ${matched.city ? matched.city + ', ' : ''}${st} • Courier charge calculated!`, 'info');
          return;
        }

        setShippingError('Selected address is missing a valid Indian postal PIN or state. Please update address.');
        setShippingPincode('');
        setShippingState('');
        setIsCalculatingShipping(false);
      }, 200);
    }
  };

  const handlePincodeInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setNewAddrPostalCode(clean);

    // If customer modifies/clears PIN code, invalidate previous shipping calculation!
    if (clean.length < 6) {
      setShippingPincode('');
      if (clean.startsWith('0')) {
        setPincodeValidationMessage('Indian PIN codes start with digits 1-9.');
        setShippingError('Invalid PIN code: cannot start with 0.');
      } else if (clean.length > 0) {
        setPincodeValidationMessage(`Enter 6 digits (${clean.length}/6 entered)`);
        setShippingError(null);
      } else {
        setPincodeValidationMessage(null);
        setShippingError(null);
      }
      return;
    }

    // 6 digits entered
    setIsCalculatingShipping(true);
    setShippingError(null);
    setPincodeValidationMessage(null);

    const pinInfo = getStateFromPincode(clean);
    if (!pinInfo) {
      setPincodeValidationMessage('Unrecognized Indian PIN code. Please verify.');
      setShippingError('Unrecognized PIN code. Road delivery charge cannot be determined.');
      setShippingPincode('');
      setIsCalculatingShipping(false);
      return;
    }

    setNewAddrState(pinInfo.state);
    setShippingPincode(clean);
    setShippingState(pinInfo.state);
    setPincodeValidationMessage(null);
    setShippingError(null);

    lookupPincode(clean).then(res => {
      if (res && res.city && !newAddrCity) {
        setNewAddrCity(res.city);
      }
    }).finally(() => {
      setIsCalculatingShipping(false);
      showToast(`Auto-detected: ${pinInfo.state} (${pinInfo.region}) • Road Delivery rate updated!`, 'info');
    });
  };

  const handleStateChange = (selectedState: string) => {
    setNewAddrState(selectedState);
    if (!selectedState) {
      setShippingState('');
      setShippingError('Please select a valid delivery state.');
      return;
    }
    setIsCalculatingShipping(true);
    setShippingError(null);
    setTimeout(() => {
      setShippingState(selectedState);
      setIsCalculatingShipping(false);
      showToast(`Delivery state updated to ${selectedState}`, 'info');
    }, 150);
  };

  const handleRetryCalculation = () => {
    if (newAddrPostalCode && newAddrPostalCode.length === 6) {
      handlePincodeInput(newAddrPostalCode);
    } else if (newAddrState) {
      handleStateChange(newAddrState);
    } else {
      showToast('Please enter your 6-digit PIN code or select your state', 'info');
    }
  };

  // Payment method selection & submission
  const paymentMethod = 'upi';
  const [upiReference, setUpiReference] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [hasClickedPayNow, setHasClickedPayNow] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  if (items.length === 0 && !placedOrderNumber) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <SEO title="Checkout" description="Complete your live fish order securely." />
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Items in Cart</h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-4">Please add live fish or aquarium products to proceed with checkout.</p>
        <Link to="/shop" className="px-5 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors">
          Browse Store
        </Link>
      </div>
    );
  }

  // Generate UPI URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(settings.upi_id)}&pn=${encodeURIComponent(settings.upi_payee_name)}&am=${total}&cu=INR&tn=${encodeURIComponent('Ra Guppy Order')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(settings.upi_id);
    showToast(`UPI ID ${settings.upi_id} copied to clipboard!`, 'success');
  };

  const handleOpenUPIApp = () => {
    setHasClickedPayNow(true);
    window.location.href = upiUri;
    showToast('Opening UPI app... Complete the transfer and return here to upload your screenshot!', 'info');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
        showToast('Payment screenshot attached successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please create an account or sign in above before placing your order.', 'error');
      return;
    }

    if (!isShippingCalculated || deliveryFee <= 0 || shippingError) {
      showToast('A valid delivery address is required to calculate shipping before confirming the order.', 'error');
      return;
    }

    let shippingAddress: Address;
    if (isAddingNewAddress || selectedAddressId === 'new') {
      if (!newAddrFullName.trim() || !newAddrPhone.trim() || !newAddrStreet.trim() || !newAddrCity.trim() || !newAddrState.trim() || !newAddrPostalCode.trim()) {
        showToast('Please enter all delivery address fields (Name, Phone, Street, City, State, PIN Code)', 'error');
        return;
      }
      if (newAddrPostalCode.trim().length !== 6) {
        showToast('Please enter a valid 6-digit Indian postal PIN code', 'error');
        return;
      }
      shippingAddress = addAddress({
        full_name: newAddrFullName.trim(),
        phone: newAddrPhone.trim(),
        street_address: newAddrStreet.trim(),
        landmark: newAddrLandmark.trim() || undefined,
        city: newAddrCity.trim(),
        state: newAddrState.trim(),
        postal_code: newAddrPostalCode.trim(),
        is_default: false,
      });
    } else {
      if (!selectedAddressId) {
        showToast('Please select a delivery address or enter a new one', 'error');
        return;
      }
      const existing = addresses.find(a => a.id === selectedAddressId);
      if (!existing) {
        showToast('Please select a valid delivery address or enter a new one', 'error');
        return;
      }
      shippingAddress = existing;
    }

    if (paymentMethod === 'upi') {
      if (!upiReference.trim()) {
        showToast('Please enter your 12-digit UTR or Transaction Reference number', 'error');
        return;
      }

      if (!proofImage) {
        showToast('Please upload a screenshot of your completed UPI payment', 'error');
        return;
      }
    }

    setIsPlacingOrder(true);

    try {
      const newOrder = mockDb.createOrder({
        user_id: user.id,
        customer_name: shippingAddress.full_name || user.full_name,
        customer_email: user.email,
        customer_phone: shippingAddress.phone || user.phone || '',
        shipping_address: shippingAddress,
        items: items.map(item => ({
          id: 'item-' + Math.random().toString(36).substring(2, 9),
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          product_image: item.product.images[0],
          unit_price: item.product.price,
          quantity: item.quantity,
          total_price: item.product.price * item.quantity,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        packing_charge: packingCharge,
        discount_amount: discountAmount,
        coupon_code: appliedCoupon?.code,
        total_amount: total,
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        payment_details: {
          method: paymentMethod,
          upi_reference: upiReference.trim(),
          proof_image_url: proofImage || undefined,
          submitted_at: new Date().toISOString(),
        },
      });

      // Synchronize directly into Supabase cloud PostgreSQL database
      await syncOrderToSupabase(newOrder);

      // Record coupon usage increment in database if coupon applied
      if (appliedCoupon?.code) {
        await incrementSupabaseCouponUsage(appliedCoupon.code);
      }

      // Celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.log(err);
      }

      setPlacedOrderNumber(newOrder.order_number);
      setPlacedOrder(newOrder);
      clearCart();
      showToast('Order placed successfully! Sent to admin payment verification desk.', 'success');
    } catch (err: any) {
      console.error('Order placement error:', err);
      showToast('Order recorded locally; cloud sync is retrying.', 'info');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // SUCCESS SCREEN
  if (placedOrderNumber) {
    return (
      <div className="bg-slate-50 min-h-screen py-12 sm:py-16">
        <SEO title={`Order ${placedOrderNumber} Confirmed`} description="Thank you for your order. Our team will verify your payment and prepare your insulated live fish consignment." />
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block mb-3">
              Order Placed Successfully
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-display mb-2">
              Thank You For Your Order!
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mb-6">
              Order Number: <strong className="text-blue-950 font-mono text-base">{placedOrderNumber}</strong>
            </p>

            {/* Uploaded Screenshot & UTR Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-3 mb-8">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Next Step: Admin Payment Verification</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Your payment submission (UTR: <strong className="font-mono text-blue-950">{upiReference}</strong>) has been routed to our verification desk. Once credited, our team will prepare your insulated live oxygen crate.
              </p>

              {proofImage && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 mt-2">
                  <img
                    src={proofImage}
                    alt="Payment Proof"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-blue-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Payment Screenshot Attached</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      Ref: {upiReference}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/account/orders"
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <span>View Order & Tracking</span>
                <ArrowRight className="w-4 h-4 text-red-400" />
              </Link>

              {placedOrder && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = generateOrderConfirmationMessage(placedOrder);
                      dispatchWhatsAppHandoff(placedOrder.shipping_address.phone, msg, {
                        recipient: placedOrder.shipping_address.phone,
                        eventType: 'order_confirmed',
                        orderId: placedOrder.id,
                        metadata: { order_number: placedOrder.order_number }
                      });
                    }}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Order Update</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsInvoiceOpen(true)}
                    className="px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>View Tax Invoice</span>
                  </button>
                </>
              )}

              <Link
                to="/"
                className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Continue Browsing
              </Link>
            </div>
          </div>
        </div>

        {/* Tax Invoice Modal */}
        <TaxInvoiceModal
          isOpen={isInvoiceOpen}
          order={placedOrder}
          onClose={() => setIsInvoiceOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-6 sm:py-10">
      <SEO 
        title="Secure Checkout & Payment" 
        description="Finalize your live fish order. Safe insulated packaging, verified manual UPI payment, and live arrival guarantee." 
      />
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Safe & Insulated Checkout</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-display">
              Finalize Your Consignment
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Encrypted Order Processing</span>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Steps Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Customer Account Gate */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                    <span className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold ${user ? 'bg-blue-950' : 'bg-blue-600'}`}>
                      {user ? <Check className="w-3.5 h-3.5" /> : '1'}
                    </span>
                    <span>{user ? 'Customer Account' : 'Account Required to Place Order'}</span>
                  </div>
                  {user ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Verified Customer</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Create Account or Sign In</span>
                    </span>
                  )}
                </div>

                {user ? (
                  <div className="space-y-2 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-bold flex items-center justify-center shrink-0">
                          {user.full_name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{user.full_name}</div>
                          <div className="text-slate-500 font-mono text-[11px]">
                            {user.email} {user.phone ? `• ${user.phone}` : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => logout()}
                        className="text-xs text-slate-500 hover:text-red-600 font-semibold self-start sm:self-center transition-colors flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Switch</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Consignment tracking updates and road courier dispatch notices will be sent to <strong>{user.email}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      To safeguard live specimen shipments and ensure you receive your Professional Couriers tracking AWB, please create an account or sign in before proceeding.
                    </p>

                    {/* Tabs: Create Account vs Sign In */}
                    <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setAuthError(null); }}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          authMode === 'register'
                            ? 'bg-white text-blue-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <UserPlus className="w-4 h-4 text-blue-600" />
                        <span>Create New Account</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setAuthError(null); }}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          authMode === 'login'
                            ? 'bg-white text-blue-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <LogIn className="w-4 h-4 text-blue-600" />
                        <span>Sign In</span>
                      </button>
                    </div>

                    {authError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {authMode === 'register' ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                              <input
                                type="text"
                                value={authName}
                                onChange={(e) => setAuthName(e.target.value)}
                                placeholder="Enter full name"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (For Courier) *</label>
                              <input
                                type="tel"
                                value={authPhone}
                                onChange={(e) => setAuthPhone(e.target.value)}
                                placeholder="10-digit mobile number"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                              <input
                                type="email"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Choose Password *</label>
                              <input
                                type="password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAuthSubmit}
                            disabled={isSubmittingAuth}
                            className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
                          >
                            {isSubmittingAuth ? (
                              <span>Creating Account...</span>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 text-red-400" />
                                <span>Create Account & Continue to Delivery</span>
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                              <input
                                type="email"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Password *</label>
                              <input
                                type="password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAuthSubmit}
                            disabled={isSubmittingAuth}
                            className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
                          >
                            {isSubmittingAuth ? (
                              <span>Signing In...</span>
                            ) : (
                              <>
                                <LogIn className="w-4 h-4 text-red-400" />
                                <span>Sign In & Continue to Delivery</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Shipping Address */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                    <span className="w-6 h-6 rounded-full bg-blue-950 text-white text-xs flex items-center justify-center font-bold">2</span>
                    <span>Delivery Address</span>
                  </div>
                  {user && addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isAddingNewAddress;
                        setIsAddingNewAddress(next);
                        if (next) {
                          setSelectedAddressId('new');
                          if (newAddrPostalCode && newAddrPostalCode.length === 6) {
                            handlePincodeInput(newAddrPostalCode);
                          } else if (newAddrState) {
                            handleStateChange(newAddrState);
                          } else {
                            setShippingPincode('');
                            setShippingState('');
                          }
                        } else {
                          const active = addresses.find(a => a.id === selectedAddressId) || defaultSaved;
                          if (active) {
                            handleSelectSavedAddress(active.id);
                          }
                        }
                      }}
                      className="text-xs text-blue-700 hover:underline font-semibold"
                    >
                      {isAddingNewAddress ? 'Choose Saved Address' : '+ Add New Address'}
                    </button>
                  )}
                </div>

                {!user ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                      <Lock className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700 block text-xs">Delivery Address Locked</span>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Please create an account or sign in in Step 1 above. Your delivery address and road courier rates will unlock immediately.
                    </p>
                  </div>
                ) : !isAddingNewAddress && addresses.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 mb-2">Select your delivery destination for this consignment:</p>
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => handleSelectSavedAddress(addr.id)}
                          className="mt-1 accent-blue-600"
                        />
                        <div className="text-xs flex-1">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{addr.full_name}</span>
                            <span className="text-slate-500 font-normal">({addr.phone})</span>
                          </div>
                          <div className="text-slate-600 mt-1 leading-relaxed">
                            {addr.street_address}, {addr.landmark && `${addr.landmark}, `}{addr.city}, {addr.state} - <strong>{addr.postal_code}</strong>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <p className="text-xs text-slate-500 mb-1">Enter your delivery address for live oxygen-insulated consignment (Delivery across India only):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={newAddrFullName}
                          onChange={(e) => setNewAddrFullName(e.target.value)}
                          placeholder="Recipient's full name"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (For Courier) *</label>
                        <input
                          type="tel"
                          required
                          value={newAddrPhone}
                          onChange={(e) => setNewAddrPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Door / Flat / Street Address *</label>
                      <input
                        type="text"
                        required
                        value={newAddrStreet}
                        onChange={(e) => setNewAddrStreet(e.target.value)}
                        placeholder="Flat / House No., Building Name, Street"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nearby Landmark (Optional)</label>
                      <input
                        type="text"
                        value={newAddrLandmark}
                        onChange={(e) => setNewAddrLandmark(e.target.value)}
                        placeholder="Nearby landmark (optional)"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-slate-700">PIN Code *</label>
                          <span className="text-[10px] text-blue-900 font-bold">Auto-detects State</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={newAddrPostalCode}
                          onChange={(e) => handlePincodeInput(e.target.value)}
                          placeholder="e.g. 682001, 560001"
                          className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:bg-white transition-colors ${
                            pincodeValidationMessage ? 'border-amber-400 focus:border-amber-500' : 'border-slate-300 focus:border-blue-600'
                          }`}
                        />
                        {pincodeValidationMessage && (
                          <div className="text-[10px] font-medium text-amber-700 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{pincodeValidationMessage}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">City / District *</label>
                        <input
                          type="text"
                          required
                          value={newAddrCity}
                          onChange={(e) => setNewAddrCity(e.target.value)}
                          placeholder="City / District"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Delivery State (India Only) *</label>
                        <select
                          required
                          value={newAddrState}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                        >
                          <option value="">Select Delivery State</option>
                          <option value="Kerala">Kerala</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Karnataka">Karnataka</option>
                          <optgroup label="All Other Indian States">
                            {INDIAN_STATES.filter(s => s !== 'Kerala' && s !== 'Tamil Nadu' && s !== 'Karnataka').map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {user && (
                      <label className="flex items-center gap-2 pt-1 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveNewAddress}
                          onChange={(e) => setSaveNewAddress(e.target.checked)}
                          className="accent-blue-600 rounded"
                        />
                        <span className="text-[11px] font-medium">Save this address to my account for future orders</span>
                      </label>
                    )}
                  </div>
                )}

                {/* Delivery Calculation Rate Card */}
                {isCalculatingShipping ? (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3 text-xs mt-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 animate-pulse">
                      <Truck className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-blue-950 block">Calculating Road Delivery Rate...</span>
                      <span className="text-[11px] text-slate-500">Checking delivery zoning via The Professional Couriers</span>
                    </div>
                    <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin shrink-0" />
                  </div>
                ) : shippingError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs mt-4">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      <div>
                        <span className="font-bold text-red-900 block">{shippingError}</span>
                        <span className="text-[11px] text-red-700">Please enter a valid 6-digit PIN code or select your state.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetryCalculation}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                ) : !isShippingCalculated ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                        <Truck className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">The Professional Couriers • Express Road Transport</span>
                        <span className="text-[11px] text-slate-500">
                          Shipping will be calculated after entering your delivery address.
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      Pending Address
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/70 border border-blue-200/90 rounded-2xl flex items-center justify-between text-xs mt-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Truck className="w-4.5 h-4.5 text-blue-100" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-950">
                            The Professional Couriers • Express Road Transport
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                            Auto Calculated
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          Destination: <strong className="text-slate-900">{shippingDetails.state}</strong>
                          {shippingPincode ? ` (PIN: ${shippingPincode})` : ''} • {shippingDetails.estimatedDays} • 100% Live Arrival Guarantee
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <span className="font-mono font-black text-base text-blue-950 block">
                        {deliveryFee === 0 ? '₹0' : formatCurrency(deliveryFee)}
                      </span>
                      {shippingDetails.isBulkOrder ? (
                        <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider block">
                          2X Bulk Rate ({itemCount} pairs)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium block">
                          {shippingDetails.rateDescription}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

                {/* Step 3: Manual Payment Verification Instructions */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                    <span className="w-6 h-6 rounded-full bg-blue-950 text-white text-xs flex items-center justify-center font-bold">3</span>
                    <span>Manual Payment Verification</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Zero Gateway Fees
                  </span>
                </div>

                {!user ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                      <Lock className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700 block text-xs">Payment Verification Locked</span>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Please create an account or sign in in Step 1 above to access UPI payment QR and upload verification proof.
                    </p>
                  </div>
                ) : (
                  <>
                {/* Payment Method Badge */}
                <div className="flex items-center gap-2 p-3 bg-blue-50/70 rounded-2xl border border-blue-200 text-xs font-bold text-blue-950 mb-6">
                  <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Instant UPI / QR Code Payment</span>
                </div>

                {/* Payment Details Container */}
                <div className="space-y-4 mb-6">
                    {/* Step A: Direct Pay with UPI App */}
                    <div className="p-4 sm:p-5 bg-blue-50/60 rounded-2xl border border-blue-200 text-xs space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                          <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Step 1: Open UPI App & Pay</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 self-start sm:self-auto">
                          Exact Amount: {formatCurrency(total)}
                        </span>
                      </div>

                      <p className="text-slate-600 leading-relaxed text-xs">
                        Tap the button below to directly launch your UPI app (Google Pay, PhonePe, Paytm, or BHIM) with amount <strong>{formatCurrency(total)}</strong> and verified payee <strong>{settings.upi_payee_name}</strong> pre-filled.
                      </p>

                      {/* Primary Direct UPI Button */}
                      <div>
                        <button
                          type="button"
                          onClick={handleOpenUPIApp}
                          className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-98"
                        >
                          <Smartphone className="w-5 h-5 text-red-100" />
                          <span>Pay Now via UPI App ({formatCurrency(total)})</span>
                          <ExternalLink className="w-4 h-4 text-red-100" />
                        </button>
                      </div>

                      {/* Direct App Launch Shortcuts */}
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
                        <span className="text-slate-400 font-medium">Or choose specific app:</span>
                        <a
                          href={upiUri}
                          onClick={() => setHasClickedPayNow(true)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>Google Pay</span>
                        </a>
                        <a
                          href={upiUri}
                          onClick={() => setHasClickedPayNow(true)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>PhonePe</span>
                        </a>
                        <a
                          href={upiUri}
                          onClick={() => setHasClickedPayNow(true)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>Paytm / BHIM</span>
                        </a>
                      </div>

                      {/* UPI ID copy pill */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-blue-200 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">UPI ID:</span>
                          <span className="font-mono font-bold text-blue-950">{settings.upi_id}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUPI}
                          className="text-blue-700 hover:text-blue-800 font-bold inline-flex items-center gap-1 p-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>

                      {/* Desktop QR Code Toggle */}
                      <div className="pt-2 border-t border-blue-200/60">
                        <button
                          type="button"
                          onClick={() => setShowQRCode(!showQRCode)}
                          className="text-[11px] text-blue-800 font-semibold hover:underline flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{showQRCode ? 'Hide Desktop QR Code' : 'Paying from PC / Another Phone? Show QR Code'}</span>
                        </button>

                        {showQRCode && (
                          <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-center w-fit mx-auto shadow-sm">
                            <img src={qrCodeUrl} alt="UPI QR Code" className="w-32 h-32 mx-auto rounded-lg" />
                            <span className="block text-[10px] text-slate-400 mt-1 font-mono">Scan with any UPI App</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step B: Mandatory Confirmation & Proof Submission */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                        <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                          <span className="w-6 h-6 rounded-full bg-blue-950 text-white text-xs flex items-center justify-center font-bold">2</span>
                          <span>Submit UTR & Payment Screenshot</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          Mandatory
                        </span>
                      </div>

                      {hasClickedPayNow && (
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>UPI app triggered! Complete your transfer, then upload your screenshot and enter the 12-digit UTR below.</span>
                        </div>
                      )}

                      {/* 12-Digit UTR */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          12-Digit Transaction Reference (UTR Number) *
                        </label>
                        <input
                          type="text"
                          required
                          value={upiReference}
                          onChange={(e) => setUpiReference(e.target.value)}
                          placeholder="e.g. 407519823412 (Found in receipt)"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-blue-500"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Found in your Google Pay, PhonePe, or Paytm receipt (labeled 'UPI transaction ID' or 'UTR').
                        </span>
                      </div>

                      {/* Upload Payment Screenshot (Mandatory) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Payment Screenshot Proof *
                        </label>

                        {proofImage ? (
                          <div className="p-3 bg-white rounded-2xl border border-blue-200 space-y-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={proofImage}
                                alt="Uploaded Screenshot"
                                className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
                              />
                              <div className="text-xs space-y-0.5 flex-1">
                                <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                  <span>Screenshot Attached</span>
                                </div>
                                <div className="text-[11px] text-slate-500">Ready for instant admin verification</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setProofImage(null)}
                                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                title="Remove Screenshot"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-white rounded-2xl text-xs transition-all text-center">
                              <Upload className="w-6 h-6 text-blue-600 mb-1.5" />
                              <span className="font-bold text-slate-700">Tap to Upload Payment Screenshot</span>
                              <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG or WebP from your device</span>
                              <input
                                type="file"
                                required
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Please attach a clear screenshot showing the successful payment confirmation screen and transfer amount.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
                )}
              </div>
            </div>

            {/* Right Summary Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
                  Consignment Items ({items.length})
                </h2>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.product.id} className="pt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-800 line-clamp-1">{item.product.name}</div>
                          <div className="text-[10px] text-slate-400">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>

                  {packingCharge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Medical Oxygen Packing</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(packingCharge)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800 block">The Professional Couriers</span>
                      <span className="text-[11px] text-slate-500">
                        {isShippingCalculated 
                          ? `Road Courier (${shippingDetails.state}) ${shippingDetails.isBulkOrder ? '• 2X Bulk Rate applied' : ''}`
                          : 'Express Road Transport'}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 font-mono">
                      {isCalculatingShipping ? (
                        <span className="text-slate-400 font-normal italic">Calculating...</span>
                      ) : isShippingCalculated ? (
                        formatCurrency(deliveryFee)
                      ) : (
                        <span className="text-slate-500 font-normal italic">Calculated at checkout</span>
                      )}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-slate-900">Total Payable</span>
                    <span className="font-extrabold text-2xl text-blue-950 font-display">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!user || isPlacingOrder || isCalculatingShipping || !isShippingCalculated || !!shippingError}
                  className="w-full py-4 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-xs active:scale-98 flex items-center justify-center gap-2 mt-4"
                >
                  {!user ? (
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span>Create Account in Step 1 to Proceed</span>
                    </span>
                  ) : isPlacingOrder ? (
                    <span>Confirming Order...</span>
                  ) : isCalculatingShipping ? (
                    <span>Calculating Courier Charge...</span>
                  ) : !isShippingCalculated ? (
                    <span>Enter Delivery Address to Proceed</span>
                  ) : (
                    <>
                      <span>Submit Payment Proof & Confirm Order</span>
                      <ArrowRight className="w-4 h-4 text-red-400" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400 font-medium">
                  Payment screenshot & 12-digit UPI UTR reference required for order approval
                </p>

                <div className="p-4 bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1.5 rounded-2xl">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Why Manual Verification?</span>
                  </div>
                  <p className="text-blue-800 text-[11px] leading-relaxed">
                    Every ornamental fish in your order is a living 1-of-1 specimen. Our head breeder personally inspects fin integrity and health before approving dispatch via The Professional Couriers road transport.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-800">Need help with payment?</div>
                    <div className="text-[11px] text-slate-500">Chat directly with {settings.upi_payee_name || 'support'} on WhatsApp</div>
                  </div>
                  <a
                    href={`https://wa.me/${(settings.whatsapp_number || settings.contact_phone || '918921190590').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I am at checkout on ${settings.brand_name || 'RA Guppy'} and need assistance with payment.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
