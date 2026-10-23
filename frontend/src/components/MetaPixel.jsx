import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PIXEL_ID = '2776116864268328';
const PIXEL_SRC = 'https://connect.facebook.net/en_US/fbevents.js';

// Boots the Meta pixel lazily and reports every client-side route change as a
// PageView. It lives in the customer bundle only, so the admin app never ships
// or loads the pixel, and public/index.html stays free of inline scripts (the
// production CSP forbids them).
const ensurePixel = () => {
  if (typeof window.fbq === 'function') return window.fbq;

  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = PIXEL_SRC;
  document.head.appendChild(script);

  return fbq;
};

const MetaPixel = () => {
  const { pathname } = useLocation();
  const initialised = useRef(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    ensurePixel()('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }, []);

  useEffect(() => {
    // The mount effect above already reported the landing page.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (typeof window.fbq === 'function') window.fbq('track', 'PageView');
  }, [pathname]);

  return null;
};

export default MetaPixel;
