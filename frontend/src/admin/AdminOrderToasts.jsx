import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import { adminFetch, resolveAdminError } from '../utils/adminApi';
import '../styles/admin.css';

// How often the order list is re-read while an admin has the console open.
// 30s sits far below the authenticated limiter (600 req / 15 min) and is quick
// enough that a placed order pops up while the admin is watching.
const POLL_MS = 30000;
// The alert auto-hides after 3 seconds — enough to read the one-line
// summary, brief enough to never linger over the console.
const TOAST_LIFE_MS = 3000;

// Live "New order received" notifications — the admin-side mirror of the
// customer's order-placed celebration. Seeded silently on first load so the
// whole existing backlog never toasts; only orders placed AFTER that first
// snapshot light up.
const AdminOrderToasts = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const seenRef = useRef(null);
  const timersRef = useRef([]);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return undefined;
    let cancelled = false;

    const tick = async () => {
      try {
        const data = await adminFetch('/api/orders', { token: user.token });
        if (cancelled || !Array.isArray(data)) return;

        const ids = data.map((o) => o._id);
        if (seenRef.current === null) {
          // First snapshot: remember what already exists, toast nothing.
          seenRef.current = new Set(ids);
          return;
        }

        const fresh = data
          .filter((o) => o && o._id && !seenRef.current.has(o._id))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        fresh.forEach((o) => seenRef.current.add(o._id));
        if (fresh.length === 0) return;

        setToasts((prev) => [...fresh, ...prev].slice(0, 3));
        fresh.forEach((o) => {
          const timer = setTimeout(() => dismiss(o._id), TOAST_LIFE_MS);
          timersRef.current.push(timer);
        });
      } catch (err) {
        // Session expiry bounces to login; anything else (network blip) just
        // retries on the next tick — the admin page itself carries errors.
        resolveAdminError(err, logout, navigate);
      }
    };

    tick();
    const timer = setInterval(tick, POLL_MS);
    const pending = timersRef.current;
    return () => {
      cancelled = true;
      clearInterval(timer);
      pending.forEach(clearTimeout);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, logout, navigate]);

  if (toasts.length === 0) return null;

  return (
    <div className="adl-toasts" aria-live="polite" aria-label="New order notifications">
      {toasts.map((order) => {
        const addr = order.address || {};
        const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim() || 'Customer';
        const itemCount = Array.isArray(order.items) ? order.items.length : 0;
        return (
          <div key={order._id} className="adl-toast">
            <button
              type="button"
              className="adl-toast-main"
              onClick={() => {
                dismiss(order._id);
                navigate('/admin/orders', { state: { highlightId: order._id } });
              }}
            >
              <span className="adl-toast-check" aria-hidden="true">✓</span>
              <span className="adl-toast-body">
                <strong>New order received!</strong>
                <span className="adl-toast-sub">
                  {name} · {itemCount} item{itemCount === 1 ? '' : 's'} · ₹{Number(order.totalAmount || 0).toFixed(2)}
                </span>
                <span className="adl-toast-cta">View order <span aria-hidden="true">→</span></span>
              </span>
            </button>
            <button
              type="button"
              className="adl-toast-x"
              aria-label="Dismiss notification"
              onClick={() => dismiss(order._id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AdminOrderToasts;
