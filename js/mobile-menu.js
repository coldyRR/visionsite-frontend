// ============================================
// MOBILE MENU - VERSÃO SIMPLIFICADA
// ============================================

console.log('🔄 Carregando mobile.js...');

// Função para abrir/fechar sidebar
function toggleSidebar() {
    console.log('🔘 toggleSidebar chamado!');
    
    const sidebar = document.querySelector('.sidebar');
    
    if (!sidebar) {
        console.error('❌ Sidebar não encontrada!');
        return;
    }
    
    console.log('✅ Sidebar encontrada, toggling...');
    sidebar.classList.toggle('mobile-active');
    
    if (sidebar.classList.contains('mobile-active')) {
        console.log('✅ Sidebar ABERTA');
        document.body.style.overflow = 'hidden';
    } else {
        console.log('✅ Sidebar FECHADA');
        document.body.style.overflow = '';
    }
}

// Fechar sidebar ao clicar fora
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM carregado, configurando eventos...');
    
    document.addEventListener('click', function(event) {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        
        if (!sidebar || !menuToggle) return;
        
        // Se clicou fora da sidebar E fora do botão
        if (!sidebar.contains(event.target) && 
            !menuToggle.contains(event.target) && 
            sidebar.classList.contains('mobile-active')) {
            
            console.log('👆 Clicou fora, fechando sidebar...');
            toggleSidebar();
        }
    });
});

// Filtro de imóveis (admin)
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
        
        if (searchInput && !title.includes(searchInput) && !location.includes(searchInput)) {
            showRow = false;
        }
        
        if (filterType && type !== filterType) {
            showRow = false;
        }
        
        if (filterStatus === 'active' && active !== 'true') {
            showRow = false;
        }
        if (filterStatus === 'inactive' && active === 'true') {
            showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

console.log('✅ mobile.js carregado com sucesso!');