import React, { createContext, useCallback, useState } from "react";

export const AuthContext = createContext();

const getStoredUser = () => {
    try {
        const stored = localStorage.getItem("userInfo");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);

    // Stable identities: these are consumed inside useEffect dependency arrays,
    // so a fresh function on every render would re-trigger those effects
    // endlessly.
    const login = useCallback((userData) => {
        setUser(userData);
        try {
            localStorage.setItem("userInfo", JSON.stringify(userData));
        } catch {
            // Storage blocked (private browsing). The in-memory session still works.
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        try {
            localStorage.removeItem("userInfo");
        } catch {
            // ignore
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

