/* ==========================================================================
   Lista 07 — Exercícios 2, 3, 4 e 5
   usuarios-crud.js — CRUD de usuários usando somente api.js.

   Não existe nenhuma chamada direta a fetch neste arquivo: todas as
   requisições passam por apiGet/apiPost/apiPut/apiDelete.

   Sobre o "useEffect": o projeto é JavaScript puro, então o equivalente ao
   ciclo de vida de um componente é criar um AbortController ao montar e
   abortá-lo ao desmontar (função destruir, chamada também em pagehide).
   ========================================================================== */

import { apiGet, apiPost, apiPut, apiDelete } from './api.js';
import { mensagemDeErro } from './mensagens-erro.js';

const CAMINHO_USUARIOS = '/users';

export function criarCrudUsuarios(raiz = document) {
  const form = raiz.querySelector('#form-usuario');
  const lista = raiz.querySelector('#lista-usuarios');
  const mensagem = raiz.querySelector('#mensagem-erro');
  const botaoSalvar = form ? form.querySelector('[type="submit"]') : null;
  const botaoCancelar = raiz.querySelector('#btn-cancelar');

  let usuarios = [];
  let idEmEdicao = null;
  let controllerAtual = null;
  let destruido = false;

  function definirMensagem(texto, tipo = 'erro') {
    if (!mensagem) {
      return;
    }
    mensagem.textContent = texto || '';
    mensagem.dataset.tipo = tipo;
    mensagem.hidden = !texto;
  }

  function limparMensagem() {
    definirMensagem('');
  }

  function criarBotao(rotulo, classe, id) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = classe;
    botao.dataset.id = String(id);
    botao.textContent = rotulo;
    return botao;
  }

  function renderizarLista() {
    if (!lista) {
      return;
    }

    lista.innerHTML = '';

    if (usuarios.length === 0) {
      const vazio = document.createElement('li');
      vazio.className = 'lista-vazia';
      vazio.textContent = 'Nenhum usuário para mostrar.';
      lista.appendChild(vazio);
      return;
    }

    usuarios.forEach((usuario) => {
      const item = document.createElement('li');

      const dados = document.createElement('span');
      dados.className = 'usuario-dados';
      dados.textContent = `${usuario.name} (${usuario.email})`;

      item.appendChild(dados);
      item.appendChild(criarBotao('Editar', 'editar', usuario.id));
      item.appendChild(criarBotao('Excluir', 'excluir', usuario.id));
      lista.appendChild(item);
    });
  }

  function atualizarBotoesDoFormulario() {
    const editando = idEmEdicao !== null;

    if (botaoSalvar) {
      botaoSalvar.textContent = editando ? 'Salvar alterações' : 'Cadastrar';
    }
    if (botaoCancelar) {
      botaoCancelar.hidden = !editando;
    }
  }

  function encerrarEdicao() {
    idEmEdicao = null;

    if (form) {
      form.reset();
      delete form.dataset.editId;
    }

    atualizarBotoesDoFormulario();
  }

  function preencherFormulario(usuario) {
    if (!form) {
      return;
    }

    form.elements.name.value = usuario.name || '';
    form.elements.email.value = usuario.email || '';
    form.dataset.editId = String(usuario.id);
    atualizarBotoesDoFormulario();

    if (form.elements.name.focus) {
      form.elements.name.focus();
    }
  }

  /**
   * Equivalente ao useEffect da lista: dispara a busca com signal e cancela
   * qualquer carga anterior que ainda esteja em andamento.
   */
  async function carregar() {
    if (destruido || !lista) {
      return;
    }

    if (controllerAtual) {
      controllerAtual.abort();
    }

    const controller = new AbortController();
    controllerAtual = controller;
    limparMensagem();
    lista.setAttribute('aria-busy', 'true');

    try {
      const dados = await apiGet(CAMINHO_USUARIOS, { signal: controller.signal });

      if (destruido || controller.signal.aborted) {
        return;
      }

      usuarios = Array.isArray(dados) ? dados : [];
      renderizarLista();
    } catch (erro) {
      // mensagemDeErro devolve null para AbortError: cancelar não é falha.
      const texto = mensagemDeErro(erro);
      if (texto && !destruido) {
        definirMensagem(texto);
      }
    } finally {
      if (controllerAtual === controller) {
        controllerAtual = null;
      }
      if (lista) {
        lista.removeAttribute('aria-busy');
      }
    }
  }

  async function salvar(evento) {
    evento.preventDefault();

    if (!form || destruido) {
      return;
    }

    const dados = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
    };

    if (!dados.name || !dados.email) {
      definirMensagem('Preencha nome e e-mail para continuar.');
      return;
    }

    const editando = idEmEdicao !== null;

    try {
      limparMensagem();

      if (editando) {
        const atualizado = await apiPut(`${CAMINHO_USUARIOS}/${idEmEdicao}`, dados);
        usuarios = usuarios.map((usuario) => (
          usuario.id === idEmEdicao
            ? { ...usuario, ...dados, ...(atualizado || {}) }
            : usuario
        ));
      } else {
        // Exercício 5: o header extra é mesclado ao Content-Type padrão.
        const criado = await apiPost(CAMINHO_USUARIOS, dados, {
          headers: { 'X-Custom': 'aula07' },
        });
        usuarios = [...usuarios, { ...dados, ...(criado || {}) }];
      }

      if (destruido) {
        return;
      }

      renderizarLista();
      encerrarEdicao();
      definirMensagem(
        editando ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.',
        'sucesso',
      );
    } catch (erro) {
      const texto = mensagemDeErro(erro);
      if (texto) {
        definirMensagem(texto);
      }
    }
  }

  async function aoClicarNaLista(evento) {
    const botao = evento.target instanceof Element
      ? evento.target.closest('button')
      : null;

    if (!botao || destruido) {
      return;
    }

    const id = botao.dataset.id;

    if (botao.classList.contains('editar')) {
      const usuario = usuarios.find((item) => String(item.id) === id);
      if (!usuario) {
        return;
      }

      idEmEdicao = usuario.id;
      preencherFormulario(usuario);
      limparMensagem();
      return;
    }

    if (botao.classList.contains('excluir')) {
      try {
        limparMensagem();
        await apiDelete(`${CAMINHO_USUARIOS}/${id}`);

        if (destruido) {
          return;
        }

        // O JSONPlaceholder não persiste alterações; atualizamos a lista
        // local para que a exclusão fique visível na demonstração.
        usuarios = usuarios.filter((usuario) => String(usuario.id) !== id);
        renderizarLista();

        if (String(idEmEdicao) === id) {
          encerrarEdicao();
        }

        definirMensagem('Usuário excluído com sucesso.', 'sucesso');
      } catch (erro) {
        const texto = mensagemDeErro(erro);
        if (texto) {
          definirMensagem(texto);
        }
      }
    }
  }

  /**
   * Equivalente ao cleanup do useEffect: interrompe requisições pendentes e
   * remove os listeners. Também é chamado automaticamente em pagehide.
   */
  function destruir() {
    if (destruido) {
      return;
    }

    destruido = true;

    if (controllerAtual) {
      controllerAtual.abort();
      controllerAtual = null;
    }

    if (form) {
      form.removeEventListener('submit', salvar);
    }
    if (lista) {
      lista.removeEventListener('click', aoClicarNaLista);
    }
    if (botaoCancelar) {
      botaoCancelar.removeEventListener('click', encerrarEdicao);
    }

    window.removeEventListener('pagehide', destruir);
  }

  if (form) {
    form.addEventListener('submit', salvar);
  }
  if (lista) {
    lista.addEventListener('click', aoClicarNaLista);
    carregar();
  }
  if (botaoCancelar) {
    botaoCancelar.addEventListener('click', encerrarEdicao);
  }

  // Em uma página comum, "desmontar" acontece ao sair/recarregar.
  window.addEventListener('pagehide', destruir, { once: true });

  atualizarBotoesDoFormulario();

  return {
    carregar,
    recarregar: carregar,
    destruir,
    encerrarEdicao,
    get usuarios() {
      return [...usuarios];
    },
    get destruido() {
      return destruido;
    },
  };
}

/**
 * Monta automaticamente quando a página tem a interface do CRUD. Em outros
 * contextos (ou em testes), use criarCrudUsuarios() e chame destruir().
 */
export const crudUsuarios = (
  typeof document !== 'undefined' && document.getElementById('lista-usuarios')
)
  ? criarCrudUsuarios()
  : null;
