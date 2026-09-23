import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    cartItems: localStorage.getItem('cartItems') ? JSON.parse(localStorage.getItem('cartItems')) : [],
    isDrawerOpen: false,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const item = action.payload;
            const existItem = state.cartItems.find((x) => x.id === item.id);
            if (existItem) {
                state.cartItems = state.cartItems.map((x) => x.id === item.id ? { ...x, qty: x.qty + item.qty } : x);
            } else {
                state.cartItems = [...state.cartItems, item];
            }
            state.isDrawerOpen = true;
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        closeCartDrawer: (state) => {
            state.isDrawerOpen = false;
        },
        removeFromCart: (state, action) => {
            state.cartItems = state.cartItems.filter((x) => x.id !== action.payload);
            if (state.cartItems.length === 0) state.isDrawerOpen = false;
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        updateQuantity: (state, action) => {
            const { id, qty } = action.payload;
            state.cartItems = state.cartItems
                .map((item) => item.id === id ? { ...item, qty } : item)
                .filter((item) => item.qty > 0);
            if (state.cartItems.length === 0) state.isDrawerOpen = false;
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        clearCart: (state) => {
            state.cartItems = [];
            state.isDrawerOpen = false;
            localStorage.removeItem('cartItems');
        },
    },
});

export const { addToCart, closeCartDrawer, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
