# 🧠 Cademi Auto Organizer – DevTools Script

Este é um script desenvolvido para ser executado no Devtools e tem como objetivo **ordenar automaticamente os módulos e aulas** em plataformas EAD baseadas na estrutura da Cademí.

## 🔧 O que o script faz

✅ Ordena **módulos** (`produto_secao`) com base nos números nos títulos (ex: `01 - Português`, `02 - Matemática`).

✅ Dentro de cada módulo, ordena as **aulas** (`produto_item`) também pelos números iniciais nos títulos (ex: `01 - Introdução`, `02 - Teoria`).

✅ Envia requisições `POST` para a API da plataforma para **salvar a nova ordem** no backend.

✅ Funciona automaticamente ao rodar no console ou configurado como script do Tampermonkey.

---

## 🚀 Como usar

### 1. Acesse a página do produto

Abra a página de gerenciamento de aulas/módulos da plataforma Cademi.

### 2. Abra o DevTools do navegador

- No **Chrome/Edge/Firefox**, pressione `F12` ou `Ctrl + Shift + I` (ou `Cmd + Option + I` no Mac).
- Vá até a aba **Console**.

### 3. Cole o script

- Copie o conteúdo de [`script.js`](./script.js) ou do código abaixo.
- Cole **inteiramente no console** e pressione `Enter`.

O script começará a executar, reordenando os módulos e aulas de acordo com a numeração nos títulos.  
Ao final, você verá uma confirmação no console e um alerta na tela.

---

## 🛠 Estrutura do código

- Reorganiza visualmente os elementos no DOM
- Envia a nova ordem para o endpoint:
