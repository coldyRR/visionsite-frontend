// ============================================
// MOBILE MENU TOGGLE
// ============================================

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar) {
        sidebar.classList.toggle('mobile-active');
    }
    
    if (mainContent) {
        mainContent.classList.toggle('sidebar-open');
    }
    
    // Prevenir scroll no body quando sidebar aberta
    if (sidebar && sidebar.classList.contains('mobile-active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Fechar sidebar ao clicar fora (mobile)
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar && menuToggle) {
        if (!sidebar.contains(event.target) && 
            !menuToggle.contains(event.target) && 
            sidebar.classList.contains('mobile-active')) {
            toggleSidebar();
        }
    }
});

// Filtro de imóveis no admin (já existente, mantido)
function filterAdminProperties() {
    const searchInput = document.getElementById('adminSearchInput')?.value.toLowerCase() || '';
    const filterType = document.getElementById('adminFilterType')?.value || '';
    const filterStatus = document.getElementById('adminFilterStatus')?.value || '';
    
    const rows = document.querySelectorAll('#propertiesTableBody tr');
    
    rows.forEach(row => {
        const title = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        const location = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
        const type = row.getAttribute('data-type') || '';
        const active = row.getAttribute('data-active') || '';
        
        let showRow = true;
        
        // Filtro de busca
        if (searchInput && !title.includes(searchInput) && !location.includes(searchInput)) {
            showRow = false;
        }
        
        // Filtro de tipo
        if (filterType && type !== filterType) {
            showRow = false;
        }
        
        // Filtro de status
        if (filterStatus === 'active' && active !== 'true') {
            showRow = false;
        }
        if (filterStatus === 'inactive' && active === 'true') {
            showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

console.log('✅ Mobile menu carregado');