import api from './api';
import { db } from './localDb';

export const login = async (email: string, password: string) => {
    // If offline, attempt to check local credentials
    if (!navigator.onLine) {
        // Try IndexedDB first (more stable)
        const localUser = await db.users.where('email').equalsIgnoreCase(email).first();
        if (localUser && localUser.password === password) {
            localStorage.setItem('token', localUser.token || '');
            localStorage.setItem('user', JSON.stringify({
                _id: localUser.id,
                email: localUser.email,
                role: localUser.role
            }));
            return localUser;
        }

        // Fallback to localStorage for compatibility
        const cachedCreds = localStorage.getItem('offline_creds');
        if (cachedCreds) {
            const [savedEmail, savedPass] = cachedCreds.split('|');
            if (email.toLowerCase() === savedEmail.toLowerCase() && password === savedPass) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                return user;
            }
        }
        throw new Error('Offline login failed. You must have logged in once while online on this device.');
    }

    // Online login
    const response = await api.post('/auth/login', { email, password });
    if (response && response.data && response.data.token) {
        const userData = response.data;
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('offline_creds', `${email}|${password}`);
        
        // Persist to IndexedDB for robust offline login
        await db.users.put({
            id: userData._id,
            email: userData.email,
            password: password,
            role: userData.role,
            token: userData.token,
            last_login: Date.now()
        });
        
        // Push this into background so we don't block the UI transition
        import('./syncEngine').then(m => m.syncNow(true));
    }
    return response.data;
};

export const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Note: We keep the user in IndexedDB so they can still log in offline if they know their pass
    window.location.href = '/login';
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};
