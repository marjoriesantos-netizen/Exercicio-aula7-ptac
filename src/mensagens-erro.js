/* ==========================================================================
   Lista 07 — Exercício 3
   mensagens-erro.js — traduz erros técnicos em mensagens para a tela.
   ========================================================================== */

import { ApiError } from './api.js';

/**
 * Devolve a mensagem que deve aparecer para o usuário.
 * Retorna null quando o erro é um AbortError: cancelamentos (por exemplo, ao
 * desmontar o componente) são esperados e não devem virar mensagem de erro.
 */
export function mensagemDeErro(erro) {
  if (!erro) {
    return 'Erro inesperado';
  }

  // Exercício 4: AbortError é cancelamento, não falha.
  if (erro.name === 'AbortError') {
    return null;
  }

  if (erro instanceof ApiError) {
    if (erro.status === 404) {
      return 'Recurso não encontrado';
    }
    if (erro.status === 500) {
      return 'Erro no servidor';
    }
    return `Erro ${erro.status}: ${erro.statusText || 'falha na requisição'}`;
  }

  // No navegador, uma falha de rede chega como TypeError: Failed to fetch.
  if (
    erro instanceof TypeError &&
    /failed to fetch|networkerror|load failed/i.test(erro.message)
  ) {
    return 'Falha de rede';
  }

  return erro.message || 'Erro inesperado';
}
