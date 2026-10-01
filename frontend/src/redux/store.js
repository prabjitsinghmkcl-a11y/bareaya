import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { subscribeCartPersistence } from '../redux/cartSlice';

const store = configureStore({
    reducer: {
        cart: cartReducer,
    },
});

// Mirror the cart into localStorage from a store subscription so the reducers
// themselves stay pure.
subscribeCartPersistence(store);

export default store;