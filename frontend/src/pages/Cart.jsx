import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart } from '../redux/cartSlice';
import '../styles/cart.css';

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);

  return (
    <div className="cart-container">
      <h2 data-reveal>Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <div className="cart-empty" data-reveal style={{ '--reveal-delay': '120ms' }}>
          <p>Your cart is empty.</p>
          <Link to="/shop" className="btn">Continue Shopping</Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div key={item.id} className="cart-item" data-reveal style={{ '--reveal-delay': `${index * 80}ms` }}>
                <img src={item.imageUrl || item.image} alt={item.name} className="cart-item-image" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }} />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p className="cart-item-price">₹{(item.price * item.qty).toFixed(2)}</p>
                  <div className="cart-quantity" aria-label={`Quantity for ${item.name}`}>
                    <button
                      type="button"
                      onClick={() => dispatch(updateQuantity({ id: item.id, qty: item.qty - 1 }))}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >−</button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => dispatch(updateQuantity({ id: item.id, qty: item.qty + 1 }))}
                      aria-label={`Increase quantity of ${item.name}`}
                    >+</button>
                  </div>
                </div>
                <button onClick={() => dispatch(removeFromCart(item.id))} className="btn-remove">Remove</button>
              </div>
            ))}
          </div>
          <div className="cart-summary" data-reveal>
            <p>Subtotal: <strong>₹{subtotal.toFixed(2)}</strong></p>
            <button onClick={() => dispatch(clearCart())} className="btn-clear">Clear Cart</button>
            <Link
              to="/checkout"
              className="btn"
              onClick={(e) => {
                let userInfo = {};
                try {
                  userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
                } catch {
                  userInfo = {};
                }
                if (!userInfo.token) {
                  e.preventDefault();
                  navigate('/login');
                }
              }}
            >Proceed to Checkout</Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;