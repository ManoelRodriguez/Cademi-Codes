(async function () {
    'use strict';

    const SAVE_DELAY_MS = 3000;

    //--------------LEMBRAR DE ALTERAR O CAMINHO--------------
    const UPDATE_URL = 'https://curso.jucanores.com/office/vitrine/set_ordem';

    console.log('--- Iniciando script de reordenação de MÓDULOS + AULAS ---');

    // 1. Seleciona todos os módulos
    const allModules = Array.from(document.querySelectorAll('.panel.produto_secao_list'));
    const modulesContainer = allModules[0]?.parentNode;
    if (!modulesContainer) {
        console.error('ERRO: Não foi possível encontrar o contêiner pai dos módulos.');
        return;
    }

    // 2. Ordena os módulos com base no número no início do título (sem número vai para o fim)
    allModules.sort((a, b) => {
        const titleA = a.querySelector('.inline-edit')?.textContent.trim() || '';
        const titleB = b.querySelector('.inline-edit')?.textContent.trim() || '';
        const numA = parseInt(titleA.match(/^\d+/), 10);
        const numB = parseInt(titleB.match(/^\d+/), 10);

        if (isNaN(numA) && isNaN(numB)) return 0;
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
    });

    // 3. Reanexa os módulos ao DOM na nova ordem
    allModules.forEach(module => modulesContainer.appendChild(module));
    console.log('Módulos reordenados visualmente.');

    // 4. Salva a nova ordem dos módulos no servidor
    try {
        const formData = new URLSearchParams();
        formData.append('model', 'produto_secao');
        allModules.forEach((mod, index) => {
            const id = mod.getAttribute('data-id');
            formData.append(`itens[${index}][id]`, id);
            formData.append(`itens[${index}][ordem]`, index + 1);
        });

        console.log('Enviando ordem dos módulos para o servidor...');
        const response = await fetch(UPDATE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData.toString()
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status} ao salvar módulos.`);
        }

        console.log('%cOrdem dos módulos salva com sucesso.', 'color: green; font-weight: bold;');
    } catch (e) {
        console.error('Erro ao salvar ordem dos módulos:', e);
        alert('Erro ao salvar a ordem dos módulos. Verifique o console.');
        return;
    }

    // 5. Ordena os itens (aulas) dentro de cada módulo
    for (let moduleIndex = 0; moduleIndex < allModules.length; moduleIndex++) {
        const moduleContainer = allModules[moduleIndex];
        const modelId = moduleContainer.getAttribute('data-id');
        const sortableContainer = moduleContainer.querySelector('.sortable.ui-sortable');
        if (!sortableContainer) continue;

        const items = Array.from(sortableContainer.querySelectorAll('.row-list.produto_item_list'));
        if (items.length === 0) continue;

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

            if (isNaN(numA) && isNaN(numB)) return 0;
            if (isNaN(numA)) return 1;
            if (isNaN(numB)) return -1;
            return numA - numB;
        });

        items.forEach(item => sortableContainer.appendChild(item));
        console.log(`Aulas reordenadas visualmente no módulo ID ${modelId}.`);

        try {
            const formData = new URLSearchParams();
            formData.append('model', 'produto_item');
            formData.append('model_id', modelId);
            const finalItems = sortableContainer.querySelectorAll('.row-list.produto_item_list');
            finalItems.forEach((item, index) => {
                formData.append(`itens[${index}][id]`, item.getAttribute('data-id'));
                formData.append(`itens[${index}][ordem]`, index + 1);
            });

            const response = await fetch(UPDATE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status} ao salvar aulas do módulo ${modelId}`);
            }

            console.log(`Módulo ID ${modelId} salvo com sucesso.`);
        } catch (e) {
            console.error(`Erro ao salvar itens do módulo ID ${modelId}:`, e);
            alert(`Erro ao salvar aulas no módulo ID ${modelId}.`);
            return;
        }

        if (moduleIndex < allModules.length - 1) {
            console.log(`Aguardando ${SAVE_DELAY_MS / 1000}s antes do próximo módulo...`);
            await new Promise(res => setTimeout(res, SAVE_DELAY_MS));
        }
    }

    console.log('%c--- Reordenação de módulos e aulas concluída com sucesso! ---', 'color: green; font-weight: bold;');
    alert('Reordenação de módulos e aulas finalizada com sucesso!');
})();