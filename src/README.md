# Lista 07 — Consumo de API

Exercícios 1 a 5 implementados em JavaScript puro (módulos ES), sem bibliotecas.
A página de demonstração é `src/aula07.html`.

## Arquivos

| Arquivo | Exercícios | Responsabilidade |
|---|---|---|
| `src/api.js` | 1, 3, 4 e 5 | `BASE_URL`, `ApiError`, `requisicao`, `apiGet`, `apiPost`, `apiPut`, `apiPatch` e `apiDelete`. É o único arquivo que chama `fetch`. |
| `src/mensagens-erro.js` | 3 e 4 | Traduz `ApiError`/`TypeError` em mensagens para a tela e ignora `AbortError`. |
| `src/usuarios-crud.js` | 2, 3, 4 e 5 | CRUD de usuários usando apenas as funções de `api.js`, com `AbortController` e cleanup. |
| `src/aula07.html` | todos | Página de demonstração com o CRUD e botões de teste. |
| `src/aula07.js` | 1, 3, 4 e 5 | Executa e registra os testes no console e na tela. |

## Como abrir

Módulos ES não funcionam abrindo o HTML direto com `file://`. Use uma das opções:

**Windows, sem instalar nada:** dê duplo clique em `src/abrir-aula07.cmd`.
Ele inicia o servidor local, abre a página no navegador e encerra quando a janela
for fechada (ou com `Ctrl+C`).

**VS Code (Live Server):** clique com o botão direito em `src/aula07.html` →
*Open with Live Server*.

**Python instalado**, na raiz do projeto:

```bash
python -m http.server 8000
```

Depois acesse <http://localhost:8000/src/aula07.html>.

> Este projeto é separado do portfólio acadêmico; a página existe apenas para os
> exercícios da Lista 07.

---

## Exercício 1 — `src/api.js`

O arquivo exporta:

```js
export const BASE_URL = 'https://jsonplaceholder.typicode.com';
export class ApiError extends Error { /* status, statusText */ }
export async function requisicao(endpoint, opcoes = {}) { /* ... */ }
export function apiGet(endpoint, opcoes = {}) { /* ... */ }
export function apiPost(endpoint, dados, opcoes = {}) { /* ... */ }
export function apiPut(endpoint, dados, opcoes = {}) { /* ... */ }
export function apiDelete(endpoint, opcoes = {}) { /* ... */ }
```

Em outro arquivo (`src/aula07.js`):

```js
import { apiGet } from './api.js';

const usuarios = await apiGet('/users');
console.log(usuarios); // array com 10 usuários
```

O navegador exige a extensão `.js` no caminho do módulo. O resultado também aparece
na página de demonstração e no console (F12).

## Exercício 2 — CRUD sem `fetch` nos componentes

`src/usuarios-crud.js` importa apenas:

```js
import { apiGet, apiPost, apiPut, apiDelete } from './api.js';
```

As operações usam:

- `apiGet('/users')` — listar;
- `apiPost('/users', dados, { headers: { 'X-Custom': 'aula07' } })` — criar;
- `apiPut('/users/:id', dados)` — editar;
- `apiDelete('/users/:id')` — excluir.

Para conferir que não sobrou `fetch(` fora de `api.js`:

```bash
grep -rn "fetch(" src
```

No PowerShell:

```powershell
Select-String -Path src\*.js -Pattern 'fetch\('
```

O único resultado deve ser `src/api.js`.

> O JSONPlaceholder não persiste os dados: depois de criar, editar ou excluir, a
> lista é atualizada em memória para a demonstração continuar coerente. Ele também
> responde **500** ao editar um usuário recém-criado (o id não existe no servidor).
> Para testar a edição, use um dos 10 usuários originais.

## Exercício 3 — `ApiError` e mensagens

`requisicao` lança o erro quando `resp.ok` é falso:

```js
if (!resp.ok) {
  throw new ApiError(resp.status, resp.statusText);
}
```

`mensagemDeErro` converte o erro para a mensagem exibida:

| Situação | Mensagem |
|---|---|
| `ApiError` com status 404 | `Recurso não encontrado` |
| `ApiError` com status 500 | `Erro no servidor` |
| `TypeError: Failed to fetch` | `Falha de rede` |
| Outro `ApiError` | `Erro <status>: <statusText>` |

A página tem botões para testar os três casos. O 404 é real
(`GET /users/999999`); o 500 e a falha de rede são simulados, porque o
JSONPlaceholder não devolve 500 de propósito e derrubar a conexão quebraria a
demonstração.

## Exercício 4 — `signal` e cancelamento

`requisicao` repassa o `signal` ao `fetch`:

```js
const controller = new AbortController();
const usuarios = await apiGet('/users', { signal: controller.signal });
```

No CRUD, cada carga cria um `AbortController`. A função `destruir()` (equivalente
ao cleanup de um `useEffect`) aborta a requisição pendente e remove os listeners.
Ela também é chamada em `pagehide`:

```js
function destruir() {
  controllerAtual?.abort();
  form?.removeEventListener('submit', salvar);
  lista?.removeEventListener('click', aoClicarNaLista);
  window.removeEventListener('pagehide', destruir);
}
```

`mensagemDeErro` devolve `null` para `AbortError`, então cancelar nunca vira
mensagem de erro. O botão **Desmontar durante a carga** inicia um `GET /users` e
chama `destruir()` em seguida para comprovar isso.

## Exercício 5 — merge de headers

`requisicao` separa os headers da chamada e os mescla com o padrão:

```js
const { headers: headersDaChamada, body, signal, ...resto } = opcoes;

const headers = mesclarHeaders(
  { 'Content-Type': 'application/json', Accept: 'application/json' },
  headersDaChamada,
);
```

A mesclagem ignora maiúsculas/minúsculas, então uma chamada pode substituir o
`Content-Type` padrão sem enviar o header duplicado. Exemplo:

```js
await apiPost('/users', dados, {
  headers: { 'X-Custom': 'aula07' },
});
```

A requisição envia, na mesma chamada:

```text
Content-Type: application/json
X-Custom: aula07
```

Na página, clique em **Testar header X-Custom** e abra
**DevTools → Network → users → Request Headers**.

---

## Checklist dos critérios

- [x] `import { apiGet } from './api.js'` funciona e `await apiGet('/users')` devolve a lista (confirmado com `console.log`).
- [x] CRUD cria, lista, edita e exclui; nenhum `fetch(` fora de `src/api.js`.
- [x] 404 → “Recurso não encontrado”; 500 → “Erro no servidor”; falha de rede → “Falha de rede”.
- [x] Desmontar durante a carga não gera mensagem de erro; `AbortError` é filtrado.
- [x] `Content-Type` e `X-Custom` são enviados juntos na mesma requisição.

Os caminhos acima foram verificados com o Edge em modo headless: 23 asserções
(camada de API, mensagens, cancelamento, headers e CRUD completo) passaram.
