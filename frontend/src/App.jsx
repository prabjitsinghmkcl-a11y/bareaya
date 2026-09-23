import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Shop from './pages/Shop';
import Login from './pages/Login';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/CheckOut';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AddProduct from './admin/AddProduct';
import AdminProducts from './admin/AdminProducts';
import EditProduct from './admin/EditProduct';
import AdminOrders from './admin/AdminOrders';
import AdminUsers from './admin/AdminUser';
import CartDrawer from './components/CartDrawer';
import Preloader from './components/Preloader';
import BackToTop from './components/BackToTop';
import PageReveal from './components/PageReveal';

const isAdminBuild = process.env.REACT_APP_ADMIN_ONLY === 'true';

const AdminApp = () => (
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
);

const CustomerApp = () => (
  <>
    <ScrollToTop />
    <Preloader />
    <BackToTop />
    <PageReveal />
    <Navbar />
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