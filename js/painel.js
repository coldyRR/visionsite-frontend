// ============================================
// PAINEL - VERSÃO FINAL (LEADS CORRIGIDOS)
// ============================================

const API_BASE_URL = "https://visionsite-backend.onrender.com";
let editingPropertyId = null;
let propertyImages = [];

function getImageUrl(imagePath) {
    if (!imagePath) return 'https://via.placeholder.com/60';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
}

function formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- LOAD DASHBOARD ---
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
            ['leadsMenuItem', 'leadsCard', 'brokersMenuItem'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'block';
            });
        }
        await updateDashboardStats();
        showPainelSection('dashboard');
    } catch (error) {
        authAPI.logout();
    }
}

async function updateDashboardStats() {
    try {
        const props = await propertiesAPI.getAll();
        document.getElementById('totalProperties').textContent = props.data.length;
        document.getElementById('propertiesActive').textContent = props.data.filter(p => p.active).length;
        
        const user = authAPI.getCurrentUser();
        if (user && user.role === 'admin') {
            try {
                const leads = await appointmentsAPI.getAll();
                document.getElementById('totalLeads').textContent = leads.data.length;
            } catch(e) {}
        }
    } catch (error) {}
}

function showPainelSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    const map = {
        'dashboard': [0, 'dashboardSection'],
        'properties': [1, 'propertiesSection'],
        'leads': [2, 'leadsSection'],
        'brokers': [3, 'brokersSection']
    };

    if (map[section]) {
        document.getElementById(map[section][1]).style.display = 'block';
        document.querySelectorAll('.menu-item')[map[section][0]].classList.add('active');
        
        if(section === 'properties') loadPropertiesTable();
        if(section === 'leads') loadLeads();
        if(section === 'brokers') loadBrokers();
        if(section === 'dashboard') updateDashboardStats();
    }
}

// --- IMÓVEIS ---
async function loadPropertiesTable() {
    const tbody = document.getElementById('propertiesTableBody');
    try {
        const response = await propertiesAPI.getAll();
        const properties = response.data;

        if (properties.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Nenhum imóvel.</td></tr>';
            return;
        }

        tbody.innerHTML = properties.map(p => `
            <tr>
                <td><img src="${getImageUrl(p.images[0])}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;"></td>
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
                    <button class="btn-icon" onclick="editProperty('${p._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="confirmDeleteProperty('${p._id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6">Erro ao carregar.</td></tr>';
    }
}

async function togglePropertyActive(id, active) {
    const formData = new FormData();
    formData.append('active', active);
    await propertiesAPI.update(id, formData);
    updateDashboardStats();
}

// --- LEADS (CLIENTES) - CORRIGIDO ---
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
            // Tenta pegar o nome do imóvel de todas as formas possíveis
            let imovelNome = 'Imóvel Excluído ou Não Encontrado';
            if (a.propertyTitle) imovelNome = a.propertyTitle;
            else if (a.propertyId && a.propertyId.title) imovelNome = a.propertyId.title;
            
            // Link WhatsApp
            const wppMsg = `Olá ${a.clientName}! Recebemos seu interesse no imóvel: ${imovelNome}.`;
            const wppLink = `https://wa.me/55${a.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(wppMsg)}`;

            return `
                <div class="lead-card" style="background:#141414;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:15px;">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:15px;">
                        <div>
                            <div style="font-size:1.1rem;font-weight:600;color:#fff;">${a.clientName}</div>
                            <div style="color:#888;">Imóvel: <strong style="color:#c0c0c0;">${imovelNome}</strong></div>
                        </div>
                        <a href="${wppLink}" target="_blank" style="background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;">
                            <i class="fab fa-whatsapp"></i> Contatar
                        </a>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;color:#888;">
                        <div><i class="fas fa-phone"></i> ${a.clientPhone}</div>
                        ${a.clientEmail ? `<div><i class="fas fa-envelope"></i> ${a.clientEmail}</div>` : ''}
                    </div>
                    ${a.clientMessage ? `<div style="margin-top:15px;padding-top:15px;border-top:1px solid #333;color:#aaa;">Msg: ${a.clientMessage}</div>` : ''}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="empty-state">Erro ao carregar leads.</div>';
    }
}

// --- MODAL DE IMÓVEIS (EDITAR/CRIAR) ---
function openPropertyModal(id=null) {
    const modal = document.getElementById('propertyModal');
    const form = document.getElementById('propertyForm');
    const preview = document.getElementById('imagePreview');
    form.reset();
    propertyImages = [];
    preview.innerHTML = '';
    editingPropertyId = id;
    
    document.getElementById('modalTitle').textContent = id ? 'Editar Imóvel' : 'Novo Imóvel';
    if(id) loadPropertyData(id);
    modal.classList.add('active');
}

async function loadPropertyData(id) {
    const res = await propertiesAPI.getById(id);
    const p = res.data;
    
    document.getElementById('propTitle').value = p.title;
    document.getElementById('propDescription').value = p.description;
    document.getElementById('propType').value = p.type;
    document.getElementById('propPrice').value = p.price;
    document.getElementById('propLocation').value = p.location;
    document.getElementById('propArea').value = p.area;
    document.getElementById('propBedrooms').value = p.bedrooms;
    document.getElementById('propBathrooms').value = p.bathrooms;
    document.getElementById('propGarages').value = p.garages;

    const preview = document.getElementById('imagePreview');
    if(p.images) {
        p.images.forEach((img, idx) => {
            const div = document.createElement('div');
            div.className = 'image-preview-item';
            div.innerHTML = `<img src="${getImageUrl(img)}" style="width:150px;height:150px;object-fit:cover;"><span class="image-name">Foto ${idx+1}</span>`;
            preview.appendChild(div);
        });
    }
}

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if(!editingPropertyId) {
        document.getElementById('imagePreview').innerHTML = '';
        propertyImages = [];
    }
    
    files.forEach(file => {
        propertyImages.push(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const div = document.createElement('div');
            div.className = 'image-preview-item';
            div.innerHTML = `<img src="${ev.target.result}" style="width:150px;height:150px;object-fit:cover;">`;
            document.getElementById('imagePreview').appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

async function saveProperty(e) {
    e.preventDefault();
    const fd = new FormData();
    ['Title','Description','Type','Price','Location','Area','Bedrooms','Bathrooms','Garages'].forEach(field => {
        fd.append(field.toLowerCase(), document.getElementById(`prop${field}`).value);
    });
    
    propertyImages.forEach(f => fd.append('images', f));

    try {
        if(editingPropertyId) await propertiesAPI.update(editingPropertyId, fd);
        else await propertiesAPI.create(fd);
        alert('Salvo com sucesso!');
        closePropertyModal();
        loadPropertiesTable();
        updateDashboardStats();
    } catch(err) {
        alert('Erro ao salvar: ' + err.message);
    }
}

async function confirmDeleteProperty(id) {
    if(confirm('Tem certeza?')) {
        await propertiesAPI.delete(id);
        loadPropertiesTable();
        updateDashboardStats();
    }
}

function closePropertyModal() { document.getElementById('propertyModal').classList.remove('active'); }
function editProperty(id) { openPropertyModal(id); }

document.addEventListener('DOMContentLoaded', loadPainelDashboard);