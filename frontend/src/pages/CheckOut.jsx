import React, { useCallback, useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart, refreshCartPricing } from '../redux/cartSlice';
import { AuthContext } from '../context/Authcontext';
import { optimised, SITE_LOGO } from '../utils/cloudinary';
import '../styles/checkout.css';

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || '';

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep'
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [billing, setBilling] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [razorpayKey, setRazorpayKey] = useState('');
  // True from the moment the Razorpay modal opens until it is dismissed or the
  // payment resolves. Keeps the pay button disabled for the whole modal
  // lifetime instead of only for the API round-trip.
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pricingStale, setPricingStale] = useState(false);

  const isTestMode = (razorpayKey || RAZORPAY_KEY_ID).startsWith('rzp_test');
  const GST_RATE = 0.18;
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.qty, 0);
  const gstAmount = subtotal * GST_RATE;
  const totalAmount = subtotal + gstAmount;

  const payloadItems = () => cartItems.map((item) => ({ productId: item.id, quantity: item.qty }));

  // The cart persists a price snapshot in localStorage and the server always
  // recomputes the total from the database. After any price change the two
  // disagree and the server rejects the order with a 400 that used to leave the
  // customer with no way forward. Re-sync the cart from live product data so
  // the displayed total is the amount that will actually be charged.
  const syncCartPricing = useCallback(async () => {
    if (cartItems.length === 0) return;
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) return;
      dispatch(refreshCartPricing(data));
      setPricingStale(false);
    } catch {
      // Leave the cart as-is; the server remains the authority on the total.
    }
  }, [cartItems.length, dispatch]);

  useEffect(() => {
    let cancelled = false;
    if (cartItems.length === 0) return;
    (async () => {
      if (cancelled) return;
      await syncCartPricing();
    })();
    return () => {
      cancelled = true;
    };
  }, [syncCartPricing, cartItems.length]);

  // A rejected order because the total or availability moved under the customer
  // is recoverable: refresh the cart and tell them what changed, instead of
  // leaving a dead 400 with no forward path.
  const handleOrderError = (err) => {
    const message = err?.message || 'Something went wrong. Please try again.';
    if (/does not match|no longer available|available in your cart|limited stock/i.test(message)) {
      setPricingStale(true);
      setError(
        `${message} Your cart has been updated with the latest prices and availability — please review the new total and try again.`
      );
      syncCartPricing();
      return;
    }
    setError(message);
  };

  const userInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo')) || {};
    } catch {
      return {};
    }
  })();

  const authToken = userInfo.token || '';

  useEffect(() => {
    setBilling((prev) => ({
      ...prev,
      email: prev.email || userInfo.email || '',
      phone: prev.phone || userInfo.phone || ''
    }));
  }, [userInfo.email, userInfo.phone]);

  const refreshUserName = () => {
    const name = [billing.firstName, billing.lastName].filter(Boolean).join(' ').trim();
    if (name && (!userInfo.name || userInfo.name === 'Customer')) {
      login({ ...userInfo, name });
    }
  };

  const handleChange = (e) => {
    setBilling((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'state', 'postalCode'];
    for (const field of required) {
      if (!billing[field].trim()) {
        const label = {
          firstName: 'First name',
          lastName: 'Last name',
          email: 'Email address',
          phone: 'phone number',
          street: 'Street address',
          city: 'City',
          state: 'State',
          postalCode: 'PIN code'
        }[field];
        setError(`Please fill in your ${label}.`);
        return false;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(billing.phone.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return false;
    }
    if (!/^[0-9A-Za-z\s-]{3,20}$/.test(billing.postalCode.trim())) {
      setError('Please enter a valid postal / PIN code.');
      return false;
    }
    return true;
  };

  const createRazorpayOrder = async () => {
    if (!authToken) throw new Error('Please log in to place an order.');
    const res = await fetch('/api/payment/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        items: payloadItems(),
        address: billing,
        orderNotes: orderNotes.trim()
      })
    });
    const data = await res.json();
    if (!res.ok || !data.id) throw new Error(data.message || 'Could not create payment order.');
    return data;
  };

const verifyPayment = async (paymentData) => {
    if (!authToken) throw new Error('Please log in to place an order.');
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(paymentData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Payment verification failed.');
    return data;
  };

  const createOrder = async (paymentId = '', method, razorpayOrderId = '', razorpaySignature = '') => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.qty,
          price: item.price
        })),
        totalAmount,
        address: billing,
        orderNotes: orderNotes.trim(),
        paymentId: paymentId || '',
        paymentMethod: method || paymentMethod,
        razorpayOrderId: paymentId ? razorpayOrderId || '' : '',
        razorpaySignature: paymentId ? razorpaySignature || '' : ''
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Order could not be placed. Please contact support.');
    }
  };

const handlePaymentSuccess = async (paymentResponse) => {
    try {
      setPaymentOpen(false);
      setLoading(false);
      await verifyPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      });

      await createOrder(
        paymentResponse.razorpay_payment_id,
        'razorpay',
        paymentResponse.razorpay_order_id,
        paymentResponse.razorpay_signature
      );

refreshUserName();
      dispatch(clearCart());
      navigate('/', { state: { orderSuccess: 'Your order is placed successfully!' } });
    } catch (err) {
      handleOrderError(err);
    }
  };

  const handlePaymentError = (response) => {
    const description =
      (response && response.error && response.error.description) ||
      'Payment failed. Please try again.';
    setError(`Payment failed: ${description}`);
  };

  const placeCodOrder = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    try {
await createOrder('', 'cod');
      refreshUserName();
      dispatch(clearCart());
      navigate('/', { state: { orderSuccess: 'Your order is placed successfully!' } });
    } catch (err) {
      handleOrderError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === 'cod') {
      placeCodOrder();
    } else {
      startPayment();
    }
  };

  const startPayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setLoading(false);
      setError('Razorpay checkout failed to load. Please try again.');
      return;
    }

// Local (not state) so the `finally` below sees it synchronously — reading
    // `paymentOpen` there would still be the pre-update value on this render.
    let modalOpened = false;
    try {
      const order = await createRazorpayOrder();
      const activeKey = order.key_id || RAZORPAY_KEY_ID;
      if (!activeKey) {
        setError('Payment configuration is missing. Please contact support.');
        return;
      }
      setRazorpayKey(activeKey);

      const options = {
        key: activeKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Bareaya',
        description: `Order of ${cartItems.length} item(s)`,
        order_id: order.id,
        prefill: {
          name: `${billing.firstName} ${billing.lastName}`.trim() || userInfo.name || '',
          email: billing.email.trim() || userInfo.email || '',
          contact: billing.phone.trim() || userInfo.phone || ''
        },
        notes: {
          address: `${billing.street}, ${billing.apartment ? billing.apartment + ', ' : ''}${billing.city}, ${billing.state}, ${billing.postalCode}, ${billing.country}`
        },
        theme: { color: '#1d1d1d' },
handler: handlePaymentSuccess,
        modal: {
          ondismiss: () => {
            // The user closed the gateway without paying: release the button and
            // say so, instead of leaving a silent no-op.
            setPaymentOpen(false);
            setLoading(false);
            setError('Payment was cancelled. Your cart has been saved.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        setPaymentOpen(false);
        setLoading(false);
        handlePaymentError(response);
      });
      setPaymentOpen(true);
      modalOpened = true;
      razorpay.open();
    } catch (err) {
      setError(err.message || 'Could not start payment. Please try again.');
    } finally {
      // Only clear the pre-modal spinner here. Once the modal is open the
      // button must stay disabled until the modal itself resolves, otherwise a
      // second click creates a duplicate Razorpay order.
      if (!modalOpened) setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <h1 data-reveal>Checkout</h1>
        <p data-reveal style={{ '--reveal-delay': '100ms' }}>Your cart is currently empty.</p>
        <Link to="/shop" className="btn" data-reveal style={{ '--reveal-delay': '200ms' }}>Return to Shop</Link>
      </div>
    );
  }

  if (!authToken) {
    return (
      <div className="checkout-empty">
        <h1 data-reveal>Checkout</h1>
        <p data-reveal style={{ '--reveal-delay': '100ms' }}>You need to be logged in to place an order.</p>
        <div className="checkout-auth-actions" data-reveal style={{ '--reveal-delay': '200ms' }}>
          <Link to="/login" className="btn">Login</Link>
          <Link to="/shop" className="btn btn-ghost">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-heading">
        <p className="checkout-eyebrow" data-reveal>Bareaya</p>
        <h1 data-reveal style={{ '--reveal-delay': '90ms' }}>Checkout</h1>
      </header>

      <div className="checkout-layout">
        <section className="checkout-form" aria-label="Billing details" data-reveal style={{ '--reveal-delay': '160ms' }}>
          <h2>Billing details</h2>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="firstName">First name <span className="required">*</span></label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                placeholder="First name"
                value={billing.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="lastName">Last name <span className="required">*</span></label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                placeholder="Last name"
                value={billing.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="country">Country / Region</label>
            <input
              id="country"
              type="text"
              name="country"
              value={billing.country}
              onChange={handleChange}
              readOnly
            />
          </div>

          <div className="form-field">
            <label htmlFor="street">Street address <span className="required">*</span></label>
            <input
              id="street"
              type="text"
              name="street"
              placeholder="House number and street name"
              value={billing.street}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="apartment">Apartment, suite, unit, etc. (optional)</label>
            <input
              id="apartment"
              type="text"
              name="apartment"
              placeholder="Apartment, suite, unit, etc. (optional)"
              value={billing.apartment}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="city">Town / City <span className="required">*</span></label>
            <input
              id="city"
              type="text"
              name="city"
              placeholder="Town / City"
              value={billing.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="state">State <span className="required">*</span></label>
              <select
                id="state"
                name="state"
                value={billing.state}
                onChange={handleChange}
                required
              >
                <option value="">Select a state</option>
                {INDIA_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="postalCode">PIN code <span className="required">*</span></label>
              <input
                id="postalCode"
                type="text"
                name="postalCode"
                placeholder="PIN code"
                inputMode="numeric"
                value={billing.postalCode}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="email">Email address <span className="required">*</span></label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={billing.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone">Phone number <span className="required">*</span></label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              inputMode="numeric"
              maxLength={10}
              value={billing.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="orderNotes">Order notes (optional)</label>
            <textarea
              id="orderNotes"
              name="orderNotes"
              rows="3"
              placeholder="Notes about your order, e.g. special delivery instructions."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            />
          </div>

          {error && <p className="checkout-error" role="alert">{error}</p>}
      {pricingStale && (
        <p className="checkout-notice" role="status">
          Prices and availability have been refreshed from the store. Please review the updated total below before paying.
          <button type="button" className="btn btn-ghost" onClick={syncCartPricing}>Refresh again</button>
        </p>
      )}
        </section>

        <aside className="checkout-summary" aria-label="Your order" data-reveal style={{ '--reveal-delay': '240ms' }}>
          <h2>Your order</h2>

          <div className="order-review">
            <div className="order-review-head">
              <span>Product</span>
              <span>Subtotal</span>
            </div>
            {cartItems.map((item) => (
              <div key={item.id} className="order-review-item">
                <div className="order-review-product">
                  <img
                    src={optimised(item.imageUrl || item.image, 'thumb') || SITE_LOGO}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    width={160}
                    height={160}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = SITE_LOGO; }}
                  />

                  <span>{item.name} <em>× {item.qty}</em></span>
                </div>
                <span className="order-review-price">₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}

            <div className="order-review-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="order-review-row">
              <span>Including taxes</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>
            <div className="order-review-row order-review-total">
              <span>Total (incl. GST)</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="checkout-payment-methods">
            <h3>Payment method</h3>
            <label className="checkout-payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={paymentMethod === 'razorpay'}
                onChange={() => setPaymentMethod('razorpay')}
              />
              <span>Pay Online (Razorpay — UPI, Cards, NetBanking)</span>
            </label>
            {paymentMethod === 'razorpay' && (
              <p className="payment-hint">
                {isTestMode
                  ? 'TEST MODE: Use test UPI "success@razorpay" or test card 4111 1111 1111 1111 (any future expiry, any CVV).'
                  : 'Pay securely via Razorpay. You will be redirected to complete your payment.'}
              </p>
            )}
            <label className="checkout-payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              <span>Cash on Delivery</span>
            </label>
            {paymentMethod === 'cod' && (
              <p className="payment-hint">Pay in cash when your order is delivered. No advance payment required.</p>
            )}
          </div>

          <button type="button" className="btn" onClick={handlePlaceOrder} disabled={loading || paymentOpen}>
            {loading
              ? 'Processing...'
              : paymentMethod === 'cod'
              ? 'Place Order — Cash on Delivery'
              : `Place Order — Pay ₹${totalAmount.toFixed(2)}`}
          </button>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;