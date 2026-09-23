import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { closeCartDrawer, updateQuantity } from '../redux/cartSlice';
import '../styles/cartDrawer.css';

const CartDrawer = () => {
  const dispatch = useDispatch();
  const { cartItems, isDrawerOpen } = useSelector((state) => state.cart);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);

  if (!isDrawerOpen) return null;

  return (
    <div className="cart-drawer-overlay" role="presentation" onClick={() => dispatch(closeCartDrawer())}>
      <aside
        className="cart-drawer"
        aria-label="Shopping cart"
        aria-modal="true"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-drawer-header">
          <h2>Your cart ({cartItems.length})</h2>
          <button
            type="button"
            className="cart-drawer-close"
            aria-label="Close cart"
            onClick={() => dispatch(closeCartDrawer())}
          >
            ×
          </button>
        </div>

        <div className="cart-drawer-items">
          {cartItems.map((item) => (
            <div className="cart-drawer-item" key={item.id}>
              <img
                src={item.imageUrl || item.image}
                alt={item.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/logo.png';
                }}
              />
              <div className="cart-drawer-item-info">
                <h3>{item.name}</h3>
                <div className="cart-drawer-quantity" aria-label={`Quantity for ${item.name}`}>
                  <button
                    type="button"
                    onClick={() => dispatch(updateQuantity({ id: item.id, qty: item.qty - 1 }))}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => dispatch(updateQuantity({ id: item.id, qty: item.qty + 1 }))}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <p>₹{(item.price * item.qty).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-drawer-footer">
          <div className="cart-drawer-total">
            <strong>Total</strong>
            <strong>₹{subtotal.toFixed(2)}</strong>
          </div>
          <Link to="/cart" className="cart-drawer-action" onClick={() => dispatch(closeCartDrawer())}>
            View Cart &amp; Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
};

export default CartDrawer;
