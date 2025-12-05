import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, getToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            setIsAuthLoading(true);
            try {
                // The getMe function will throw an error if the token is invalid, handled by the API layer
                const data = await authAPI.getMe();
                if (data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                // Token is invalid or network error, user remains null
                authAPI.logout(); // Ensure token is cleared
                setUser(null);
            } finally {
                setIsAuthLoading(false);
            }
        };

        // Only check user if a token exists
        if (getToken()) {
            checkUser();
        } else {
            setIsAuthLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        // The API function will throw on error, which should be caught in the UI component
        const data = await authAPI.login(email, password);
        if (data.user) {
            setUser(data.user);
        }
        return data;
    };
    
    const loginOTP = async (email, otp) => {
        const data = await authAPI.loginOTP(email, otp);
        if(data.user) {
            setUser(data.user);
        }
        return data;
    };

    const register = async (userData) => {
        const data = await authAPI.register(userData);
        if (data.user) {
            setUser(data.user);
        }
        return data;
    };

    const logout = () => {
        authAPI.logout();
        setUser(null);
    };
    
    const updateUser = (updatedUserData) => {
        setUser(prevUser => ({...prevUser, ...updatedUserData}));
    }

    const value = {
        user,
        isAuthLoading,
        login,
        loginOTP,
        register,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
