// --- Seletores do DOM (Todos juntos no início) ---
const apiForm = document.getElementById('apiForm');
const platformNameInput = document.getElementById('platformName');
const resultsContainer = document.getElementById('resultsContainer');
const submitButton = document.getElementById('submitButton');
const paginationContainer = document.getElementById('pagination-container');
const modalOverlay = document.getElementById('modal-overlay');
const userModal = document.getElementById('user-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalContent = document.getElementById('modal-content');

// Seletores para a funcionalidade de ver/esconder a API Key
const apiKeyInput = document.getElementById('apiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const eyeOpenIcon = document.getElementById('eye-open');
const eyeClosedIcon = document.getElementById('eye-closed');


// Função de Delete
const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
const listView = document.getElementById('listView');
const deleteView = document.getElementById('deleteView');
const deleteResultsContainer = document.getElementById('deleteResultsContainer');
const deletePaginationContainer = document.getElementById('deletePaginationContainer');
const pageTitle = document.querySelector('.container h2');


// --- Variáveis de Estado ---
let currentApiKey = '';
let currentPlatform = '';
let apiPaginationUrls = { next: null, prev: null };
let fullUserList = [];
let clientCurrentPage = 1;
const CLIENT_PAGE_SIZE = 12;
let fullDeletableUserList = [];
let clientDeletableCurrentPage = 1;


// --- Lógica Principal / Event Listeners (Todos juntos) ---

// Evento de submit do formulário principal (MODIFICADO)
apiForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    currentApiKey = apiKeyInput.value.trim();
    currentPlatform = platformNameInput.value.trim();
    if (!currentPlatform || !currentApiKey) return;

    // Verifica qual view está ativa para chamar a função correta
    if (!deleteView.classList.contains('hidden')) {
        clientDeletableCurrentPage = 1;
        fetchDeletableUsers({ platformName: currentPlatform, apiKey: currentApiKey });
    } else {
        clientCurrentPage = 1;
        fetchUsersFromApi({ platformName: currentPlatform, apiKey: currentApiKey });
    }
});

// Gerencia a troca de abas (Listar / Deletar)
sidebarLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const isDeleteView = link.textContent.includes('Deletar');

        if (isDeleteView) {
            listView.classList.add('hidden');
            deleteView.classList.remove('hidden');
            pageTitle.textContent = 'Deletar Usuários Inativos';
            submitButton.textContent = 'Buscar Usuários para Deletar';
        } else {
            deleteView.classList.add('hidden');
            listView.classList.remove('hidden');
            pageTitle.textContent = 'Consulta de Usuários - Cademi';
            submitButton.textContent = 'Consultar Usuários';
        }
    });
});

// Evento para o botão de ver/esconder a API Key
toggleApiKeyBtn.addEventListener('click', () => {
    // Verifica o tipo atual do input
    const isPassword = apiKeyInput.type === 'password';

    // Alterna o tipo do input
    apiKeyInput.type = isPassword ? 'text' : 'password';

    // Alterna a visibilidade dos ícones
    eyeOpenIcon.classList.toggle('hidden', isPassword);
    eyeClosedIcon.classList.toggle('hidden', !isPassword);
});

// Evento para os cliques na paginação
paginationContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.page-btn');
    if (!target || target.disabled) return;
    const action = target.dataset.action;
    const totalClientPages = Math.ceil(fullUserList.length / CLIENT_PAGE_SIZE);
    if (action === 'prev') {
        if (clientCurrentPage > 1) { clientCurrentPage--; renderClientPage(); }
    } else if (action === 'next') {
        if (clientCurrentPage < totalClientPages) { clientCurrentPage++; renderClientPage(); }
    } else if (action === 'page') {
        const page = parseInt(target.dataset.page, 10);
        if (page !== clientCurrentPage) { clientCurrentPage = page; renderClientPage(); }
    }
});

// Evento para os cliques na paginação da tela de DELEÇÃO
deletePaginationContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.page-btn');
    if (!target || target.disabled) return;
    const action = target.dataset.action;
    const totalClientPages = Math.ceil(fullDeletableUserList.length / CLIENT_PAGE_SIZE);

    if (action === 'prev') {
        if (clientDeletableCurrentPage > 1) { clientDeletableCurrentPage--; renderDeletableClientPage(); }
    } else if (action === 'next') {
        if (clientDeletableCurrentPage < totalClientPages) { clientDeletableCurrentPage++; renderDeletableClientPage(); }
    } else if (action === 'page') {
        const page = parseInt(target.dataset.page, 10);
        if (page !== clientDeletableCurrentPage) { clientDeletableCurrentPage = page; renderDeletableClientPage(); }
    }
});

// Evento para o clique no botão de "editar" (ver acessos) na tabela
resultsContainer.addEventListener('click', (event) => {
    const editButton = event.target.closest('.edit-btn');
    if (editButton) {
        const userEmail = editButton.dataset.email;
        if (userEmail) { showUserAccessModal(userEmail); }
    }
});

// Eventos para fechar o modal
modalCloseBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    userModal.classList.add('hidden');
});

modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
        modalOverlay.classList.add('hidden');
        userModal.classList.add('hidden');
    }
});


// --- Funções Auxiliares (Todas no final) ---

async function fetchUsersFromApi({ platformName, apiKey }) {
    resultsContainer.innerHTML = `<div class="feedback"><div class="loader"></div>Buscando todos os usuários. Isso pode levar um momento...</div>`;
    submitButton.disabled = true;
    paginationContainer.innerHTML = '';

    try {
        const response = await fetch('http://localhost:3000/api/users/all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platformName, apiKey })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}`);
        }

        const responseData = await response.json();
        fullUserList = responseData || [];
        renderClientPage();

    } catch (error) {
        resultsContainer.innerHTML = `<div class="feedback error"><strong>Falha na requisição.</strong><br><small>${error.message}</small></div>`;
    } finally {
        submitButton.disabled = false;
    }
}

function renderClientPage() {
    const totalClientPages = Math.ceil(fullUserList.length / CLIENT_PAGE_SIZE);
    if (totalClientPages > 0 && clientCurrentPage > totalClientPages) {
        clientCurrentPage = totalClientPages;
    }
    const start = (clientCurrentPage - 1) * CLIENT_PAGE_SIZE;
    const end = start + CLIENT_PAGE_SIZE;
    const usersToDisplay = fullUserList.slice(start, end);
    displayUsersTable(usersToDisplay);
    renderPaginationControls(clientCurrentPage, totalClientPages);
}

function renderPaginationControls(currentPage, totalPages) {
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    let html = '';
    const maxVisibleButtons = 7;
    html += `<button class="page-btn" data-action="prev" ${currentPage === 1 ? 'disabled' : ''}>&larr;</button>`;
    if (totalPages <= maxVisibleButtons) {
        for (let i = 1; i <= totalPages; i++) { html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-action="page" data-page="${i}">${i}</button>`; }
    } else {
        let pages = [1];
        let start = Math.max(2, currentPage - 1), end = Math.min(totalPages - 1, currentPage + 1);
        if (currentPage > 3) pages.push('...');
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        pages = [...new Set(pages)];
        pages.forEach(p => {
            if (p === '...') { html += `<span class="page-ellipsis">...</span>`; }
            else { html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-action="page" data-page="${p}">${p}</button>`; }
        });
    }
    html += `<button class="page-btn" data-action="next" ${currentPage === totalPages ? 'disabled' : ''}>&rarr;</button>`;
    paginationContainer.innerHTML = html;
}

async function showUserAccessModal(userEmail) {
    modalOverlay.classList.remove('hidden');
    userModal.classList.remove('hidden');
    modalContent.innerHTML = '<div class="loader"></div>';
    try {
        const response = await fetch('http://localhost:3000/api/user-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platformName: currentPlatform, apiKey: currentApiKey, userEmail: userEmail })
        });
        if (!response.ok) throw new Error((await response.json()).error);
        const responseData = await response.json();
        populateModal(responseData.data);
    } catch (error) {
        modalContent.innerHTML = `<div class="feedback error">${error.message}</div>`;
    }
}

function displayUsersTable(users) {
    if (!users || users.length === 0) {
        resultsContainer.innerHTML = `<div class="feedback">Nenhum usuário encontrado.</div>`;
        paginationContainer.innerHTML = '';
        return;
    }
    let tableHTML = `
        <table>
            <thead><tr><th>Nome</th><th>Email</th><th>Celular</th><th>Último Acesso</th><th>Ações</th></tr></thead>
            <tbody>`;
    users.forEach(user => {
        // A MUDANÇA ACONTECE AQUI
        const ultimoAcesso = formatarDataRelativa(user.ultimo_acesso_em);

        tableHTML += `
            <tr>
                <td>${user.nome || ''}</td>
                <td>${user.email || ''}</td>
                <td>${user.celular || 'Não informado'}</td>
                <td>${ultimoAcesso}</td>
                <td><button class="edit-btn" data-email="${user.email}" title="Ver Acessos de ${user.nome}"><i class="fa-solid fa-pen-to-square"></i></button></td>
            </tr>`;
    });
    tableHTML += `</tbody></table>`;
    resultsContainer.innerHTML = tableHTML;
}

/**
 * Formata uma data para exibição relativa (Hoje, Ontem, Há X dias, Há X meses).
 * @param {string | null} dataString A data em formato de string (ISO 8601).
 * @returns {string} A data formatada de forma relativa.
 */
function formatarDataRelativa(dataString) {
    // Se a data não existir, retorna 'Nunca'
    if (!dataString) {
        return 'Nunca';
    }

    const agora = new Date();
    const dataAcesso = new Date(dataString);

    // Calcula a diferença em milissegundos
    const diferencaMs = agora.getTime() - dataAcesso.getTime();

    // Converte a diferença para dias (1 dia = 24 * 60 * 60 * 1000 milissegundos)
    const diferencaDias = Math.floor(diferencaMs / 86400000);

    // Lógica de exibição baseada no número de dias
    if (diferencaDias < 0) {
        return 'Em breve'; // Caso a data seja no futuro
    }
    if (diferencaDias === 0) {
        return 'Hoje';
    }
    if (diferencaDias === 1) {
        return 'Ontem';
    }
    if (diferencaDias <= 30) {
        return `Há ${diferencaDias} dias`;
    }

    // Se for mais de 30 dias, exibe em meses
    const diferencaMeses = Math.floor(diferencaDias / 30);

    if (diferencaMeses === 1) {
        return 'Há 1 mês';
    }

    return `Há ${diferencaMeses} meses`;
}

function populateModal(data) {
    const user = data.usuario;
    const accesses = data.acesso;
    const userDetails = `
        <div id="modal-user-details">
            <h2>${user.nome}</h2>
            <p><strong>Email:</strong> ${user.email || 'Não informado'}</p>
            <p><strong>Celular:</strong> ${user.celular || 'Não informado'}</p>
            <p><strong>Documento:</strong> ${user.doc || 'Não informado'}</p>
            <p><strong>Data de Criação:</strong> ${new Date(user.criado_em).toLocaleDateString('pt-BR')}</p>
        </div>
    `;
    let coursesTable = `
        <div id="modal-courses-table">
            <h3>Cursos e Acessos</h3>
            <table><thead><tr><th>ID</th><th>Nome do Produto</th><th>Encerrado</th></tr></thead><tbody>`;
    if (accesses && accesses.length > 0) {
        accesses.forEach(access => {
            coursesTable += `<tr><td>${access.produto.id}</td><td>${access.produto.nome}</td><td>${access.encerrado ? 'Sim' : 'Não'}</td></tr>`;
        });
    } else {
        coursesTable += `<tr><td colspan="3">Nenhum acesso encontrado.</td></tr>`;
    }
    coursesTable += `</tbody></table></div>`;
    modalContent.innerHTML = userDetails + coursesTable;
}

// --- NOVAS FUNÇÕES PARA A LÓGICA DE DELEÇÃO ---

async function fetchDeletableUsers({ platformName, apiKey }) {
    deleteResultsContainer.innerHTML = `<div class="feedback"><div class="loader"></div>Buscando usuários inativos. Isso pode demorar vários minutos...</div>`;
    submitButton.disabled = true;
    deletePaginationContainer.innerHTML = '';

    try {
        const response = await fetch('http://localhost:3000/api/users/deletable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platformName, apiKey })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}`);
        }

        const responseData = await response.json();
        fullDeletableUserList = responseData || [];
        renderDeletableClientPage();

    } catch (error) {
        deleteResultsContainer.innerHTML = `<div class="feedback error"><strong>Falha na requisição.</strong><br><small>${error.message}</small></div>`;
    } finally {
        submitButton.disabled = false;
    }
}

function renderDeletableClientPage() {
    const totalClientPages = Math.ceil(fullDeletableUserList.length / CLIENT_PAGE_SIZE);
    if (totalClientPages > 0 && clientDeletableCurrentPage > totalClientPages) {
        clientDeletableCurrentPage = totalClientPages;
    }
    const start = (clientDeletableCurrentPage - 1) * CLIENT_PAGE_SIZE;
    const end = start + CLIENT_PAGE_SIZE;
    const usersToDisplay = fullDeletableUserList.slice(start, end);
    displayDeletableUsersTable(usersToDisplay);
    // Note: A paginação para a lista de exclusão será adicionada em um passo futuro se necessário.
    renderDeletablePaginationControls(clientDeletableCurrentPage, totalClientPages);
}

function displayDeletableUsersTable(users) {
    if (!users || users.length === 0) {
        deleteResultsContainer.innerHTML = `<div class="feedback">Nenhum usuário com todos os acessos encerrados foi encontrado.</div>`;
        deletePaginationContainer.innerHTML = '';
        return;
    }
    let tableHTML = `
        <table>
            <thead><tr><th>Nome</th><th>Email</th><th>Último Acesso</th><th>Ações</th></tr></thead>
            <tbody>`;
    users.forEach(user => {
        const ultimoAcesso = formatarDataRelativa(user.ultimo_acesso_em);
        tableHTML += `
            <tr>
                <td>${user.nome || ''}</td>
                <td>${user.email || ''}</td>
                <td>${ultimoAcesso}</td>
                <td>
                    <button class="delete-btn" data-email="${user.email}" title="Ver Acessos de ${user.nome}">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="delete-btn" data-email="${user.email}" title="Ver Acessos de ${user.nome}">    
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
    tableHTML += `</tbody></table>`;
    deleteResultsContainer.innerHTML = tableHTML;
}

function renderDeletablePaginationControls(currentPage, totalPages) {
    if (totalPages <= 1) {
        deletePaginationContainer.innerHTML = '';
        return;
    }
    let html = '';
    const maxVisibleButtons = 7;
    html += `<button class="page-btn" data-action="prev" ${currentPage === 1 ? 'disabled' : ''}>&larr;</button>`;
    if (totalPages <= maxVisibleButtons) {
        for (let i = 1; i <= totalPages; i++) { html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-action="page" data-page="${i}">${i}</button>`; }
    } else {
        let pages = [1];
        let start = Math.max(2, currentPage - 1), end = Math.min(totalPages - 1, currentPage + 1);
        if (currentPage > 3) pages.push('...');
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        pages = [...new Set(pages)];
        pages.forEach(p => {
            if (p === '...') { html += `<span class="page-ellipsis">...</span>`; }
            else { html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-action="page" data-page="${p}">${p}</button>`; }
        });
    }
    html += `<button class="page-btn" data-action="next" ${currentPage === totalPages ? 'disabled' : ''}>&rarr;</button>`;
    deletePaginationContainer.innerHTML = html;
}