// ============================================
// API CLIENT - PRODUÇÃO
// ============================================

// 🔗 URL DO BACKEND NO RENDER
const API_URL = 'https://visionsite-backend.onrender.com/api';

// ============================================
// TOKEN MANAGEMENT
// ============================================

const getToken = () => localStorage.getItem('vision_token');
const setToken = (token) => localStorage.setItem('vision_token', token);
const removeToken = () => {
    localStorage.removeItem('vision_token');
    localStorage.removeItem('vision_user');
};

// ============================================
// API REQUEST HELPER
// ============================================

async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    
    const defaultHeaders = {};
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        if (response.status === 401) {
            removeToken();
            window.location.href = '/login.html';
            throw new Error('Sessão expirada');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro na requisição');
        }
        
        return data;
        
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// AUTH API
// ============================================

const authAPI = {
    async login(username, password) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.token) {
            setToken(data.token);
            localStorage.setItem('vision_user', JSON.stringify(data.user));
        }
        
        return data;
    },
    
    async me() {
        return await apiRequest('/auth/me');
    },
    
    logout() {
        removeToken();
        window.location.href = '/login.html';
    },
    
    isAuthenticated() {
        return !!getToken();
    },
    
    getCurrentUser() {
        const userStr = localStorage.getItem('vision_user');
        return userStr ? JSON.parse(userStr) : null;
    }
};

// ============================================
// PROPERTIES API
// ============================================

const propertiesAPI = {
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        return await apiRequest(`/properties?${params.toString()}`);
    },
    
    async getFeatured() {
        return await apiRequest('/properties/featured');
    },
    
    async getById(id) {
        return await apiRequest(`/properties/${id}`);
    },
    
    async create(formData) {
        return await apiRequest('/properties', {
            method: 'POST',
            body: formData
        });
    },
    
    async update(id, formData) {
        return await apiRequest(`/properties/${id}`, {
            method: 'PUT',
            body: formData
        });
    },
    
    async delete(id) {
        return await apiRequest(`/properties/${id}`, {
            method: 'DELETE'
        });
    }
};

// ============================================
// USERS API
// ============================================

const usersAPI = {
    async getAll() {
        return await apiRequest('/users');
    },
    
    async getBrokers() {
        return await apiRequest('/users/brokers');
    },
    
    async getById(id) {
        return await apiRequest(`/users/${id}`);
    },
    
    async create(userData) {
        return await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async update(id, userData) {
        return await apiRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },
    
    async delete(id) {
        return await apiRequest(`/users/${id}`, {
            method: 'DELETE'
        });
    }
};

// ============================================
// APPOINTMENTS API
// ============================================

const appointmentsAPI = {
    async create(appointmentData) {
        return await apiRequest('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
    },
    
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        return await apiRequest(`/appointments?${params.toString()}`);
    },
    
    async getById(id) {
        return await apiRequest(`/appointments/${id}`);
    },
    
    async updateStatus(id, status) {
        return await apiRequest(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },
    
    async delete(id) {
        return await apiRequest(`/appointments/${id}`, {
            method: 'DELETE'
        });
    }
};

// Helper function para URLs de imagens
function getImageUrl(path) {
    if (!path) return 'https://via.placeholder.com/400x280?text=Sem+Imagem';
    if (path.startsWith('http')) return path;
    return `${API_URL.replace('/api', '')}${path}`;
}

console.log('✅ API Client carregado');
console.log('🔗 API URL:', API_URL);