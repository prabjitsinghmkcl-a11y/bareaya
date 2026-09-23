import React, { createContext, useState } from "react";

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

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem("userInfo", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("userInfo");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

