# 🧠 Cademi Auto Organizer – Tampermonkey Script

Este é um script desenvolvido para ser executado via **[Tampermonkey](https://www.tampermonkey.net/)** e tem como objetivo **ordenar automaticamente os módulos e aulas** em plataformas EAD baseadas na estrutura da Cademi.

## 🔧 O que o script faz

✅ Ordena **módulos** (`produto_secao`) com base nos números nos títulos (ex: `01 - Português`, `02 - Matemática`).

✅ Dentro de cada módulo, ordena as **aulas** (`produto_item`) também pelos números iniciais nos títulos (ex: `01 - Introdução`, `02 - Teoria`).

✅ Envia requisições `POST` para a API da plataforma para **salvar a nova ordem** no backend.

✅ Funciona automaticamente ao rodar no console ou configurado como script do Tampermonkey.

---

## 🚀 Como usar

### 1. Instale o Tampermonkey

- Chrome/Edge: [https://tampermonkey.net/?ext=dhdg&browser=chrome](https://tampermonkey.net/?ext=dhdg&browser=chrome)
- Firefox: [https://tampermonkey.net/?ext=dhdg&browser=firefox](https://tampermonkey.net/?ext=dhdg&browser=firefox)

### 2. Adicione o script

- Crie um novo script no painel do Tampermonkey
- Copie e cole o conteúdo de [`script.js`](./script.js) (ou o código abaixo)

### 3. Acesse a plataforma (ex: `https://*.cademi.com.br/office/produtos/...`)  
> O script será executado automaticamente ou via botão (caso implementado)

---

## 🛠 Estrutura do código

- Reorganiza visualmente os elementos no DOM
- Envia a nova ordem para o endpoint:
