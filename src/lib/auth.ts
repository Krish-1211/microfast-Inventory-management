import api from './api';

export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response && response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};
