# Lista 07 — Consumo de API

Exercícios 1 a 5 de consumo de API em JavaScript puro (módulos ES), em um projeto
separado do portfólio acadêmico.

## Como abrir

**Windows, sem instalar nada:** dê duplo clique em `src\abrir-aula07.cmd`.
O atalho inicia um servidor local, abre a página no navegador e encerra quando a
janela for fechada (ou com `Ctrl+C`).

Alternativas:

- **VS Code (Live Server):** botão direito em `src/aula07.html` → *Open with Live Server*.
- **Python instalado**, na raiz deste projeto:

  ```bash
  python -m http.server 8000
  ```

  Depois acesse <http://localhost:8000/src/aula07.html>.

Abrir `src/aula07.html` com duplo clique não funciona: o navegador bloqueia os
`import` de módulos quando o endereço é `file://`.

## Estrutura

```text
Lista 07 - Consumo de API/
├── README.md
└── src/
    ├── api.js                 ← BASE_URL, ApiError, requisicao e verbos
    ├── mensagens-erro.js      ← mensagens de 404, 500 e falha de rede
    ├── usuarios-crud.js       ← CRUD usando somente api.js
    ├── aula07.html            ← página de demonstração
    ├── aula07.js              ← testes e registros no console
    ├── abrir-aula07.cmd       ← atalho de duplo clique
    ├── servidor-local.ps1     ← servidor local em PowerShell
    └── README.md              ← explicação detalhada dos exercícios
```

A explicação de cada exercício e o checklist dos critérios estão em
[`src/README.md`](src/README.md).
