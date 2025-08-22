// server.js (Corrigido)
const express = require('express');
const axios =require('axios');
const cors = require('cors');
const pLimit = require('p-limit');


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

// ENDPOINT FINAL, OTIMIZADO E CORRETO: Processa em lotes de 2 com pausa de 1 segundo
app.post('/api/users/deletable', async (req, res) => {
    const { platformName, apiKey } = req.body;

    if (!platformName || !apiKey) {
        return res.status(400).json({ error: 'Platform Name e API Key são obrigatórios.' });
    }

    try {
        console.log('Iniciando busca por usuários deletáveis (modo otimizado em lotes)...');
        
        // Etapa 1: Buscar todos os usuários
        let allUsers = [];
        let nextUrl = `https://${platformName}.cademi.com.br/api/v1/usuario`;
        while (nextUrl) {
            const usersResponse = await axios.get(nextUrl, { headers: { 'Authorization': `Bearer ${apiKey}` } });
            const usersFromPage = usersResponse.data.data.usuario;
            if (usersFromPage && usersFromPage.length > 0) {
                allUsers.push(...usersFromPage);
            }
            nextUrl = usersResponse.data.data.paginator.next_page_url;
            if (nextUrl) await new Promise(resolve => setTimeout(resolve, 500));
        }
        console.log(`Total de ${allUsers.length} usuários encontrados. Verificando acessos em pares...`);

        // Etapa 2: Processar usuários em lotes de 2 para respeitar o rate limit
        const deletableUsers = [];

        // Função interna para processar um único usuário
        const processUser = async (user) => {
            if (!user || !user.email) return;

            try {
                const encodedEmail = encodeURIComponent(user.email);
                const accessUrl = `https://${platformName}.cademi.com.br/api/v1/usuario/acesso/${encodedEmail}`;
                const accessResponse = await axios.get(accessUrl, { headers: { 'Authorization': `Bearer ${apiKey}` } });

                const accesses = accessResponse.data.data.acesso || [];
                if (accesses.every(acesso => acesso.encerrado === true)) {
                    deletableUsers.push(user);
                }
            } catch (error) {
                console.error(`Falha ao buscar acesso para ${user.email}:`, error.message);
            }
        };

        // Loop principal que processa a lista em pares
        for (let i = 0; i < allUsers.length; i += 2) {
            const user1 = allUsers[i];
            const user2 = allUsers[i + 1]; // Pode ser undefined se o número de usuários for ímpar

            // Cria as duas promises para o lote atual
            const promise1 = processUser(user1);
            const promise2 = processUser(user2); // A função processUser lida com o caso de user2 ser undefined

            // Executa as duas requisições em paralelo e espera ambas terminarem
            await Promise.all([promise1, promise2]);

            console.log(`Progresso: ${Math.min(i + 2, allUsers.length)}/${allUsers.length} usuários verificados. Deletáveis: ${deletableUsers.length}`);

            // Pausa de 1 segundo entre os lotes de 2, garantindo o limite da API
            if (i + 2 < allUsers.length) { // Não pausa após o último lote
                 await new Promise(resolve => setTimeout(resolve, 1000));
            }
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