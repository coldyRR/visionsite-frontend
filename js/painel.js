// ============================================
// PAINEL - VERSÃO CLOUDINARY FINAL
// ============================================

const API_BASE_URL = "https://visionsite-backend.onrender.com";
let editingPropertyId = null;
let propertyImages = [];

// --- HELPER: Função inteligente para arrumar imagens ---
function getImageUrl(imagePath) {
    if (!imagePath) return 'https://via.placeholder.com/60';
    
    // Se já tem http (Vem do Cloudinary), usa direto
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // Se não tem http (Imagem antiga local), coloca o servidor na frente
    return `${API_BASE_URL}${imagePath}`;
}

// Load Dashboard
async function loadPainelDashboard() {
    if (!authAPI.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await authAPI.me();
        const user = response.user;
        
        document.getElementById('userInfo').textContent = user.name;

        if (user.role === 'admin') {
            const leadsMenuItem = document.getElementById('leadsMenuItem');
            const leadsCard = document.getElementById('leadsCard');
            const brokersMenuItem = document.getElementById('brokersMenuItem');
            if (leadsMenuItem) leadsMenuItem.style.display = 'block';
            if (leadsCard) leadsCard.style.display = 'block';
            if (brokersMenuItem) brokersMenuItem.style.display = 'block';
        }

        await updateDashboardStats();
        showPainelSection('dashboard');
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        authAPI.logout();
    }
}

// Update Stats
async function updateDashboardStats() {
    try {
        const propertiesResponse = await propertiesAPI.getAll();
        const properties = propertiesResponse.data;
        
        document.getElementById('totalProperties').textContent = properties.length;
        document.getElementById('propertiesActive').textContent = properties.filter(p => p.active).length;
        
        const user = authAPI.getCurrentUser();
        if (user && user.role === 'admin') {
            try {
                const appointmentsResponse = await appointmentsAPI.getAll();
                document.getElementById('totalLeads').textContent = appointmentsResponse.data.length;
            } catch (error) {
                console.error('Erro ao carregar cadastros:', error);
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// Show Section
function showPainelSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    if (section === 'dashboard') {
        document.getElementById('dashboardSection').style.display = 'block';
        document.querySelectorAll('.menu-item')[0].classList.add('active');
        updateDashboardStats();
    } else if (section === 'properties') {
        document.getElementById('propertiesSection').style.display = 'block';
        document.querySelectorAll('.menu-item')[1].classList.add('active');
        loadPropertiesTable();
    } else if (section === 'leads') {
        document.getElementById('leadsSection').style.display = 'block';
        document.querySelectorAll('.menu-item')[2].classList.add('active');
        loadLeads();
    } else if (section === 'brokers') {
        document.getElementById('brokersSection').style.display = 'block';
        document.querySelectorAll('.menu-item')[3].classList.add('active');
        loadBrokers();
    }
}

// Load Properties Table
async function loadPropertiesTable() {
    const tbody = document.getElementById('propertiesTableBody');

    try {
        const response = await propertiesAPI.getAll();
        const properties = response.data;

        if (properties.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888; padding: 40px;">Nenhum imóvel cadastrado. Clique em "Novo Imóvel".</td></tr>';
            return;
        }

        tbody.innerHTML = properties.map(p => {
            // USA O HELPER AQUI PRA ARRUMAR A FOTO DA TABELA
            const mainImage = p.images && p.images.length > 0 
                ? getImageUrl(p.images[0]) 
                : 'https://via.placeholder.com/60';
            
            return `
            <tr>
                <td><img src="${mainImage}" class="property-img" onerror="this.src='https://via.placeholder.com/60'" style="width:60px;height:60px;object-fit:cover;border-radius:4px;"></td>
                <td><strong>${p.title}</strong></td>
                <td>${p.location}</td>
                <td><strong>${formatPrice(p.price)}</strong></td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${p.active ? 'checked' : ''} onchange="togglePropertyActive('${p._id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </td>
                <td>
                    <button class="btn-icon" onclick="editProperty('${p._id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="confirmDeleteProperty('${p._id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar imóveis:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ff6b6b; padding: 40px;">Erro ao carregar imóveis.</td></tr>';
    }
}

// Toggle Property Active
async function togglePropertyActive(id, active) {
    try {
        const formData = new FormData();
        formData.append('active', active);
        
        await propertiesAPI.update(id, formData);
        updateDashboardStats();
    } catch (error) {
        console.error('Erro ao atualizar disponibilidade:', error);
        alert('❌ Erro ao atualizar disponibilidade');
        loadPropertiesTable();
    }
}

// Open Property Modal
function openPropertyModal(propertyId = null) {
    const modal = document.getElementById('propertyModal');
    const form = document.getElementById('propertyForm');
    const title = document.getElementById('modalTitle');
    const preview = document.getElementById('imagePreview');

    form.reset();
    propertyImages = [];
    preview.innerHTML = '';
    editingPropertyId = propertyId;

    if (propertyId) {
        title.textContent = 'Editar Imóvel';
        loadPropertyData(propertyId);
    } else {
        title.textContent = 'Novo Imóvel';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function loadPropertyData(propertyId) {
    try {
        const response = await propertiesAPI.getById(propertyId);
        const property = response.data;

        document.getElementById('propertyId').value = property._id;
        document.getElementById('propTitle').value = property.title;
        document.getElementById('propDescription').value = property.description;
        document.getElementById('propType').value = property.type;
        document.getElementById('propPrice').value = property.price;
        document.getElementById('propLocation').value = property.location;
        document.getElementById('propArea').value = property.area;
        document.getElementById('propBedrooms').value = property.bedrooms;
        document.getElementById('propBathrooms').value = property.bathrooms;
        document.getElementById('propGarages').value = property.garages;

        const preview = document.getElementById('imagePreview');
        if (property.images && property.images.length > 0) {
            property.images.forEach((img, index) => {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item';
                // USA O HELPER AQUI TAMBÉM PRA ARRUMAR O PREVIEW DA EDIÇÃO
                imageDiv.innerHTML = `
                    <img src="${getImageUrl(img)}" alt="Imagem ${index + 1}" onerror="this.src='https://via.placeholder.com/150'" style="width:150px;height:150px;object-fit:cover;">
                    <span class="image-name">Imagem ${index + 1}</span>
                `;
                preview.appendChild(imageDiv);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar imóvel:', error);
        alert('Erro ao carregar imóvel');
    }
}

function closePropertyModal() {
    document.getElementById('propertyModal').classList.remove('active');
    document.body.style.overflow = '';
    editingPropertyId = null;
    propertyImages = [];
}

function editProperty(id) {
    openPropertyModal(id);
}

// IMAGE UPLOAD
function handleImageUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('imagePreview');
    
    // Limpar preview se for novo imóvel
    if (!editingPropertyId) {
        preview.innerHTML = '';
        propertyImages = [];
    }

    Array.from(files).forEach(file => {
        // Validar tipo
        if (!file.type.match('image.*')) {
            alert(`❌ ${file.name} não é uma imagem válida`);
            return;
        }

        // Validar tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(`❌ ${file.name} é muito grande (máx 5MB)`);
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            propertyImages.push(file);
            
            const imageDiv = document.createElement('div');
            imageDiv.className = 'image-preview-item';
            imageDiv.style.position = 'relative';
            imageDiv.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}" style="width:150px;height:150px;object-fit:cover;border-radius:8px;">
                <button type="button" class="btn-remove-image" onclick="removeImage(${propertyImages.length - 1})" style="position:absolute;top:5px;right:5px;background:#ef4444;color:#fff;border:none;width:25px;height:25px;border-radius:50%;cursor:pointer;">
                    <i class="fas fa-times"></i>
                </button>
                <span class="image-name" style="display:block;text-align:center;font-size:0.75rem;color:#888;margin-top:5px;">${file.name}</span>
            `;
            preview.appendChild(imageDiv);
        };

        reader.readAsDataURL(file);
    });
}

function removeImage(index) {
    propertyImages.splice(index, 1);
    const preview = document.getElementById('imagePreview');
    const items = preview.getElementsByClassName('image-preview-item');
    if (items[index]) {
        items[index].remove();
    }
}

// Save Property
async function saveProperty(event) {
    event.preventDefault();

    if (!editingPropertyId && propertyImages.length === 0) {
        alert('❌ Adicione pelo menos uma imagem!');
        return;
    }

    const formData = new FormData();
    formData.append('title', document.getElementById('propTitle').value);
    formData.append('description', document.getElementById('propDescription').value);
    formData.append('type', document.getElementById('propType').value);
    formData.append('price', document.getElementById('propPrice').value);
    formData.append('location', document.getElementById('propLocation').value);
    formData.append('area', document.getElementById('propArea').value);
    formData.append('bedrooms', document.getElementById('propBedrooms').value);
    formData.append('bathrooms', document.getElementById('propBathrooms').value);
    formData.append('garages', document.getElementById('propGarages').value);

    // Adicionar imagens
    propertyImages.forEach(file => {
        formData.append('images', file);
    });

    try {
        if (editingPropertyId) {
            await propertiesAPI.update(editingPropertyId, formData);
            alert('✅ Imóvel atualizado!');
        } else {
            await propertiesAPI.create(formData);
            alert('✅ Imóvel cadastrado!\n\nAs imagens foram salvas no servidor.');
        }

        closePropertyModal();
        loadPropertiesTable();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('❌ Erro: ' + error.message);
    }
}

// Delete Property
async function confirmDeleteProperty(id) {
    if (confirm('Excluir este imóvel?')) {
        try {
            await propertiesAPI.delete(id);
            alert('✅ Imóvel excluído!');
            loadPropertiesTable();
            updateDashboardStats();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('❌ Erro: ' + error.message);
        }
    }
}

// Load Leads
async function loadLeads() {
    const container = document.getElementById('leadsContainer');

    try {
        const response = await appointmentsAPI.getAll();
        const appointments = response.data;

        if (appointments.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Nenhum cadastro</h3></div>';
            return;
        }

        container.innerHTML = appointments.map(a => {
            const whatsappMsg = `Olá ${a.clientName}! Vi que você demonstrou interesse no imóvel: ${a.propertyTitle}.`;
            return `
                <div class="lead-card" style="background:#141414;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:15px;">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:15px;">
                        <div>
                            <div style="font-size:1.1rem;font-weight:600;color:#fff;margin-bottom:5px;">${a.clientName}</div>
                            <div style="color:#888;font-size:0.9rem;">Interesse em: <strong style="color:#c0c0c0;">${a.propertyTitle}</strong></div>
                        </div>
                        <a href="https://wa.me/55${a.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}" 
                           target="_blank" 
                           style="background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:0.9rem;">
                            <i class="fab fa-whatsapp"></i> Contatar
                        </a>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;color:#888;font-size:0.85rem;">
                        <div><i class="fas fa-phone"></i> ${a.clientPhone}</div>
                        ${a.clientEmail ? `<div><i class="fas fa-envelope"></i> ${a.clientEmail}</div>` : ''}
                        <div><i class="fas fa-calendar"></i> ${formatDate(a.createdAt)}</div>
                    </div>
                    ${a.clientMessage ? `<div style="margin-top:15px;padding-top:15px;border-top:1px solid #333;color:#aaa;"><strong>Mensagem:</strong><br>${a.clientMessage}</div>` : ''}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar cadastros:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erro ao carregar</h3></div>';
    }
}

// BROKER/USER MANAGEMENT
async function loadBrokers() {
    const container = document.getElementById('brokersContainer');

    try {
        const response = await usersAPI.getAll();
        const users = response.data;

        if (users.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>Nenhum usuário</h3></div>';
            return;
        }

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Usuário</th>
                        <th>E-mail</th>
                        <th>Tipo</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td><strong>${u.name}</strong></td>
                            <td>${u.username}</td>
                            <td>${u.email}</td>
                            <td><span class="badge badge-${u.role === 'admin' ? 'venda' : 'aluguel'}">${u.role === 'admin' ? 'Admin' : 'Corretor'}</span></td>
                            <td>${formatDate(u.createdAt)}</td>
                            <td>
                                <button class="btn-icon" onclick="editBroker('${u._id}')" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${u.role !== 'admin' || users.filter(x => x.role === 'admin').length > 1 ? `
                                <button class="btn-icon delete" onclick="confirmDeleteBroker('${u._id}')" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erro ao carregar</h3></div>';
    }
}

function openBrokerModal(brokerId = null) {
    const modal = document.getElementById('brokerModal');
    const form = document.getElementById('brokerForm');
    const title = document.getElementById('brokerModalTitle');

    form.reset();

    if (brokerId) {
        title.textContent = 'Editar Usuário';
        loadBrokerData(brokerId);
        document.getElementById('brokerPassword').required = false;
        document.getElementById('passwordHint').textContent = 'Deixe em branco para manter a senha atual';
    } else {
        title.textContent = 'Novo Usuário';
        document.getElementById('brokerPassword').required = true;
        document.getElementById('passwordHint').textContent = 'Mínimo 6 caracteres';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function loadBrokerData(brokerId) {
    try {
        const response = await usersAPI.getById(brokerId);
        const broker = response.data;

        document.getElementById('brokerId').value = broker._id;
        document.getElementById('brokerName').value = broker.name;
        document.getElementById('brokerUsername').value = broker.username;
        document.getElementById('brokerEmail').value = broker.email;
        document.getElementById('brokerRole').value = broker.role;
        
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        alert('Erro ao carregar usuário');
    }
}

function closeBrokerModal() {
    document.getElementById('brokerModal').classList.remove('active');
    document.body.style.overflow = '';
}

function editBroker(id) {
    openBrokerModal(id);
}

async function saveBroker(event) {
    event.preventDefault();

    const brokerId = document.getElementById('brokerId').value;
    const brokerData = {
        name: document.getElementById('brokerName').value,
        username: document.getElementById('brokerUsername').value,
        email: document.getElementById('brokerEmail').value,
        role: document.getElementById('brokerRole').value,
        password: document.getElementById('brokerPassword').value
    };

    if (!brokerData.password) {
        delete brokerData.password;
    }

    try {
        if (brokerId) {
            await usersAPI.update(brokerId, brokerData);
            alert('✅ Usuário atualizado!');
        } else {
            await usersAPI.create(brokerData);
            alert('✅ Usuário cadastrado!');
        }

        closeBrokerModal();
        loadBrokers();
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('❌ Erro: ' + error.message);
    }
}

async function confirmDeleteBroker(id) {
    if (confirm('Excluir este usuário?')) {
        try {
            await usersAPI.delete(id);
            alert('✅ Usuário excluído!');
            loadBrokers();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('❌ Erro: ' + error.message);
        }
    }
}

// Close modal on click outside
document.addEventListener('click', function(event) {
    const propertyModal = document.getElementById('propertyModal');
    if (propertyModal && event.target === propertyModal) {
        closePropertyModal();
    }
    const brokerModal = document.getElementById('brokerModal');
    if (brokerModal && event.target === brokerModal) {
        closeBrokerModal();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadPainelDashboard);