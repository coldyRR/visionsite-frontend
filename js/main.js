// ============================================
// VISION IMÓVEIS - MAIN.JS (Versão Galeria + Busca)
// ============================================

const API_BASE_URL = "https://visionsite-backend.onrender.com";
let currentPropertyImages = [];
let currentImageIndex = 0;

// --- HELPER: Imagens ---
function getImageUrl(imagePath, placeholderSize = '400x280') {
    if (!imagePath) return `https://via.placeholder.com/${placeholderSize}?text=Sem+Imagem`;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
}

// --- HELPER: Preço ---
function formatPrice(value) {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Menu Mobile
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    }
});

// ============================================
// CARROSSEL DE IMAGENS (GALERIA)
// ============================================
function updateGalleryDisplay() {
    const gallery = document.getElementById('propertyGallery');
    const counter = document.getElementById('imageCounter');
    
    if (gallery && currentPropertyImages.length > 0) {
        const imageUrl = getImageUrl(currentPropertyImages[currentImageIndex], '1200x500');
        gallery.style.backgroundImage = `url('${imageUrl}')`;
        gallery.style.transition = "background-image 0.3s ease-in-out";
        
        if (counter) {
            counter.innerHTML = `<i class="fas fa-camera"></i> ${currentImageIndex + 1} / ${currentPropertyImages.length}`;
        }
    }
}

function nextImage() {
    if (currentPropertyImages.length <= 1) return;
    currentImageIndex++;
    if (currentImageIndex >= currentPropertyImages.length) currentImageIndex = 0;
    updateGalleryDisplay();
}

function prevImage() {
    if (currentPropertyImages.length <= 1) return;
    currentImageIndex--;
    if (currentImageIndex < 0) currentImageIndex = currentPropertyImages.length - 1;
    updateGalleryDisplay();
}

// ============================================
// DETALHES DO IMÓVEL
// ============================================
async function loadPropertyDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (!propertyId) return; // Se não tiver ID, não faz nada (ou redireciona)
    
    try {
        const response = await propertiesAPI.getById(propertyId);
        const property = response.data;
        
        document.title = `${property.title} - VISION`;
        window.currentPropertyId = property._id;
        window.currentPropertyTitle = property.title;

        // --- CONFIGURAÇÃO DA GALERIA ---
        const gallery = document.getElementById('propertyGallery');
        if (gallery) {
            currentPropertyImages = property.images || [];
            currentImageIndex = 0;

            // Injeta botões de navegação se tiver mais de 1 foto
            let controlsHTML = '';
            if (currentPropertyImages.length > 1) {
                controlsHTML = `
                    <button onclick="prevImage()" style="position:absolute; left:20px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.6); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:20px; z-index:10;"><i class="fas fa-chevron-left"></i></button>
                    <button onclick="nextImage()" style="position:absolute; right:20px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.6); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:20px; z-index:10;"><i class="fas fa-chevron-right"></i></button>
                `;
            }

            // Contador de fotos
            const counterHTML = `
                <div id="imageCounter" style="position: absolute; bottom: 20px; right: 20px; background: rgba(0,0,0,0.7); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600;">
                    <i class="fas fa-camera"></i> 1 / ${currentPropertyImages.length || 0}
                </div>
            `;

            gallery.innerHTML = controlsHTML + counterHTML;
            updateGalleryDisplay(); // Carrega a primeira foto
        }
        
        // Preencher Textos
        if (document.getElementById('propertyTitle')) document.getElementById('propertyTitle').textContent = property.title;
        if (document.getElementById('propertyLocation')) document.getElementById('propertyLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${property.location}`;
        if (document.getElementById('propertyPrice')) document.getElementById('propertyPrice').textContent = formatPrice(property.price);
        if (document.getElementById('propertyDescription')) document.getElementById('propertyDescription').textContent = property.description;
        
        // Preencher Características
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

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
    }
}

// ============================================
// CARREGAR DESTAQUES (HOME)
// ============================================
async function loadFeaturedProperties() {
    const container = document.getElementById('featuredProperties');
    if (!container) return;
    try {
        const response = await propertiesAPI.getAll();
        const properties = response.data.slice(0, 6);
        
        if (properties.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:40px; color:#888;">Nenhum imóvel encontrado.</p>';
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
                    <div class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</div>
                    <div class="property-details">
                        <div class="property-detail-item"><i class="fas fa-bed"></i> ${property.bedrooms}</div>
                        <div class="property-detail-item"><i class="fas fa-bath"></i> ${property.bathrooms}</div>
                        <div class="property-detail-item"><i class="fas fa-car"></i> ${property.garages}</div>
                    </div>
                    <div class="property-price">${formatPrice(property.price)}</div>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        container.innerHTML = '<p style="text-align:center;">Erro ao carregar imóveis.</p>';
    }
}

// ============================================
// BUSCA E FILTROS
// ============================================
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

async function loadSearchResults() {
    const urlParams = new URLSearchParams(window.location.search);
    const filters = {
        type: urlParams.get('type'),
        location: urlParams.get('location'),
        maxPrice: urlParams.get('maxPrice')
    };
    
    // Preenche inputs
    if(filters.type && document.getElementById('filterType')) document.getElementById('filterType').value = filters.type;
    if(filters.location && document.getElementById('filterLocation')) document.getElementById('filterLocation').value = filters.location;
    if(filters.maxPrice && document.getElementById('filterMaxPrice')) document.getElementById('filterMaxPrice').value = filters.maxPrice;

    try {
        const response = await propertiesAPI.getAll(filters);
        displaySearchResults(response.data);
    } catch (error) {
        displaySearchResults([]);
    }
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
        displaySearchResults([]);
    }
}

function displaySearchResults(properties) {
    const container = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    if (!container) return;
    
    if (!properties || properties.length === 0) {
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
                <div class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</div>
                <div class="property-details">
                    <div class="property-detail-item"><i class="fas fa-bed"></i> ${property.bedrooms}</div>
                    <div class="property-detail-item"><i class="fas fa-bath"></i> ${property.bathrooms}</div>
                    <div class="property-detail-item"><i class="fas fa-car"></i> ${property.garages}</div>
                </div>
                <div class="property-price">${formatPrice(property.price)}</div>
            </div>
        </div>`;
    }).join('');
}

// ============================================
// MODAL DE INTERESSE
// ============================================
function openInterestModal() {
    const modal = document.getElementById('interestModal');
    if (modal) modal.classList.add('active');
}

function closeInterestModal() {
    const modal = document.getElementById('interestModal');
    if (modal) modal.classList.remove('active');
}

async function submitInterest(event) {
    event.preventDefault();
    const data = {
        propertyId: window.currentPropertyId,
        clientName: document.getElementById('clientName').value,
        clientPhone: document.getElementById('clientPhone').value,
        clientEmail: document.getElementById('clientEmail').value || '',
        clientMessage: document.getElementById('clientMessage').value || ''
    };
    
    try {
        await appointmentsAPI.create(data);
        alert('✅ Interesse enviado com sucesso!');
        closeInterestModal();
        const wpp = `Olá! Tenho interesse no imóvel: ${window.currentPropertyTitle}`;
        window.open(`https://wa.me/553497683827?text=${encodeURIComponent(wpp)}`, '_blank');
    } catch (error) {
        console.error(error);
        alert('❌ Erro ao enviar. Tente novamente.');
    }
}
document.addEventListener('click', (e) => {
    const m = document.getElementById('interestModal');
    if (m && e.target === m) closeInterestModal();
});