(async function() {
    'use strict';
    // --- CONFIGURAÇÕES ---
    const SAVE_DELAY_MS = 3000; // Pausa de 3 segundos entre o salvamento de cada módulo.
    const UPDATE_URL = 'https://4563e8.cademi.com.br/office/vitrine/set_ordem';
    console.log('--- Iniciando script de reordenação v10 (Processamento por Módulo) ---');
    // 1. Encontrar TODOS os contêineres de módulo na página.
    const allModules = document.querySelectorAll('.panel.produto_secao_list');
    if (allModules.length === 0) {
        console.error('ERRO: Nenhum módulo (`.panel.produto_secao_list`) foi encontrado na página.');
        return;
    }
    console.log(`Encontrados ${allModules.length} módulos para processar.`);
    // 2. Iniciar o loop para processar CADA módulo individualmente.
    for (let moduleIndex = 0; moduleIndex < allModules.length; moduleIndex++) {
        const moduleContainer = allModules[moduleIndex];
        const modelId = moduleContainer.getAttribute('data-id');
        console.log(`%c--- Processando Módulo ${moduleIndex + 1}/${allModules.length} (ID: ${modelId}) ---`, 'color: blue; font-weight: bold;');
        // Encontra o contêiner 'sortable' DENTRO do módulo atual.
        const sortableContainer = moduleContainer.querySelector('.sortable.ui-sortable');
        if (!sortableContainer) {
            console.warn(`AVISO: Módulo ID ${modelId} não possui um contêiner 'sortable'. Pulando...`);
            continue; // Pula para o próximo módulo
        }
        // Encontra os itens APENAS DENTRO do contêiner 'sortable' atual.
        const items = Array.from(sortableContainer.querySelectorAll('.row-list.produto_item_list'));
        if (items.length === 0) {
            console.log(`Módulo ID ${modelId} não possui itens para ordenar. Pulando...`);
            continue; // Pula para o próximo módulo
        }
        console.log(`Encontrados ${items.length} produtos neste módulo.`);
        // Ordena os itens deste módulo.
        items.sort((a, b) => {
            const idA = a.getAttribute('data-id');
            const idB = b.getAttribute('data-id');
            const titleSpanA = moduleContainer.querySelector(`.inline-edit[data-set*='"id":${idA}']`);
            const titleSpanB = moduleContainer.querySelector(`.inline-edit[data-set*='"id":${idB}']`);
            if (!titleSpanA || !titleSpanB) return 0;
            const titleA = titleSpanA.textContent.trim();
            const titleB = titleSpanB.textContent.trim();
            const numA = parseInt(titleA.match(/^\d+/), 10);
            const numB = parseInt(titleB.match(/^\d+/), 10);
            if (isNaN(numA) || isNaN(numB)) return 0;
            return numA - numB;
        });
        // Reorganiza os itens na tela DENTRO do seu contêiner correto.
        items.forEach(item => sortableContainer.appendChild(item));
        console.log('Produtos reordenados visualmente para este módulo.');
        // Tenta salvar a ordem para ESTE módulo específico.
        try {
            const formData = new URLSearchParams();
            formData.append('model', 'produto_item');
            formData.append('model_id', modelId); // Usa o ID do módulo atual!
            const finalItems = sortableContainer.querySelectorAll('.row-list.produto_item_list');
            finalItems.forEach((item, index) => {
                formData.append(`itens[${index}][id]`, item.getAttribute('data-id'));
                formData.append(`itens[${index}][ordem]`, index + 1);
            });
            console.log(`Enviando dados para o Módulo ID ${modelId}...`);
            const response = await fetch(UPDATE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData.toString()
            });
            if (!response.ok) {
                throw new Error(`O servidor respondeu com um erro: ${response.status} ${response.statusText}`);
            }
            console.log(`Módulo ID ${modelId} salvo com sucesso.`);
        } catch (e) {
            console.error(`Ocorreu um erro ao salvar o Módulo ID ${modelId}:`, e);
            alert(`O processo falhou ao salvar o Módulo ID ${modelId}. Verifique o console.`);
            // Decide se quer parar ou continuar com os outros módulos. Vamos parar por segurança.
            return;
        }
        // Pausa antes de ir para o próximo módulo.
        if (moduleIndex < allModules.length - 1) {
             console.log(`Aguardando ${SAVE_DELAY_MS / 1000} segundos antes do próximo módulo...`);
             await new Promise(res => setTimeout(res, SAVE_DELAY_MS));
        }
    }
    console.log('%c--- PROCESSO DE REORDENAÇÃO DE TODOS OS MÓDULOS FINALIZADO ---', 'color: green; font-weight: bold;');
    alert('Processo de reordenação de todos os módulos finalizado com sucesso!');
})();