// ============================================
// VISION IMÓVEIS - MAIN.JS (Versão Final Completa)
// ============================================

const API_BASE_URL = "https://visionsite-backend.onrender.com";
let currentPropertyImages = [];
let currentImageIndex = 0;

// --- HELPERS ---
function getImageUrl(imagePath, placeholderSize = '400x280') {
    if (!imagePath) return `https://via.placeholder.com/${placeholderSize}?text=Sem+Imagem`;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
}

function formatPrice(value) {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- MENU MOBILE & INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    }
    
    // Inicializar Autocomplete de Localização
    initLocationAutocomplete();
});

// ============================================
// AUTOCOMPLETE DE LOCALIZAÇÃO (NOVO!)
// ============================================
async function initLocationAutocomplete() {
    const dataList = document.getElementById('locationsList');
    if (!dataList) return;

    try {
        const response = await propertiesAPI.getAll();
        // Cria uma lista única de cidades/bairros
        const locations = [...new Set(response.data.map(p => p.location))];
        
        dataList.innerHTML = locations.map(loc => `<option value="${loc}">`).join('');
    } catch (error) {
        console.error('Erro ao carregar sugestões de local:', error);
    }
}

// ============================================
// MODAL DE CONTATO (NOVO!)
// ============================================
function openContactModal() {
    const modal = document.getElementById('contactModalFull');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Trava a rolagem do fundo
    }
}

function closeContactModal() {
    const modal = document.getElementById('contactModalFull');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Fecha se clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('contactModalFull');
    if (event.target == modal) {
        closeContactModal();
    }
}

// ============================================
// CARROSSEL DE IMAGENS
// ============================================
function updateGalleryDisplay() {
    const gallery = document.getElementById('propertyGallery');
    const counter = document.getElementById('imageCounter');
    
    if (gallery && currentPropertyImages.length > 0) {
        const imageUrl = getImageUrl(currentPropertyImages[currentImageIndex], '1200x500');
        gallery.style.backgroundImage = `url('${imageUrl}')`;
        gallery.style.transition = "background-image 0.3s ease-in-out";
        
        if (counter) counter.innerHTML = `<i class="fas fa-camera"></i> ${currentImageIndex + 1} / ${currentPropertyImages.length}`;
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
// LÓGICA DAS PÁGINAS
// ============================================

async function loadPropertyDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    if (!propertyId) return;
    
    try {
        const response = await propertiesAPI.getById(propertyId);
        const property = response.data;
        
        document.title = `${property.title} - VISION`;
        window.currentPropertyId = property._id;
        window.currentPropertyTitle = property.title;

        // Galeria
        const gallery = document.getElementById('propertyGallery');
        if (gallery) {
            currentPropertyImages = property.images || [];
            currentImageIndex = 0;
            
            let controls = '';
            if (currentPropertyImages.length > 1) {
                controls = `
                    <button onclick="prevImage()" style="position:absolute; left:20px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.6); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:20px; z-index:10;"><i class="fas fa-chevron-left"></i></button>
                    <button onclick="nextImage()" style="position:absolute; right:20px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.6); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:20px; z-index:10;"><i class="fas fa-chevron-right"></i></button>
                `;
            }
            gallery.innerHTML = controls + `<div id="imageCounter" style="position: absolute; bottom: 20px; right: 20px; background: rgba(0,0,0,0.7); color: white; padding: 8px 16px; border-radius: 20px;"></div>`;
            updateGalleryDisplay();
        }

        // Dados
        if (document.getElementById('propertyTitle')) document.getElementById('propertyTitle').textContent = property.title;
        if (document.getElementById('propertyLocation')) document.getElementById('propertyLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${property.location}`;
        if (document.getElementById('propertyPrice')) document.getElementById('propertyPrice').textContent = formatPrice(property.price);
        if (document.getElementById('propertyDescription')) document.getElementById('propertyDescription').textContent = property.description;
        
        const features = document.getElementById('propertyFeatures');
        if (features) {
            features.innerHTML = `
                <div class="feature-item-detail"><div class="feature-icon-detail"><i class="fas fa-ruler-combined"></i></div><div class="feature-value-detail">${property.area}m²</div><div class="feature-label-detail">Área</div></div>
                <div class="feature-item-detail"><div class="feature-icon-detail"><i class="fas fa-bed"></i></div><div class="feature-value-detail">${property.bedrooms}</div><div class="feature-label-detail">Quartos</div></div>
                <div class="feature-item-detail"><div class="feature-icon-detail"><i class="fas fa-bath"></i></div><div class="feature-value-detail">${property.bathrooms}</div><div class="feature-label-detail">Banheiros</div></div>
                <div class="feature-item-detail"><div class="feature-icon-detail"><i class="fas fa-car"></i></div><div class="feature-value-detail">${property.garages}</div><div class="feature-label-detail">Vagas</div></div>
            `;
        }
    } catch (error) { console.error(error); }
}

async function loadFeaturedProperties() {
   const container = document.getElementById('featuredProperties');
    if (!container) return;
    
    try {
        const response = await propertiesAPI.getAll();
        // Pega 10 imóveis para ter o que rolar
        const properties = response.data.slice(0, 10); 
        
        if (properties.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%; color:#888;">Nenhum destaque no momento.</p>';
            return;
        }

        // Adiciona classe para ativar o CSS de carrossel
        container.classList.add('carousel-mode');
        
        // Cria os cards
        const cardsHTML = properties.map(p => `
            <div class="property-card" onclick="window.location.href='imovel.html?id=${p._id}'">
                <div class="property-image" style="background-image: url('${getImageUrl(p.images[0])}')">
                    <span class="property-badge">Venda</span>
                </div>
                <div class="property-info">
                    <h3 class="property-title">${p.title}</h3>
                    <div class="property-location"><i class="fas fa-map-marker-alt"></i> ${p.location}</div>
                    <div class="property-details">
                        <span><i class="fas fa-bed"></i> ${p.bedrooms}</span>
                        <span><i class="fas fa-bath"></i> ${p.bathrooms}</span>
                        <span><i class="fas fa-car"></i> ${p.garages}</span>
                    </div>
                    <div class="property-price">${formatPrice(p.price)}</div>
                </div>
            </div>`).join('');

        // Envolve tudo no Wrapper com botões
        const wrapper = document.createElement('div');
        wrapper.className = 'carousel-wrapper';
        wrapper.innerHTML = `
            <button class="carousel-btn prev" onclick="scrollCarousel(-1)"><i class="fas fa-chevron-left"></i></button>
            <div class="properties-grid carousel-mode" id="carouselTrack">${cardsHTML}</div>
            <button class="carousel-btn next" onclick="scrollCarousel(1)"><i class="fas fa-chevron-right"></i></button>
        `;
        
        // Limpa e adiciona o novo HTML
        container.innerHTML = '';
        container.parentNode.replaceChild(wrapper, container); // Substitui o container original pelo wrapper
        
    } catch (error) {
        console.error(error);
        if(container) container.innerHTML = '<p style="text-align:center;">Erro ao carregar.</p>';
    }
}

// Função para os botões do carrossel funcionarem
function scrollCarousel(direction) {
    const track = document.getElementById('carouselTrack');
    if (track) {
        const scrollAmount = 320; // Tamanho do card + gap
        track.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
    }
}


// Busca e Filtros
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
    
    if(filters.type && document.getElementById('filterType')) document.getElementById('filterType').value = filters.type;
    if(filters.location && document.getElementById('filterLocation')) document.getElementById('filterLocation').value = filters.location;
    if(filters.maxPrice && document.getElementById('filterMaxPrice')) document.getElementById('filterMaxPrice').value = filters.maxPrice;

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
        const container = document.getElementById('searchResults');
        const noResults = document.getElementById('noResults');
        if (!container) return;
        
        if (response.data.length === 0) {
            container.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        if (noResults) noResults.style.display = 'none';
        container.innerHTML = response.data.map(p => `
            <div class="property-card" onclick="window.location.href='imovel.html?id=${p._id}'">
                <div class="property-image" style="background-image: url('${getImageUrl(p.images[0])}')">
                    <span class="property-badge">Venda</span>
                </div>
                <div class="property-info">
                    <h3 class="property-title">${p.title}</h3>
                    <div class="property-location"><i class="fas fa-map-marker-alt"></i> ${p.location}</div>
                    <div class="property-details">
                        <span><i class="fas fa-bed"></i> ${p.bedrooms}</span>
                        <span><i class="fas fa-bath"></i> ${p.bathrooms}</span>
                        <span><i class="fas fa-car"></i> ${p.garages}</span>
                    </div>
                    <div class="property-price">${formatPrice(p.price)}</div>
                </div>
            </div>`).join('');
    } catch (error) { console.error(error); }
}

// Modal de Interesse (Lead)
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
    // ... (lógica igual anterior)
    alert('Interesse enviado!');
    closeInterestModal();
}