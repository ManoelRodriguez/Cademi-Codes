// server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static('public'));

app.post('/api/users', async (req, res) => {
    // Agora pegamos três possíveis valores do corpo da requisição
    const { platformName, apiKey, paginationUrl } = req.body;

    // Se for uma chamada de paginação, a paginationUrl terá prioridade.
    // Se for a primeira chamada, ela será nula, e construiremos a URL como antes.
    let targetUrl;

    if (paginationUrl) {
        // Para chamadas de página "Próxima" ou "Anterior"
        targetUrl = paginationUrl;
        console.log(`Chamada de paginação para: ${targetUrl}`);
    } else if (platformName) {
        // Para a primeira chamada
        targetUrl = `https://${platformName}.cademi.com.br/api/v1/usuario`;
        console.log(`Chamada inicial para: ${targetUrl}`);
    } else {
        // Se nenhum dos dois for fornecido, retorna um erro.
        return res.status(400).json({ error: 'É necessário fornecer platformName ou paginationUrl.' });
    }
    
    // A chave de API ainda é necessária para TODAS as requisições
    if (!apiKey) {
        return res.status(400).json({ error: 'API Key é obrigatória.' });
    }

    try {
        const response = await axios.get(targetUrl, { // Usamos a URL dinâmica
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('Erro ao chamar a API da Cademi:', error.response?.data || error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data || { error: 'Erro interno no servidor proxy.' };
        res.status(status).json(message);
    }
});

//BUSCANDO ACESSOS DO ALUNO
app.post('/api/user-access', async (req, res) => {
    const { platformName, apiKey, userEmail } = req.body;

    if (!platformName || !apiKey || !userEmail) {
        return res.status(400).json({ error: 'Platform Name, API Key, and User Email são obrigatórios.' });
    }

    // O email pode conter caracteres especiais (+), por isso o codificamos para a URL
    const encodedEmail = encodeURIComponent(userEmail);
    const targetUrl = `https://${platformName}.cademi.com.br/api/v1/usuario/acesso/${encodedEmail}`;
    
    console.log(`Buscando acessos para ${userEmail} em: ${targetUrl}`);

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar acessos do usuário:', error.response?.data || error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data || { error: 'Erro interno no servidor proxy.' };
        res.status(status).json(message);
    }
});

app.listen(port, () => {
    console.log(`Servidor proxy rodando em http://localhost:${port}`);
});