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
                // Wait for background refresh to at least finish (or timeout) to ensure correct state
                api.get('/user/profile')
                    .then(res => {
                        localStorage.setItem('user', JSON.stringify(res.data));
                        setUser(res.data);
                    })
                    .catch(err => console.warn('Background profile refresh failed:', err.message))
                    .finally(() => setLoading(false));
                return; // Prevent immediate setLoading(false)
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

    const refreshUser = async () => {
        try {
            const response = await api.get('/user/profile');
            const refreshedUser = response.data;
            localStorage.setItem('user', JSON.stringify(refreshedUser));
            setUser(refreshedUser);
            return refreshedUser;
        } catch (error) {
            console.error('Failed to refresh user profile:', error);
            throw error;
        }
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
        <AuthContext.Provider value={{ user, updateUser, refreshUser, login, googleLogin, register, registerOrg, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
