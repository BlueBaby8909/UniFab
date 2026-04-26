import { useState } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (email, password) => {
        if (email === "kyle@admin.com" && password === "123") {
            const adminUser = { name: "Kyle", email: email, role: "admin" };
            setUser(adminUser);
            return { success: true, user: adminUser };
        }
        return { success: false, message: "Invalid credentials" };
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
