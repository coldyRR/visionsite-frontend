// ============================================
// API CLIENT - Comunicação com Backend
// ============================================

const API_URL = 'http://localhost:5000/api';

// Obter token do localStorage
const getToken = () => {
    return localStorage.getItem('vision_token');
};

// Setar token no localStorage
const setToken = (token) => {
    localStorage.setItem('vision_token', token);
};

// Remover token do localStorage
const removeToken = () => {
    localStorage.removeItem('vision_token');
    localStorage.removeItem('vision_user');
};

// Headers padrão para requisições
const getHeaders = (includeAuth = true) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (includeAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
};

// Função auxiliar para fazer requisições
const apiRequest = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...getHeaders(options.auth !== false),
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            // Se token inválido, fazer logout
            if (response.status === 401) {
                removeToken();
                if (window.location.pathname !== '/login.html' && window.location.pathname !== '/index.html') {
                    window.location.href = 'login.html';
                }
            }
            throw new Error(data.message || 'Erro na requisição');
        }

        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
};

// ============================================
// AUTH API
// ============================================

const authAPI = {
    // Login
    login: async (username, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            auth: false,
            body: JSON.stringify({ username, password })
        });

        if (data.success && data.token) {
            setToken(data.token);
            localStorage.setItem('vision_user', JSON.stringify(data.user));
        }

        return data;
    },

    // Obter usuário atual
    me: async () => {
        return await apiRequest('/auth/me', {
            method: 'GET'
        });
    },

    // Logout
    logout: () => {
        removeToken();
        window.location.href = 'index.html';
    },

    // Verificar se está autenticado
    isAuthenticated: () => {
        return !!getToken();
    },

    // Obter usuário do localStorage
    getCurrentUser: () => {
        const user = localStorage.getItem('vision_user');
        return user ? JSON.parse(user) : null;
    }
};

// ============================================
// PROPERTIES API
// ============================================

const propertiesAPI = {
    // Listar todos os imóveis
    getAll: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        return await apiRequest(`/properties?${params}`, {
            method: 'GET',
            auth: false
        });
    },

    // Obter imóveis em destaque
    getFeatured: async () => {
        return await apiRequest('/properties/featured', {
            method: 'GET',
            auth: false
        });
    },

    // Obter imóvel por ID
    getById: async (id) => {
        return await apiRequest(`/properties/${id}`, {
            method: 'GET',
            auth: false
        });
    },

    // Criar novo imóvel (com imagens)
    create: async (formData) => {
        const token = getToken();
        const response = await fetch(`${API_URL}/properties`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData // FormData já tem o Content-Type correto
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao criar imóvel');
        }

        return data;
    },

    // Atualizar imóvel
    update: async (id, formData) => {
        const token = getToken();
        const response = await fetch(`${API_URL}/properties/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao atualizar imóvel');
        }

        return data;
    },

    // Deletar imóvel
    delete: async (id) => {
        return await apiRequest(`/properties/${id}`, {
            method: 'DELETE'
        });
    }
};

// ============================================
// USERS API (Admin only)
// ============================================

const usersAPI = {
    // Listar todos os usuários
    getAll: async () => {
        return await apiRequest('/users', {
            method: 'GET'
        });
    },

    // Listar apenas corretores
    getBrokers: async () => {
        return await apiRequest('/users/brokers', {
            method: 'GET'
        });
    },

    // Obter usuário por ID
    getById: async (id) => {
        return await apiRequest(`/users/${id}`, {
            method: 'GET'
        });
    },

    // Criar novo corretor
    create: async (userData) => {
        return await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    // Atualizar usuário
    update: async (id, userData) => {
        return await apiRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    // Deletar usuário
    delete: async (id) => {
        return await apiRequest(`/users/${id}`, {
            method: 'DELETE'
        });
    }
};

// ============================================
// APPOINTMENTS API
// ============================================

const appointmentsAPI = {
    // Criar cadastro de interesse (público)
    create: async (appointmentData) => {
        return await apiRequest('/appointments', {
            method: 'POST',
            auth: false,
            body: JSON.stringify(appointmentData)
        });
    },

    // Listar todos os cadastros (admin)
    getAll: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        return await apiRequest(`/appointments?${params}`, {
            method: 'GET'
        });
    },

    // Obter cadastro por ID (admin)
    getById: async (id) => {
        return await apiRequest(`/appointments/${id}`, {
            method: 'GET'
        });
    },

    // Atualizar status (admin)
    updateStatus: async (id, status) => {
        return await apiRequest(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    // Deletar cadastro (admin)
    delete: async (id) => {
        return await apiRequest(`/appointments/${id}`, {
            method: 'DELETE'
        });
    }
};

// ============================================
// UTILS
// ============================================

const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
