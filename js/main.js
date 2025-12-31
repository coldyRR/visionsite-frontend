// ============================================
// VISION IMÓVEIS - MAIN.JS (Versão Final Blindada)
// ============================================

const API_BASE_URL = "https://visionsite-backend.onrender.com";

// --- HELPER: Função inteligente para arrumar imagens ---
function getImageUrl(imagePath, placeholderSize = '400x280') {
    if (!imagePath) return `https://via.placeholder.com/${placeholderSize}?text=Sem+Imagem`;
    
    // Se já tem http (Vem do Cloudinary ou link externo), usa direto
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // Se não tem http (Imagem antiga local), coloca o servidor na frente
    return `${API_BASE_URL}${imagePath}`;
}

// --- HELPER: Formatar Preço (R$) ---
function formatPrice(value) {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Menu Mobile
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
});

// ============================================
// HOMEPAGE
// ============================================

async function loadFeaturedProperties() {
    const container = document.getElementById('featuredProperties');
    if (!container) return;
    
    console.log('📡 Buscando imóveis recentes...');
    
    try {
        // Busca TODOS os imóveis
        const response = await propertiesAPI.getAll();
        // Pega os 6 primeiros
        const properties = response.data.slice(0, 6);
        
        console.log('✅ Imóveis carregados:', properties.length);
        
        if (properties.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 60px 20px;">Nenhum imóvel cadastrado no momento.</p>';
            return;
        }
        
        container.innerHTML = properties.map(property => {
            const mainImage = getImageUrl(property.images && property.images[0]);
            
            return `
            <div class="property-card" onclick="window.location.href='imovel.html?id=${property._id}'">
                <div class="property-image" style="background-image: url('${mainImage}')">
                    <span class="property-badge">Venda</span>
                </div>
                <div class="property-info">
                    <h3 class="property-title">${property.title}</h3>
                    <div class="property-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${property.location}
                    </div>
                    <div class="property-details">
                        <div class="property-detail-item">
                            <i class="fas fa-bed"></i> ${property.bedrooms}
                        </div>
                        <div class="property-detail-item">
                            <i class="fas fa-bath"></i> ${property.bathrooms}
                        </div>
                        <div class="property-detail-item">
                            <i class="fas fa-car"></i> ${property.garages}
                        </div>
                    </div>
                    <div class="property-price">${formatPrice(property.price)}</div>
                </div>
            </div>
        `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Erro ao carregar imóveis:', error);
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <p style="color: #888;">Erro ao carregar imóveis. Verifique sua conexão.</p>
                <button onclick="loadFeaturedProperties()" class="btn-primary" style="margin-top:10px;">
                    <i class="fas fa-sync"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

function performSearch() {
    const location = document.getElementById('searchLocation')?.value || '';
    const type = document.getElementById('searchType')?.value || '';
    const price = document.getElementById('searchPrice')?.value || '';
    
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (type) params.append('type', type);
    if (price) params.append('maxPrice', price);
    
    window.location.href = `imoveis.html?${params.toString()}`;
}

// ============================================
// SEARCH RESULTS PAGE
// ============================================

async function loadSearchResults() {
    const urlParams = new URLSearchParams(window.location.search);
    const filters = {
        type: urlParams.get('type') || '',
        location: urlParams.get('location') || '',
        maxPrice: urlParams.get('maxPrice') || ''
    };
    
    if (document.getElementById('filterType')) {
        document.getElementById('filterType').value = filters.type;
    }
    if (document.getElementById('filterLocation')) {
        document.getElementById('filterLocation').value = filters.location;
    }
    if (document.getElementById('filterMaxPrice')) {
        document.getElementById('filterMaxPrice').value = filters.maxPrice;
    }
    
    await applyFilters();
}

async function applyFilters() {
    const filters = {};
    
    const type = document.getElementById('filterType')?.value;
    const location = document.getElementById('filterLocation')?.value;
    const maxPrice = document.getElementById('filterMaxPrice')?.value;
    
    if (type) filters.type = type;
    if (location) filters.location = location;
    if (maxPrice) filters.maxPrice = maxPrice;
    
    try {
        const response = await propertiesAPI.getAll(filters);
        displaySearchResults(response.data);
    } catch (error) {
        console.error('Erro ao buscar imóveis:', error);
        displaySearchResults([]);
    }
}

function displaySearchResults(properties) {
    const container = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    
    if (!container) return;
    
    if (properties.length === 0) {
        container.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    container.innerHTML = properties.map(property => {
        const mainImage = getImageUrl(property.images && property.images[0]);
        
        return `
        <div class="property-card" onclick="window.location.href='imovel.html?id=${property._id}'">
            <div class="property-image" style="background-image: url('${mainImage}')">
                <span class="property-badge">Venda</span>
            </div>
            <div class="property-info">
                <h3 class="property-title">${property.title}</h3>
                <div class="property-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${property.location}
                </div>
                <div class="property-details">
                    <div class="property-detail-item">
                        <i class="fas fa-bed"></i> ${property.bedrooms}
                    </div>
                    <div class="property-detail-item">
                        <i class="fas fa-bath"></i> ${property.bathrooms}
                    </div>
                    <div class="property-detail-item">
                        <i class="fas fa-car"></i> ${property.garages}
                    </div>
                </div>
                <div class="property-price">${formatPrice(property.price)}</div>
            </div>
        </div>
    `;
    }).join('');
}

// ============================================
// PROPERTY DETAIL PAGE
// ============================================

async function loadPropertyDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (!propertyId) {
        // Se não tiver ID, volta pra lista
        // window.location.href = 'imoveis.html'; 
        return;
    }
    
    try {
        const response = await propertiesAPI.getById(propertyId);
        const property = response.data;
        
        document.title = `${property.title} - VISION`;
        
        // Gallery
        const gallery = document.getElementById('propertyGallery');
        if (gallery) {
            const mainImage = getImageUrl(property.images && property.images[0], '1200x500');
            gallery.style.backgroundImage = `url('${mainImage}')`;
            
            if (property.images && property.images.length > 1) {
                gallery.innerHTML = `<div style="position: absolute; bottom: 20px; right: 20px; background: rgba(0,0,0,0.7); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600;">
                    <i class="fas fa-images"></i> ${property.images.length} fotos
                </div>`;
            }
        }
        
        if (document.getElementById('propertyTitle')) {
            document.getElementById('propertyTitle').textContent = property.title;
        }
        if (document.getElementById('propertyLocation')) {
            document.getElementById('propertyLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${property.location}`;
        }
        if (document.getElementById('propertyPrice')) {
            document.getElementById('propertyPrice').textContent = formatPrice(property.price);
        }
        
        const features = document.getElementById('propertyFeatures');
        if (features) {
            features.innerHTML = `
                <div class="feature-item-detail">
                    <div class="feature-icon-detail"><i class="fas fa-ruler-combined"></i></div>
                    <div class="feature-value-detail">${property.area}m²</div>
                    <div class="feature-label-detail">Área</div>
                </div>
                <div class="feature-item-detail">
                    <div class="feature-icon-detail"><i class="fas fa-bed"></i></div>
                    <div class="feature-value-detail">${property.bedrooms}</div>
                    <div class="feature-label-detail">Quartos</div>
                </div>
                <div class="feature-item-detail">
                    <div class="feature-icon-detail"><i class="fas fa-bath"></i></div>
                    <div class="feature-value-detail">${property.bathrooms}</div>
                    <div class="feature-label-detail">Banheiros</div>
                </div>
                <div class="feature-item-detail">
                    <div class="feature-icon-detail"><i class="fas fa-car"></i></div>
                    <div class="feature-value-detail">${property.garages}</div>
                    <div class="feature-label-detail">Vagas</div>
                </div>
            `;
        }
        
        if (document.getElementById('propertyDescription')) {
            document.getElementById('propertyDescription').textContent = property.description;
        }
        
        window.currentPropertyId = property._id;
        window.currentPropertyTitle = property.title;
        
    } catch (error) {
        console.error('Erro ao carregar imóvel:', error);
    }
}

// ============================================
// INTEREST MODAL
// ============================================

function openInterestModal() {
    const modal = document.getElementById('interestModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeInterestModal() {
    const modal = document.getElementById('interestModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('interestForm')?.reset();
    }
}

async function submitInterest(event) {
    event.preventDefault();
    
    const appointmentData = {
        propertyId: window.currentPropertyId,
        clientName: document.getElementById('clientName').value,
        clientPhone: document.getElementById('clientPhone').value,
        clientEmail: document.getElementById('clientEmail').value || '',
        clientMessage: document.getElementById('clientMessage').value || ''
    };
    
    try {
        await appointmentsAPI.create(appointmentData);
        
        alert('✅ Interesse cadastrado com sucesso!\n\nEntraremos em contato em breve.');
        closeInterestModal();
        
        const whatsappMsg = `Olá! Tenho interesse no imóvel: ${window.currentPropertyTitle}`;
        window.open(`https://wa.me/553497683827?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
        
    } catch (error) {
        console.error('Erro ao cadastrar interesse:', error);
        alert('❌ Erro ao cadastrar interesse. Tente novamente.');
    }
}

// Fecha o modal se clicar fora dele
document.addEventListener('click', function(event) {
    const modal = document.getElementById('interestModal');
    if (modal && event.target === modal) {
        closeInterestModal();
    }
});