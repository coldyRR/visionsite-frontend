document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Mobile Script Carregado!');

    // Seleciona os elementos
    const btn = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    // 1. Verifica se o botão existe
    if (!btn) {
        console.error('❌ ERRO: Botão .mobile-menu-toggle não encontrado no HTML!');
        return;
    }

    console.log('✅ Botão mobile encontrado. Adicionando evento de clique...');

    // 2. Adiciona o evento de clique direto pelo JS (mais seguro que onclick no HTML)
    btn.addEventListener('click', function(event) {
        event.preventDefault(); // Evita bugs de recarregamento
        event.stopPropagation(); // Garante que o clique é só do botão
        
        console.log('🔘 Botão CLICADO!');
        
        if (sidebar) {
            sidebar.classList.toggle('mobile-active');
            
            // Log para confirmar estado
            if (sidebar.classList.contains('mobile-active')) {
                console.log('📂 Sidebar: ABERTA');
            } else {
                console.log('📂 Sidebar: FECHADA');
            }
        } else {
            console.error('❌ ERRO: Sidebar não encontrada!');
        }
    });

    // 3. Fechar ao clicar fora (Mantido do seu código original)
    document.addEventListener('click', function(event) {
        if (sidebar && sidebar.classList.contains('mobile-active')) {
            if (!sidebar.contains(event.target) && !btn.contains(event.target)) {
                console.log('👋 Clicou fora, fechando sidebar...');
                sidebar.classList.remove('mobile-active');
            }
        }
    });
});