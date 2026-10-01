import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import CartDrawer from './components/CartDrawer';
import Preloader from './components/Preloader';
import BackToTop from './components/BackToTop';
import PageReveal from './components/PageReveal';

// Home stays eager on purpose — it is the entry route and owns the LCP image,
// so lazy-loading it would just add a request waterfall before anything paints.
// Everything else is split out and fetched only when a route actually needs it.
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Shop = lazy(() => import('./pages/Shop'));
const Login = lazy(() => import('./pages/Login'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/CheckOut'));
const Profile = lazy(() => import('./pages/Profile'));

// The whole admin surface is split out. Customers never touch these chunks, so
// they are never downloaded on the storefront.
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AddProduct = lazy(() => import('./admin/AddProduct'));
const AdminProducts = lazy(() => import('./admin/AdminProducts'));
const EditProduct = lazy(() => import('./admin/EditProduct'));
const AdminOrders = lazy(() => import('./admin/AdminOrders'));
const AdminUsers = lazy(() => import('./admin/AdminUser'));

const isAdminBuild = process.env.REACT_APP_ADMIN_ONLY === 'true';

// Reserves full viewport height so swapping in a loaded route does not collapse
// the page and bounce the scroll position.
const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading page"
    style={{ minHeight: '70vh' }}
  />
);

const AdminApp = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      {isAdminBuild && <Route path="/login" element={<AdminLogin />} />}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/add-product" element={<AddProduct />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/edit-product/:id" element={<EditProduct />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </Suspense>
);

const CustomerApp = () => (
  <>
    <ScrollToTop />
    <Preloader />
    <BackToTop />
    <PageReveal />
    <Navbar />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    <Footer />
    <CartDrawer />
  </>
);

const AppRouter = () => {
  const location = useLocation();
  const isAdminRoute = isAdminBuild || location.pathname.startsWith('/admin');
  return isAdminRoute ? <AdminApp /> : <CustomerApp />;
};

function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

export default App;