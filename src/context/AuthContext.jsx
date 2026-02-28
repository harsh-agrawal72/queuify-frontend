import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user from local storage:', e);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, tokens } = response.data;
        localStorage.setItem('token', tokens.access.token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const googleLogin = async (credential) => {
        const response = await api.post('/auth/google-login', { token: credential });
        const { user, tokens } = response.data;
        localStorage.setItem('token', tokens.access.token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const register = async (data) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    };

    const registerOrg = async (data) => {
        const response = await api.post('/auth/register-org', data);
        const { user, tokens } = response.data;
        localStorage.setItem('token', tokens.access.token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const updateUser = (updatedFields) => {
        setUser(prev => {
            const updated = { ...prev, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('superadminToken');
        localStorage.removeItem('superadminRefreshToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, updateUser, login, googleLogin, register, registerOrg, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
