import React from 'react';
import App from './App';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/Authcontext';
import './styles/global.css'; // Import the global CSS file for styling
import './styles/effects.css'; // Global motion & effects
import { Provider } from 'react-redux';
import store from './redux/store';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>
);
