/* ==========================================================================
   Lista 07 — página de demonstração
   aula07.js — exercícios 1, 3, 4 e 5 (o CRUD é o exercício 2)
   ========================================================================== */

import { apiGet, apiPost, ApiError } from './api.js';
import { mensagemDeErro } from './mensagens-erro.js';
import { crudUsuarios } from './usuarios-crud.js';

const saida = document.getElementById('saida-api');
const mensagemTeste = document.getElementById('mensagem-teste');
const linhas = [];

function registrar(texto) {
  linhas.push(texto);
  if (saida) {
    saida.textContent = linhas.join('\n');
    saida.scrollTop = saida.scrollHeight;
  }
}

function mostrarMensagemDeTeste(texto) {
  if (!mensagemTeste) {
    return;
  }
  mensagemTeste.textContent = texto || '';
  mensagemTeste.hidden = !texto;
}

/* --------------------------------------------------------------------------
   Exercício 1 — apiGet('/users') em outro arquivo, com console.log
   -------------------------------------------------------------------------- */
async function testarExercicio1() {
  try {
    const usuarios = await apiGet('/users');
    console.log('[Exercício 1] await apiGet("/users") devolveu:', usuarios);
    registrar(
      `[1] OK — apiGet('/users') devolveu ${usuarios.length} usuários. Confira a lista no console.`,
    );
  } catch (erro) {
    console.error('[Exercício 1] A chamada falhou:', erro);
    registrar(`[1] Falhou — ${mensagemDeErro(erro) || erro.message}`);
  }
}

/* --------------------------------------------------------------------------
   Exercícios 3 e 4 — captura e tradução dos erros
   -------------------------------------------------------------------------- */
async function executarTeste(rotulo, tarefa) {
  mostrarMensagemDeTeste('');
  try {
    await tarefa();
    registrar(`[${rotulo}] Nenhum erro foi lançado (resultado inesperado).`);
  } catch (erro) {
    const texto = mensagemDeErro(erro);
    console.warn(`[${rotulo}] Erro capturado:`, erro);

    if (texto === null) {
      registrar(`[${rotulo}] AbortError filtrado — nenhuma mensagem de erro na tela.`);
      return;
    }

    mostrarMensagemDeTeste(texto);
    registrar(`[${rotulo}] Mensagem exibida na tela: "${texto}"`);
  }
}

const botao404 = document.getElementById('btn-404');
if (botao404) {
  botao404.addEventListener('click', () => executarTeste('404', () => (
    apiGet('/users/999999')
  )));
}

const botao500 = document.getElementById('btn-500');
if (botao500) {
  botao500.addEventListener('click', () => executarTeste('500', () => (
    // O JSONPlaceholder não devolve 500 de propósito; simulamos a resposta para
    // conferir a mensagem que o componente mostraria.
    Promise.reject(new ApiError(500, 'Internal Server Error'))
  )));
}

const botaoRede = document.getElementById('btn-rede');
if (botaoRede) {
  botaoRede.addEventListener('click', () => executarTeste('Rede', () => (
    // Mesmo erro que o navegador lança quando fica sem conexão.
    Promise.reject(new TypeError('Failed to fetch'))
  )));
}

const botaoAbortar = document.getElementById('btn-abortar');
if (botaoAbortar) {
  botaoAbortar.addEventListener('click', () => executarTeste('Cancelamento', async () => {
    const controller = new AbortController();
    const promessa = apiGet('/users', { signal: controller.signal });
    controller.abort();
    await promessa;
  }));
}

/* --------------------------------------------------------------------------
   Exercício 5 — merge de headers padrão + headers da chamada
   -------------------------------------------------------------------------- */
const botaoHeaders = document.getElementById('btn-headers');
if (botaoHeaders) {
  botaoHeaders.addEventListener('click', () => executarTeste('Headers', async () => {
    const dados = {
      name: 'Teste Aula 07',
      email: 'aula07@exemplo.com',
    };

    const criado = await apiPost('/users', dados, {
      headers: { 'X-Custom': 'aula07' },
    });

    console.log('[Exercício 5] POST /users com X-Custom:', criado);
    registrar(
      '[5] POST /users enviado com Content-Type: application/json e X-Custom: aula07. '
      + 'Abra DevTools → Network → users e confira os Request Headers.',
    );
  }));
}

/* --------------------------------------------------------------------------
   Exercício 4 — desmontar no meio da carga inicial
   -------------------------------------------------------------------------- */
const botaoDesmontar = document.getElementById('btn-desmontar');
if (botaoDesmontar) {
  botaoDesmontar.addEventListener('click', () => {
    if (!crudUsuarios) {
      registrar('[4] O CRUD não está montado nesta página.');
      return;
    }

    if (crudUsuarios.destruido) {
      registrar('[4] O CRUD já foi desmontado. Recarregue a página para repetir o teste.');
      return;
    }

    crudUsuarios.recarregar();
    crudUsuarios.destruir();

    const form = document.getElementById('form-usuario');
    if (form) {
      form.querySelectorAll('input, button').forEach((elemento) => {
        elemento.disabled = true;
      });
    }

    mostrarMensagemDeTeste('');
    registrar(
      '[4] CRUD desmontado durante a carga: o AbortController foi abortado, '
      + 'o AbortError foi filtrado e nenhuma mensagem de erro apareceu. '
      + 'Recarregue a página para voltar a usar o formulário.',
    );
  });
}

/* --------------------------------------------------------------------------
   Recarregar a lista manualmente
   -------------------------------------------------------------------------- */
const botaoRecarregar = document.getElementById('btn-recarregar');
if (botaoRecarregar) {
  botaoRecarregar.addEventListener('click', () => {
    if (!crudUsuarios || crudUsuarios.destruido) {
      registrar('A lista foi desmontada. Recarregue a página para buscar novamente.');
      return;
    }

    mostrarMensagemDeTeste('');
    registrar('GET /users — recarregando a lista…');
    crudUsuarios.recarregar();
  });
}

testarExercicio1();
