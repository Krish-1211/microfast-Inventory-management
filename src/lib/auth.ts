import api from './api';

export const login = async (email: string, password: string) => {
    // If offline, attempt to check local credentials
    if (!navigator.onLine) {
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
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        // Save for offline login
        localStorage.setItem('offline_creds', `${email}|${password}`);
        
        // Push this into background so we don't block the UI transition
        import('./syncEngine').then(m => m.syncNow(true));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // We keep offline_creds so they can log back in while offline
    window.location.href = '/login';
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};
