import {createSlice} from '@reduxjs/toolkit';

const CART_KEY = 'cartItems';

// Reading localStorage must never be able to take the whole app down. This runs
// at module scope during store creation, so an unguarded JSON.parse here throws
// before React mounts and every route renders a blank page.
const readStoredCart = () => {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        // Shape-validate every line: a value like "null" or "{}" would otherwise
        // make .find()/.map() throw at render time instead of failing safely here.
        return parsed.filter(
            (item) =>
                item &&
                typeof item === 'object' &&
                item.id != null &&
                typeof item.name === 'string' &&
                Number.isFinite(Number(item.price)) &&
                Number.isFinite(Number(item.qty)) &&
                Number(item.qty) > 0
        );
    } catch {
        // Corrupt or hand-edited value: start clean rather than crash.
        return [];
    }
};

const writeStoredCart = (cartItems) => {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    } catch {
        // Storage full or blocked (private browsing). In-memory state stays
        // correct; the cart just will not survive a reload.
    }
};

// Never let a line exceed what the product actually has in stock. The server
// rejects over-quantities anyway, but failing at checkout after the customer has
// filled in the whole form is a bad experience. Returns 0 when the product is
// known to be out of stock, so callers can drop the line entirely.
const clampToStock = (qty, stock) => {
    const wanted = Math.max(1, Math.floor(Number(qty) || 1));
    const available = Number(stock);
    // Unknown stock (legacy cart line, product omitted the field): trust qty.
    if (available == null || !Number.isFinite(available)) return wanted;
    return Math.max(0, Math.min(wanted, Math.floor(available)));
};

const initialState = {
    cartItems: readStoredCart(),
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
                state.cartItems = state.cartItems
                    .map((x) =>
                        x.id === item.id
                            ? { ...x, stock: item.stock ?? x.stock, qty: clampToStock(x.qty + item.qty, item.stock ?? x.stock) }
                            : x
                    )
                    .filter((x) => x.qty > 0);
            } else {
                const qty = clampToStock(item.qty, item.stock);
                // A product at zero stock never enters the cart in the first place.
                if (qty > 0) {
                    state.cartItems = [...state.cartItems, { ...item, qty }];
                }
            }
            state.isDrawerOpen = state.cartItems.length > 0;
        },
        closeCartDrawer: (state) => {
            state.isDrawerOpen = false;
        },
        removeFromCart: (state, action) => {
            state.cartItems = state.cartItems.filter((x) => x.id !== action.payload);
            if (state.cartItems.length === 0) state.isDrawerOpen = false;
        },
        updateQuantity: (state, action) => {
            const { id, qty } = action.payload;
            state.cartItems = state.cartItems
                .map((item) =>
                    item.id === id ? { ...item, qty: clampToStock(qty, item.stock) } : item
                )
                .filter((item) => item.qty > 0);
            if (state.cartItems.length === 0) state.isDrawerOpen = false;
        },
        clearCart: (state) => {
            state.cartItems = [];
            state.isDrawerOpen = false;
        },
        // Re-hydrate cart lines from freshly fetched product data so a price or
        // stock change made after the cart was filled is reflected instead of
        // leaving checkout stuck on a stale total.
        refreshCartPricing: (state, action) => {
            const products = new Map((action.payload || []).map((p) => [String(p._id), p]));
            state.cartItems = state.cartItems
                .map((item) => {
                    const product = products.get(String(item.id));
                    if (!product) return item;
                    const stock = Number(product.stock);
                    return {
                        ...item,
                        name: product.name,
                        price: Number(product.price),
                        stock: Number.isFinite(stock) ? stock : item.stock,
                        qty: Number.isFinite(stock)
                            ? Math.min(Math.max(1, Number(item.qty) || 1), stock)
                            : item.qty,
                    };
                })
                .filter((item) => item.qty > 0);
        },
    },
});

export const {
    addToCart,
    closeCartDrawer,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCartPricing,
} = cartSlice.actions;

export default cartSlice.reducer;

// Persisting lives here rather than inside the reducers: a reducer must stay a
// pure function of (state, action), and writing to localStorage from one meant
// JSON.stringify ran against an Immer draft proxy. If a write ever throws
// (quota, private mode) the in-memory state had already changed and silently
// drifted out of sync with storage.
export const subscribeCartPersistence = (store) => {
    let previous = null;
    return store.subscribe(() => {
        const cartItems = store.getState().cart.cartItems;
        const serialized = JSON.stringify(cartItems);
        if (serialized === previous) return;
        previous = serialized;
        writeStoredCart(cartItems);
    });
};