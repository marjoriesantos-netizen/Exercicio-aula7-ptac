/* ==========================================================================
   Lista 07 — Consumo de API
   api.js — camada única de acesso à rede

   Exercícios 1, 3, 4 e 5:
   - BASE_URL, requisicao, apiGet, apiPost, apiPut, apiDelete;
   - ApiError para respostas HTTP de erro;
   - suporte a AbortSignal;
   - merge dos headers padrão com os headers de cada chamada.
   ========================================================================== */

export const BASE_URL = 'https://jsonplaceholder.typicode.com';

const HEADERS_PADRAO = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

/**
 * Erro lançado quando a resposta HTTP não é bem-sucedida (resp.ok === false).
 * Guardar status e statusText permite que a interface mostre uma mensagem
 * específica para cada caso (404, 500 etc.).
 */
export class ApiError extends Error {
  constructor(status, statusText, corpo = null) {
    super(statusText || `Erro HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.corpo = corpo;
  }
}

/**
 * Aceita um objeto simples, um Headers ou uma lista de pares [nome, valor]
 * e devolve sempre um objeto simples.
 */
function normalizarHeaders(headers) {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    const objeto = {};
    headers.forEach((valor, nome) => {
      objeto[nome] = valor;
    });
    return objeto;
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  if (typeof headers === 'object') {
    return { ...headers };
  }

  throw new TypeError('headers deve ser um objeto, um Headers ou uma lista de pares');
}

/**
 * Mescla os headers padrão com os headers da chamada.
 * A comparação é feita sem diferenciar maiúsculas de minúsculas, então
 * { 'content-type': '...' } substitui o Content-Type padrão em vez de
 * enviar o mesmo header duas vezes.
 */
function mesclarHeaders(...listas) {
  const resultado = {};
  const nomesUsados = new Map();

  listas.forEach((lista) => {
    const headers = normalizarHeaders(lista);

    Object.entries(headers).forEach(([nome, valor]) => {
      if (valor === undefined || valor === null) {
        return;
      }

      const chave = nome.toLowerCase();
      if (nomesUsados.has(chave)) {
        delete resultado[nomesUsados.get(chave)];
      }

      nomesUsados.set(chave, nome);
      resultado[nome] = String(valor);
    });
  });

  return resultado;
}

function removerHeader(headers, nome) {
  const alvo = nome.toLowerCase();
  Object.keys(headers).forEach((chave) => {
    if (chave.toLowerCase() === alvo) {
      delete headers[chave];
    }
  });
}

/**
 * Requisição base usada por todos os verbos.
 *
 * @param {string} endpoint Caminho relativo (ex.: '/users').
 * @param {RequestInit & { headers?: object|Headers }} opcoes
 *        Aceita qualquer opção do fetch (method, signal etc.) e headers extras.
 */
export async function requisicao(endpoint, opcoes = {}) {
  const {
    headers: headersDaChamada,
    body,
    signal,
    ...restoDasOpcoes
  } = opcoes || {};

  const headers = mesclarHeaders(HEADERS_PADRAO, headersDaChamada);
  const config = { ...restoDasOpcoes, headers };

  // Exercício 4: o signal precisa chegar intacto ao fetch.
  if (signal) {
    config.signal = signal;
  }

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      // O navegador precisa gerar o boundary do multipart sozinho.
      removerHeader(headers, 'Content-Type');
      config.body = body;
    } else if (
      typeof body === 'string' ||
      body instanceof URLSearchParams ||
      body instanceof Blob ||
      body instanceof ArrayBuffer
    ) {
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  const resp = await fetch(`${BASE_URL}${endpoint}`, config);

  // Exercício 3: respostas 4xx e 5xx viram ApiError.
  if (!resp.ok) {
    throw new ApiError(resp.status, resp.statusText);
  }

  // 204/205 e respostas vazias não têm corpo para interpretar.
  if (resp.status === 204 || resp.status === 205) {
    return null;
  }

  const texto = await resp.text();
  if (texto === '') {
    return null;
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(texto);
    } catch {
      return texto;
    }
  }

  return texto;
}

export function apiGet(endpoint, opcoes = {}) {
  return requisicao(endpoint, { ...opcoes, method: 'GET' });
}

export function apiPost(endpoint, dados, opcoes = {}) {
  return requisicao(endpoint, { ...opcoes, method: 'POST', body: dados });
}

export function apiPut(endpoint, dados, opcoes = {}) {
  return requisicao(endpoint, { ...opcoes, method: 'PUT', body: dados });
}

export function apiPatch(endpoint, dados, opcoes = {}) {
  return requisicao(endpoint, { ...opcoes, method: 'PATCH', body: dados });
}

export function apiDelete(endpoint, opcoes = {}) {
  return requisicao(endpoint, { ...opcoes, method: 'DELETE' });
}

export default {
  BASE_URL,
  ApiError,
  requisicao,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
};
