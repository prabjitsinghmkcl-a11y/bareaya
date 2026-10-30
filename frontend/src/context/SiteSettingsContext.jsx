import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// These match the backend defaults so the footer and contact page never flash
// empty while the settings request is in flight (or if it fails).
export const DEFAULT_SITE_SETTINGS = {
  addressLine1: 'B-46/1 Nariana Industrial Area Phase-2,',
  addressLine2: 'New Delhi-110028, India',
  phone: '+91 92661 45378',
  email: 'care@bareya.in',
  weekdayHours: 'Mon – Fri: 10:00 – 06:30',
  weekendHours: 'Sat & Sun: 09:30 – 21:30',
  instagramHandle: '@bareaya.skin',
  instagramUrl: 'https://instagram.com/bareaya.skin',
};

const SiteSettingsContext = createContext({
  settings: DEFAULT_SITE_SETTINGS,
  loading: false,
  refreshSettings: () => {},
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

// "+91 92661 45378" -> "tel:+919266145378"
export const toTelHref = (phone = '') => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data === 'object') {
        setSettings({ ...DEFAULT_SITE_SETTINGS, ...data });
      }
    } catch {
      // Keep the built-in defaults; contact details are not worth blocking the page.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
