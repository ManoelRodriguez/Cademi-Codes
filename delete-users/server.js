// server.js (Corrigido)
const express = require('express');
const axios =require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint para buscar lista de usuários (paginado)
app.post('/api/users', async (req, res) => {
    const { platformName, apiKey, paginationUrl } = req.body;
    let targetUrl;

    if (paginationUrl) {
        targetUrl = paginationUrl;
    } else if (platformName) {
        targetUrl = `https://${platformName}.cademi.com.br/api/v1/usuario`;
    } else {
        return res.status(400).json({ error: 'É necessário fornecer platformName ou paginationUrl.' });
    }
    
    if (!apiKey) {
        return res.status(400).json({ error: 'API Key é obrigatória.' });
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data || { error: 'Erro interno no servidor proxy.' };
        res.status(status).json(message);
    }
});

// Endpoint para buscar acessos de um usuário específico
app.post('/api/user-access', async (req, res) => {
    const { platformName, apiKey, userEmail } = req.body;

    if (!platformName || !apiKey || !userEmail) {
        return res.status(400).json({ error: 'Platform Name, API Key, and User Email são obrigatórios.' });
    }

    const encodedEmail = encodeURIComponent(userEmail);
    const targetUrl = `https://${platformName}.cademi.com.br/api/v1/usuario/acesso/${encodedEmail}`;
    
    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data || { error: 'Erro interno no servidor proxy.' };
        res.status(status).json(message);
    }
});

// Endpoint que busca TODAS as páginas de usuários em loop
app.post('/api/users/all', async (req, res) => {
    const { platformName, apiKey } = req.body;

    if (!platformName || !apiKey) {
        return res.status(400).json({ error: 'Platform Name e API Key são obrigatórios.' });
    }

    try {
        let allUsers = [];
        let nextUrl = `https://${platformName}.cademi.com.br/api/v1/usuario`;

        while (nextUrl) {
            const response = await axios.get(nextUrl, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const usersFromPage = response.data.data.usuario;
            if (usersFromPage && usersFromPage.length > 0) {
                allUsers.push(...usersFromPage);
            }
            nextUrl = response.data.data.paginator.next_page_url;
            if (nextUrl) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        res.json(allUsers);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data || { error: 'Erro interno no servidor proxy.' };
        res.status(status).json(message);
    }
});


// ENDPOINT FINAL E CORRIGIDO: Processa sequencialmente respeitando o rate limit
app.post('/api/users/deletable', async (req, res) => {
    const { platformName, apiKey } = req.body;

    if (!platformName || !apiKey) {
        return res.status(400).json({ error: 'Platform Name e API Key são obrigatórios.' });
    }

    try {
        console.log('Iniciando busca por usuários deletáveis...');
        // 1. BUSCAR OS USUÁRIOS
        let allUsers = [];
        let nextUrl = `https://${platformName}.cademi.com.br/api/v1/usuario`;
        while (nextUrl) {
            const usersResponse = await axios.get(nextUrl, { headers: { 'Authorization': `Bearer ${apiKey}` } });
            const usersFromPage = usersResponse.data.data.usuario;
            if (usersFromPage && usersFromPage.length > 0) {
                allUsers.push(...usersFromPage);
            }
            nextUrl = usersResponse.data.data.paginator.next_page_url;
            if (nextUrl) await new Promise(resolve => setTimeout(resolve, 500)); // Pausa de 500ms entre as páginas de usuários
        }
        console.log(`Total de ${allUsers.length} usuários encontrados. Verificando acessos um por um...`);

        // 3. ARMAZENAR E TRATAR NO BACKEND
        const deletableUsers = [];
        let count = 0;

        // 2. PARA CADA USUÁRIO, FAZER UMA REQUISIÇÃO DE ACESSO
        for (const user of allUsers) {
            count++;
            if (!user.email) {
                console.log(`Progresso: ${count}/${allUsers.length} - Usuário sem email, pulando.`);
                continue; // Pula usuários sem e-mail
            }

            try {
                const encodedEmail = encodeURIComponent(user.email);
                const accessUrl = `https://${platformName}.cademi.com.br/api/v1/usuario/acesso/${encodedEmail}`;
                const accessResponse = await axios.get(accessUrl, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                
                const accesses = accessResponse.data.data.acesso || [];
                
                const allAccessesClosed = accesses.every(acesso => acesso.encerrado === true);

                if (allAccessesClosed) {
                    deletableUsers.push(user);
                }
                console.log(`Progresso: ${count}/${allUsers.length} - Verificado: ${user.email}. Deletáveis até agora: ${deletableUsers.length}`);

            } catch (accessError) {
                console.error(`Progresso: ${count}/${allUsers.length} - Falha ao buscar acesso para ${user.email}:`, accessError.message);
            }
            
            // 4. PAUSA DE 500ms POR REQUISIÇÃO
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('Busca finalizada.');
        res.json(deletableUsers);

    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data || { error: 'Erro interno no servidor proxy.' };
        res.status(status).json(message);
    }
});

// Apenas UMA chamada app.listen no final
app.listen(port, () => {
    console.log(`Servidor proxy rodando em http://localhost:${port}`);
});