import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart, removeFromCart, refreshCartPricing } from '../redux/cartSlice';
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

// Flipkart-style checkout stages shown in the numbered stepper.
const CHECKOUT_STEPS = [
  { id: 1, label: 'Delivery Address' },
  { id: 2, label: 'Order Summary' },
  { id: 3, label: 'Payment' }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Every visible stage of order placement, in order, with the message shown in
// the Amazon-style progress overlay. Each stage holds the screen for at least
// STAGE_MIN_MS so fast API responses still read as a deliberate sequence
// instead of a single flash.
const STAGE_MIN_MS = 600;
const ORDER_STAGES = {
  cod: [
    { key: 'validate', label: 'Validating your delivery address' },
    { key: 'place', label: 'Placing your order' },
    { key: 'confirm', label: 'Confirming your order' }
  ],
  razorpay: [
    { key: 'validate', label: 'Validating your delivery address' },
    { key: 'create', label: 'Creating secure payment order' },
    { key: 'pay', label: 'Complete payment in the secure window' },
    { key: 'verify', label: 'Verifying your payment' },
    { key: 'confirm', label: 'Confirming your order' }
  ]
};

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

// A 401 from any order/payment endpoint means the stored login token is dead
// (expired, or the server's JWT secret changed). Kept distinct from ordinary
// errors so checkout can bounce the customer to the login screen — with the
// cart intact — instead of dead-ending on the raw "token failed" message.
class SessionExpiredError extends Error {
  constructor(message = 'Your session has expired. Please log in again to continue your order.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

// Best-effort LOCAL expiry check so a stale session is caught BEFORE the
// Razorpay modal opens. Returns null when the token can't be parsed — the
// server remains the authority in every case.
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return null;
  }
};

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { login, logout } = useContext(AuthContext);

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
  // Wizard position: 1 = delivery address, 2 = order summary, 3 = payment.
  const [step, setStep] = useState(1);
  // Amazon-style order progress overlay: null while idle, otherwise the payment
  // method whose stages are running. `stageIndex` points at the active stage
  // and `orderSuccess` swaps the card to the green confirmation state.
  const [orderFlow, setOrderFlow] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  // True once Razorpay's handler has fired, so a modal `ondismiss` arriving
  // after a SUCCESSFUL payment cannot overwrite the success flow with a
  // "payment was cancelled" error.
  const paidRef = useRef(false);

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

  // The progress overlay owns the screen: freeze the page behind it exactly
  // like Amazon does, and hand scrolling back on dismiss/success/unmount.
  useEffect(() => {
    if (!orderFlow) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [orderFlow]);

  // A rejected order because the total or availability moved under the customer
  // is recoverable: refresh the cart and tell them what changed, instead of
  // leaving a dead 400 with no forward path.
  const handleOrderError = (err) => {
    // Dead/expired login token. Clear the stale session and send the customer
    // to login — the cart survives (localStorage), so after OTP they can come
    // straight back and complete the order.
    if (err?.name === 'SessionExpiredError') {
      logout();
      navigate('/login', { state: { from: '/checkout', message: err.message } });
      return;
    }
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

  // Runs one overlay stage: shows it as active, waits for the task, then pads
  // the stage out to STAGE_MIN_MS so each step is actually perceivable. Errors
  // get only a short beat before re-throwing — the customer should reach the
  // failure message fast, without the overlay feeling like it hung.
  const runStage = async (index, task) => {
    setStageIndex(index);
    const started = Date.now();
    try {
      const result = await task();
      const elapsed = Date.now() - started;
      if (elapsed < STAGE_MIN_MS) await sleep(STAGE_MIN_MS - elapsed);
      return result;
    } catch (err) {
      const elapsed = Date.now() - started;
      if (elapsed < 350) await sleep(350 - elapsed);
      throw err;
    }
  };

  // Shared tail of BOTH payment paths: land on the final stage, show the green
  // success state long enough to read, then hand over to the order tracking
  // page where the customer sees the full order.
  const finishOrder = async (method, order) => {
    setStageIndex(ORDER_STAGES[method].length - 1);
    setPlacedOrderId(order?._id || '');
    await sleep(550);
    refreshUserName();
    dispatch(clearCart());
    setOrderSuccess(true);
    await sleep(1700);
    if (order?._id) {
      navigate(`/orders/${order._id}`, { state: { justPlaced: true } });
    } else {
      // Defensive fallback: never strand the customer on an overlay if the
      // server response did not carry the id.
      navigate('/', { state: { orderSuccess: 'Your order is placed successfully!' } });
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

  // Forward jumps re-validate the address, so payment is unreachable with an
  // incomplete address; backward jumps are always free.
  const advanceTo = (nextStep) => {
    if (nextStep <= step) {
      setError('');
      setStep(nextStep);
      return;
    }
    if (!validateForm()) return;
    setError('');
    setStep(nextStep);
  };

  const handleRemoveItem = (id) => dispatch(removeFromCart(id));

  const addressCard = (
    <div className="checkout-address-card">
      <div className="checkout-address-head">
        <span>Deliver to</span>
        <button type="button" className="checkout-link-btn" onClick={() => setStep(1)}>Change</button>
      </div>
      <p>
        <strong>{[billing.firstName, billing.lastName].filter(Boolean).join(' ')}</strong>
        {' — '}{billing.phone}
        <br />
        {[billing.street, billing.apartment, billing.city, billing.state, billing.postalCode, billing.country]
          .filter(Boolean).join(', ')}
      </p>
    </div>
  );

  // Notices live above the panels so validation, stale-price and payment errors
  // stay visible no matter which step the customer is on.
  const panelNotices = (
    <>
      {error && <p className="checkout-error" role="alert">{error}</p>}
      {pricingStale && (
        <p className="checkout-notice" role="status">
          Prices and availability have been refreshed from the store. Please review the updated total before paying.
          <button type="button" className="btn btn-ghost" onClick={syncCartPricing}>Refresh again</button>
        </p>
      )}
    </>
  );

  // Amazon-style progress overlay. Rendered by EVERY return path (including
  // the empty-cart one) because the success flow clears the cart while the
  // confirmation card is still on screen.
  const stages = orderFlow ? ORDER_STAGES[orderFlow] : [];
  const orderOverlay = orderFlow ? (
    <div className="order-overlay" role="status" aria-live="polite">
      <div className="order-overlay-card">
        {!orderSuccess ? (
          <>
            <p className="order-overlay-eyebrow">Bareaya</p>
            <h2 className="order-overlay-title">
              {orderFlow === 'cod' ? 'Placing your order…' : 'Processing your payment…'}
            </h2>

            <div
              className="order-progress"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={stages.length}
              aria-valuenow={Math.min(stageIndex + 1, stages.length)}
            >
              <span
                className="order-progress-fill"
                style={{ width: `${Math.round(((Math.min(stageIndex, stages.length - 1) + 1) / stages.length) * 100)}%` }}
              />
            </div>

            <ol className="order-stages">
              {stages.map((s, i) => {
                const state = i < stageIndex ? 'is-done' : i === stageIndex ? 'is-active' : '';
                return (
                  <li key={s.key} className={`order-stage ${state}`}>
                    <span className="order-stage-icon" aria-hidden="true">
                      {i < stageIndex ? '✓' : ''}
                    </span>
                    <span className="order-stage-label">{s.label}</span>
                  </li>
                );
              })}
            </ol>

            <p className="order-overlay-note">
              Please don't close this window or refresh the page.
            </p>
          </>
        ) : (
          <div className="order-success">
            <span className="order-success-check" aria-hidden="true">✓</span>
            <h2>Order placed successfully!</h2>
            {placedOrderId && (
              <p className="order-success-id">Order #{placedOrderId.slice(-8).toUpperCase()}</p>
            )}
            <p className="order-success-note">Taking you to your order details…</p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // Every order/payment call answers 401 when the token is dead. Translate that
  // into SessionExpiredError so handleOrderError can route the customer to
  // login instead of showing the raw server string.
  const requireAuth = () => {
    if (!authToken) throw new SessionExpiredError('Please log in to place an order.');
    if (isTokenExpired(authToken)) {
      throw new SessionExpiredError('Your session has expired. Please log in again to continue your order.');
    }
  };

  const createRazorpayOrder = async () => {
    requireAuth();
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
    if (res.status === 401) throw new SessionExpiredError();
    const data = await res.json();
    if (!res.ok || !data.id) throw new Error(data.message || 'Could not create payment order.');
    return data;
  };

const verifyPayment = async (paymentData) => {
    requireAuth();
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(paymentData)
    });
    if (res.status === 401) throw new SessionExpiredError();
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Payment verification failed.');
    return data;
  };

  const createOrder = async (paymentId = '', method, razorpayOrderId = '', razorpaySignature = '') => {
    requireAuth();
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
    if (res.status === 401) throw new SessionExpiredError();
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Order could not be placed. Please contact support.');
    }
    // The full saved order (with its id) — the tracking page is the next stop.
    return data;
  };

const handlePaymentSuccess = async (paymentResponse) => {
    paidRef.current = true;
    setPaymentOpen(false);
    setLoading(true);
    try {
      await runStage(3, () => verifyPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      }));

      const order = await runStage(4, () => createOrder(
        paymentResponse.razorpay_payment_id,
        'razorpay',
        paymentResponse.razorpay_order_id,
        paymentResponse.razorpay_signature
      ));

      await finishOrder('razorpay', order);
    } catch (err) {
      setOrderFlow(null);
      setLoading(false);
      handleOrderError(err);
    }
  };

  const handlePaymentError = (response) => {
    const description =
      (response && response.error && response.error.description) ||
      'Payment failed. Please try again.';
    setOrderFlow(null);
    setError(`Payment failed: ${description}`);
  };

  const placeCodOrder = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    paidRef.current = false;
    setOrderFlow('cod');
    setStageIndex(0);
    try {
      // Stage 0: a short validating beat so the customer sees the sequence
      // start (validation itself already passed above).
      await runStage(0, () => sleep(350));
      const order = await runStage(1, () => createOrder('', 'cod'));
      await finishOrder('cod', order);
    } catch (err) {
      setOrderFlow(null);
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
    paidRef.current = false;
    setOrderFlow('razorpay');
    setStageIndex(0);

// Local (not state) so the `finally` below sees it synchronously — reading
    // `paymentOpen` there would still be the pre-update value on this render.
    let modalOpened = false;
    try {
      // Stage 0: a short validating beat so the sequence visibly starts.
      await runStage(0, () => sleep(350));

      // Stage 1: load Razorpay's script and create the secure order on our
      // server — one customer-visible stage, two underlying calls.
      const order = await runStage(1, async () => {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) throw new Error('Razorpay checkout failed to load. Please try again.');
        return createRazorpayOrder();
      });

      const activeKey = order.key_id || RAZORPAY_KEY_ID;
      if (!activeKey) {
        throw new Error('Payment configuration is missing. Please contact support.');
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
            // Some Razorpay builds also fire ondismiss AFTER a successful
            // payment — never let that late callback cover the success flow
            // with a cancellation message.
            if (paidRef.current) return;
            // The user closed the gateway without paying: release the button and
            // say so, instead of leaving a silent no-op.
            setPaymentOpen(false);
            setLoading(false);
            setOrderFlow(null);
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
      // Stage 2: hand the screen to Razorpay's secure window. Stages 3-4
      // (verify + confirm) run when the handler reports back.
      setStageIndex(2);
      setPaymentOpen(true);
      modalOpened = true;
      razorpay.open();
    } catch (err) {
      setOrderFlow(null);
      if (err?.name === 'SessionExpiredError') {
        handleOrderError(err);
        return;
      }
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
      <>
        {orderOverlay}
        <div className="checkout-empty">
          <h1 data-reveal>Checkout</h1>
          <p data-reveal style={{ '--reveal-delay': '100ms' }}>Your cart is currently empty.</p>
          <Link to="/shop" className="btn" data-reveal style={{ '--reveal-delay': '200ms' }}>Return to Shop</Link>
        </div>
      </>
    );
  }

  // An expired token is as good as no token: the server will reject every
  // order call. Catch it HERE so the customer is sent to login before filling
  // the whole billing form, not after.
  const tokenExpired = authToken && isTokenExpired(authToken);

  if (!authToken || tokenExpired) {
    return (
      <div className="checkout-empty">
        <h1 data-reveal>Checkout</h1>
        <p data-reveal style={{ '--reveal-delay': '100ms' }}>
          {tokenExpired
            ? 'Your session has expired. Please log in again — your cart is saved.'
            : 'You need to be logged in to place an order.'}
        </p>
        <div className="checkout-auth-actions" data-reveal style={{ '--reveal-delay': '200ms' }}>
          <Link
            to="/login"
            state={tokenExpired ? { from: '/checkout', message: 'Your session has expired. Please log in again to continue your order.' } : undefined}
            className="btn"
          >Login</Link>
          <Link to="/shop" className="btn btn-ghost">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {orderOverlay}
      <header className="checkout-heading">
        <p className="checkout-eyebrow" data-reveal>Bareaya</p>
        <h1 data-reveal style={{ '--reveal-delay': '90ms' }}>Checkout</h1>
      </header>

      <nav className="checkout-steps" aria-label="Checkout progress" data-reveal style={{ '--reveal-delay': '60ms' }}>
        {CHECKOUT_STEPS.map((s, index) => {
          const done = step > s.id;
          return (
            <React.Fragment key={s.id}>
              {index > 0 && (
                <span className={`checkout-step-link${step > s.id - 1 ? ' is-done' : ''}`} aria-hidden="true" />
              )}
              <button
                type="button"
                className={`checkout-step${step === s.id ? ' is-active' : ''}${done ? ' is-done' : ''}`}
                aria-current={step === s.id ? 'step' : undefined}
                onClick={() => advanceTo(s.id)}
              >
                <span className="checkout-step-num" aria-hidden="true">{done ? '✓' : s.id}</span>
                <span className="checkout-step-label">{s.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {panelNotices}

      <div className="checkout-layout">
        {/* ---- Step 1: delivery address ---- */}
        {step === 1 && (
        <section className="checkout-panel" aria-label="Delivery address">
          <h2>Delivery Address</h2>

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

          <div className="checkout-step-actions">
            <button type="button" className="btn" onClick={() => advanceTo(2)}>Continue to Order Summary</button>
          </div>
        </section>
        )}

        {/* ---- Step 2: order summary ---- */}
        {step === 2 && (
        <section className="checkout-panel" aria-label="Order summary">
          <h2>Order Summary</h2>

          {addressCard}

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
                <div className="order-review-item-side">
                  <span className="order-review-price">₹{(item.price * item.qty).toFixed(2)}</span>
                  <button type="button" className="order-review-remove" onClick={() => handleRemoveItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-step-actions checkout-step-actions-split">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back to Address</button>
            <button type="button" className="btn" onClick={() => advanceTo(3)}>Continue to Payment</button>
          </div>
        </section>
        )}

        {/* ---- Step 3: payment ---- */}
        {step === 3 && (
        <section className="checkout-panel" aria-label="Payment">
          <h2>Payment</h2>

          {addressCard}

          <div className="checkout-payment-methods">
            <h3>Payment method</h3>
            <label className={`checkout-pay-option${paymentMethod === 'razorpay' ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={paymentMethod === 'razorpay'}
                onChange={() => setPaymentMethod('razorpay')}
              />
              <span className="checkout-pay-body">
                <span className="checkout-pay-title">Pay Online</span>
                <span className="checkout-pay-desc">UPI, Credit &amp; Debit Cards, NetBanking — via Razorpay</span>
              </span>
            </label>
            {paymentMethod === 'razorpay' && (
              <p className="payment-hint">
                {isTestMode
                  ? 'TEST MODE: Use test UPI "success@razorpay" or test card 4111 1111 1111 1111 (any future expiry, any CVV).'
                  : 'Pay securely via Razorpay. You will be redirected to complete your payment.'}
              </p>
            )}
            <label className={`checkout-pay-option${paymentMethod === 'cod' ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              <span className="checkout-pay-body">
                <span className="checkout-pay-title">Cash on Delivery</span>
                <span className="checkout-pay-desc">Pay in cash when your order is delivered. No advance payment required.</span>
              </span>
            </label>
          </div>

          <div className="checkout-step-actions checkout-step-actions-split">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>Back to Order Summary</button>
            <button type="button" className="btn" onClick={handlePlaceOrder} disabled={loading || paymentOpen}>
              {loading
                ? 'Processing...'
                : paymentMethod === 'cod'
                ? `Place Order — Cash on Delivery (₹${totalAmount.toFixed(2)})`
                : `Pay ₹${totalAmount.toFixed(2)}`}
            </button>
          </div>
        </section>
        )}

        <aside className="checkout-summary" aria-label="Price details" data-reveal style={{ '--reveal-delay': '240ms' }}>
          <h2>Price Details</h2>

          <div className="order-review">
            <div className="order-review-row">
              <span>Price ({cartItems.length} item{cartItems.length === 1 ? '' : 's'})</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="order-review-row">
              <span>GST (18%)</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>
            <div className="order-review-row order-review-total">
              <span>Total Amount</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;