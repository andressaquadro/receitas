/*
 * Publicação das receitas para o celular.
 *
 * O computador (arquivo local) edita e envia um único arquivo `receitas.json`
 * para o repositório do GitHub. O site publicado no GitHub Pages abre em modo
 * somente leitura e busca esse arquivo para mostrar as receitas no celular.
 */
(() => {
  'use strict';

  const CONFIG_KEY = 'receita-facil:publicacao:v1';
  const PUBLICADO_EM_KEY = 'receita-facil:publicado-em:v1';
  const ARQUIVO = 'receitas.json';
  const API = 'https://api.github.com';
  const SOMENTE_LEITURA = document.documentElement.classList.contains('modo-leitura');

  const $ = (selector) => document.querySelector(selector);

  const modal = $('#publicarModal');
  const corpoModal = $('#publicarBody');
  const btnPublicar = $('#publicarButton');
  const btnSidebar = $('#sidebarPublishButton');
  const btnAtualizar = $('#atualizarButton');
  const statusTitulo = $('#publishStatusTitle');
  const statusTexto = $('#publishStatusText');
  const avisoAtualizado = $('#viewerUpdated');

  let config = lerConfig();
  let publicando = false;
  let ultimaBusca = 0;

  /* ------------------------------------------------------------------ */
  /* Configuração                                                        */
  /* ------------------------------------------------------------------ */

  function lerConfig() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
      return {
        repo: String(salvo.repo || '').trim(),
        token: String(salvo.token || '').trim(),
      };
    } catch {
      return { repo: '', token: '' };
    }
  }

  function gravarConfig(nova) {
    config = nova;
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(nova));
    } catch {
      window.ReceitaUI.showToast('Não foi possível guardar a configuração neste navegador.');
    }
    atualizarStatus();
  }

  function configurado() {
    return /^[\w.-]+\/[\w.-]+$/.test(config.repo) && Boolean(config.token);
  }

  function partesDoRepo() {
    const [dono, nome] = config.repo.split('/');
    return { dono, nome };
  }

  function enderecoDoSite() {
    if (!config.repo) return '';
    const { dono, nome } = partesDoRepo();
    const base = `https://${dono.toLowerCase()}.github.io`;
    return nome.toLowerCase() === `${dono.toLowerCase()}.github.io` ? `${base}/` : `${base}/${nome}/`;
  }

  /* ------------------------------------------------------------------ */
  /* Textos e status                                                     */
  /* ------------------------------------------------------------------ */

  function escapar(valor = '') {
    return String(valor)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function quando(iso) {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return '';
    const agora = new Date();
    const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data);
    if (data.toDateString() === agora.toDateString()) return `hoje às ${hora}`;
    const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(data);
    return `${dia} às ${hora}`;
  }

  function publicadoEm() {
    return localStorage.getItem(PUBLICADO_EM_KEY) || '';
  }

  function atualizarStatus() {
    if (SOMENTE_LEITURA) return;
    const ultima = publicadoEm();
    if (btnSidebar) {
      btnSidebar.dataset.state = configurado() ? (ultima ? 'ok' : '') : '';
    }
    if (configurado()) {
      statusTitulo.textContent = ultima ? 'Publicado para o celular' : 'Pronto para publicar';
      statusTexto.textContent = ultima ? `Última vez ${quando(ultima)}` : 'Toque para enviar suas receitas';
    } else {
      statusTitulo.textContent = 'Ainda não publicado';
      statusTexto.textContent = 'Toque para enviar ao celular';
    }
  }

  function rotuloDeAtualizacao() {
    if (!avisoAtualizado) return;
    const ultima = publicadoEm();
    avisoAtualizado.textContent = ultima
      ? `Atualizado ${quando(ultima)}`
      : 'Receitas publicadas pelo computador.';
  }

  function mensagem(texto, tipo = 'erro') {
    const alvo = $('#publicarMsg');
    if (!alvo) return;
    alvo.textContent = texto;
    alvo.className = `publicar-msg${tipo === 'ok' ? ' ok' : ''}`;
  }

  /* ------------------------------------------------------------------ */
  /* Modal de publicação                                                 */
  /* ------------------------------------------------------------------ */

  function abrirModal() {
    if (SOMENTE_LEITURA) return;
    desenharModal();
    window.ReceitaUI.showModal(modal, { focusDialog: true });
  }

  function desenharModal() {
    if (!corpoModal) return;
    if (configurado()) desenharPronto();
    else desenharFormulario();
  }

  function desenharPronto() {
    const site = enderecoDoSite();
    const ultima = publicadoEm();
    corpoModal.innerHTML = `
      <p class="publicar-intro">Suas receitas vão para o seu site no GitHub Pages. No celular, o app abre em modo somente leitura.</p>
      <div class="publicar-status">
        <span class="status-dot" aria-hidden="true"></span>
        <div>
          <strong>${escapar(config.repo)}</strong>
          <span>${ultima ? `Última publicação ${quando(ultima)}` : 'Ainda não publicado por este computador'}</span>
        </div>
      </div>
      <div class="publicar-url">
        <a href="${escapar(site)}" target="_blank" rel="noopener">${escapar(site)}</a>
        <button class="icon-button" type="button" id="copiarEndereco" aria-label="Copiar endereço do celular" title="Copiar endereço">⧉</button>
      </div>
      <div class="publicar-actions">
        <button class="button button-primary" type="button" id="publicarAgora">Publicar agora</button>
        <button class="button button-quiet" type="button" id="alterarConfig">Alterar configuração</button>
      </div>
      <p class="publicar-msg hidden" id="publicarMsg" role="status"></p>
      <p class="publicar-note">Depois de publicar, abra esse endereço no celular e use <strong>Adicionar à tela de início</strong> para instalar o app.</p>
      <details class="publicar-help">
        <summary>Como funciona</summary>
        <p>O botão envia o arquivo <strong>${ARQUIVO}</strong> para o repositório. O site publicado lê esse arquivo, então as novidades chegam ao celular em segundos — basta tocar em <strong>Atualizar</strong>.</p>
        <p class="publicar-note">Se preferir não usar o token, use <strong>Alterar configuração</strong> e baixe o arquivo para enviar manualmente pelo site do GitHub.</p>
      </details>`;

    $('#publicarAgora').addEventListener('click', executarPublicacao);
    $('#alterarConfig').addEventListener('click', () => {
      desenharFormulario();
      $('#publicarRepoInput')?.focus();
    });
    $('#copiarEndereco').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(site);
        window.ReceitaUI.showToast('Endereço copiado.');
      } catch {
        window.ReceitaUI.showToast('Copie o endereço que aparece na tela.');
      }
    });
  }

  function desenharFormulario() {
    corpoModal.innerHTML = `
      <p class="publicar-intro">As receitas são enviadas para o seu repositório no GitHub. O celular abre o site em modo somente leitura — perfeito para consultar na cozinha.</p>
      <form class="publicar-form" id="publicarForm" novalidate>
        <label class="form-field">
          <span>Repositório do GitHub</span>
          <input id="publicarRepoInput" name="repo" placeholder="seu-usuario/receitas" value="${escapar(config.repo)}" autocomplete="off" autocapitalize="off" spellcheck="false" />
          <small>Usuário e nome do repositório, separados por barra.</small>
        </label>
        <label class="form-field">
          <span>Token de acesso do GitHub</span>
          <input id="publicarTokenInput" name="token" type="password" placeholder="github_pat_..." value="${escapar(config.token)}" autocomplete="off" autocapitalize="off" spellcheck="false" />
          <small>Fica guardado só neste computador. Você pode revogar quando quiser.</small>
        </label>
        <details class="publicar-help">
          <summary>Como conseguir o token (uma vez só)</summary>
          <ol>
            <li>Abra <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a>.</li>
            <li>Em <strong>Repository access</strong>, escolha <strong>Only select repositories</strong> e marque o repositório das receitas.</li>
            <li>Em <strong>Permissions → Repository permissions</strong>, abra <strong>Contents</strong> e marque <strong>Read and write</strong>.</li>
            <li>Gere o token e cole no campo acima.</li>
          </ol>
          <p class="publicar-note">O repositório precisa ser público: o GitHub Pages gratuito não publica repositórios privados. Ligue o Pages em <strong>Settings → Pages → Deploy from a branch → main → / (root)</strong>.</p>
        </details>
        <div class="publicar-actions">
          <button class="button button-primary" type="submit">Publicar agora</button>
          <button class="button button-quiet" type="button" id="baixarJson">Baixar ${ARQUIVO}</button>
        </div>
        <p class="publicar-msg hidden" id="publicarMsg" role="status"></p>
      </form>`;

    $('#publicarForm').addEventListener('submit', (evento) => {
      evento.preventDefault();
      const repo = $('#publicarRepoInput').value.trim()
        .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
        .replace(/\.git$/i, '')
        .replace(/\/+$/, '');
      const token = $('#publicarTokenInput').value.trim();
      if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
        mensagem('Informe o repositório no formato usuario/repositorio.');
        return;
      }
      if (!token) {
        mensagem('Informe o token de acesso do GitHub.');
        return;
      }
      gravarConfig({ repo, token });
      desenharPronto();
      executarPublicacao();
    });

    $('#baixarJson').addEventListener('click', baixarArquivo);
  }

  /* ------------------------------------------------------------------ */
  /* Envio para o GitHub                                                 */
  /* ------------------------------------------------------------------ */

  function montarArquivo() {
    const receitas = window.ReceitaUI.getRecipes().map(({ id, name, ingredients, instructions, createdAt, updatedAt }) => ({
      id,
      name,
      ingredients,
      instructions,
      createdAt,
      updatedAt,
    }));
    return {
      versao: 1,
      atualizadoEm: new Date().toISOString(),
      receitas,
    };
  }

  function paraBase64(texto) {
    const bytes = new TextEncoder().encode(texto);
    let binario = '';
    const pedaco = 0x8000;
    for (let indice = 0; indice < bytes.length; indice += pedaco) {
      binario += String.fromCharCode(...bytes.subarray(indice, indice + pedaco));
    }
    return btoa(binario);
  }

  async function erroDaResposta(resposta, acao) {
    let detalhe = '';
    try {
      const corpo = await resposta.json();
      detalhe = corpo?.message || '';
    } catch {
      /* resposta sem corpo */
    }
    const dicas = {
      401: 'O token é inválido ou expirou. Gere outro e cole de novo.',
      403: 'O token não tem permissão de escrita em Contents, ou o limite do GitHub foi atingido.',
      404: 'Repositório não encontrado. Confira o nome e se o token tem acesso a ele.',
      409: 'O arquivo mudou enquanto publicávamos. Tente de novo.',
      422: 'O GitHub recusou o envio. Confira o repositório e tente novamente.',
    };
    return new Error(dicas[resposta.status] || `Falha no ${acao} (${resposta.status}).${detalhe ? ` ${detalhe}` : ''}`);
  }

  async function publicarNoGitHub(arquivo) {
    const { dono, nome } = partesDoRepo();
    const cabecalhos = {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    const respostaRepo = await fetch(`${API}/repos/${dono}/${nome}`, { headers: cabecalhos });
    if (!respostaRepo.ok) throw await erroDaResposta(respostaRepo, 'acesso ao repositório');
    const dadosRepo = await respostaRepo.json();
    const branch = dadosRepo.default_branch || 'main';

    const enderecoArquivo = `${API}/repos/${dono}/${nome}/contents/${ARQUIVO}`;
    const consulta = await fetch(`${enderecoArquivo}?ref=${encodeURIComponent(branch)}`, { headers: cabecalhos });
    let sha = null;
    if (consulta.ok) {
      sha = (await consulta.json()).sha;
    } else if (consulta.status !== 404) {
      throw await erroDaResposta(consulta, 'leitura do arquivo');
    }

    const corpo = {
      message: `Receitas atualizadas em ${new Date().toLocaleString('pt-BR')}`,
      content: paraBase64(JSON.stringify(arquivo, null, 2)),
      branch,
    };
    if (sha) corpo.sha = sha;

    const enviar = () => fetch(enderecoArquivo, {
      method: 'PUT',
      headers: { ...cabecalhos, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });

    let resposta = await enviar();
    if (resposta.status === 409) {
      const novo = await fetch(`${enderecoArquivo}?ref=${encodeURIComponent(branch)}`, { headers: cabecalhos });
      if (novo.ok) corpo.sha = (await novo.json()).sha;
      resposta = await enviar();
    }
    if (!resposta.ok) throw await erroDaResposta(resposta, 'envio das receitas');
  }

  async function executarPublicacao() {
    if (publicando) return;
    if (!configurado()) {
      desenharFormulario();
      return;
    }

    const receitas = window.ReceitaUI.getRecipes();
    if (!receitas.length && !window.confirm('Sua coleção está vazia. Publicar assim mesmo? O celular ficará sem receitas.')) {
      return;
    }

    publicando = true;
    const botao = $('#publicarAgora');
    const textoOriginal = botao?.textContent;
    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Publicando...';
    }
    try {
      if (!navigator.onLine) throw new Error('Sem internet. Conecte o computador e tente de novo.');
      const arquivo = montarArquivo();
      await publicarNoGitHub(arquivo);
      localStorage.setItem(PUBLICADO_EM_KEY, arquivo.atualizadoEm);
      atualizarStatus();
      desenharPronto();
      const total = receitas.length;
      mensagem(
        `Publicado! ${total} ${total === 1 ? 'receita está no ar' : 'receitas estão no ar'}. Abra o endereço no celular para ver.`,
        'ok'
      );
      window.ReceitaUI.showToast('Receitas publicadas para o celular.');
    } catch (erro) {
      const texto = erro?.message?.includes('Failed to fetch')
        ? 'Sem conexão com o GitHub. Verifique a internet e tente de novo.'
        : erro?.message || 'Não foi possível publicar agora.';
      if (corpoModal.querySelector('#publicarMsg')) {
        mensagem(texto);
      } else {
        desenharPronto();
        mensagem(texto);
      }
    } finally {
      publicando = false;
      const botaoAtual = $('#publicarAgora');
      if (botaoAtual) {
        botaoAtual.disabled = false;
        botaoAtual.textContent = textoOriginal || 'Publicar agora';
      }
    }
  }

  function baixarArquivo() {
    const arquivo = montarArquivo();
    const conteudo = JSON.stringify(arquivo, null, 2);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
    link.download = ARQUIVO;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    window.ReceitaUI.showToast(`Arquivo ${ARQUIVO} baixado. Envie ao GitHub pelo site.`);
  }

  /* ------------------------------------------------------------------ */
  /* Celular: busca as receitas publicadas                               */
  /* ------------------------------------------------------------------ */

  function prepararLeitura() {
    if (btnSidebar) {
      btnSidebar.disabled = true;
      btnSidebar.style.cursor = 'default';
    }
    statusTitulo.textContent = 'Somente leitura';
    const nota = $('.sidebar-footnote');
    if (nota) nota.textContent = 'As receitas são atualizadas pelo computador. Toque em Atualizar para buscar as novidades.';

    if (document.body.classList.contains('is-empty')) {
      const titulo = $('#emptyTitle');
      const texto = $('#emptyCopy');
      if (titulo) titulo.textContent = 'Buscando receitas...';
      if (texto) texto.textContent = 'Só um instante.';
    }
    rotuloDeAtualizacao();
    carregarPublicado({ silencioso: true });
  }

  async function carregarPublicado({ silencioso = false } = {}) {
    if (!SOMENTE_LEITURA) return;
    if (!navigator.onLine) {
      if (!silencioso) window.ReceitaUI.showToast('Sem internet — mostrando as últimas receitas salvas.');
      atualizarVazioSemPublicacao(false);
      rotuloDeAtualizacao();
      return;
    }

    btnAtualizar?.classList.add('is-busy');
    try {
      const resposta = await fetch(`${ARQUIVO}?t=${Date.now()}`, { cache: 'no-store' });
      if (resposta.status === 404) {
        const temCache = window.ReceitaUI.getRecipes().length > 0;
        if (!temCache) {
          window.ReceitaUI.replaceRecipes([]);
          localStorage.removeItem(PUBLICADO_EM_KEY);
          atualizarVazioSemPublicacao(true);
        }
        rotuloDeAtualizacao();
        if (!silencioso) {
          window.ReceitaUI.showToast(temCache
            ? 'Ainda não há receitas publicadas. Mostrando as salvas.'
            : 'Ainda não há receitas publicadas. Publique pelo computador.');
        }
        return;
      }
      if (!resposta.ok) throw new Error(String(resposta.status));
      const dados = await resposta.json();
      const lista = Array.isArray(dados) ? dados : dados?.receitas;
      if (!Array.isArray(lista)) throw new Error('formato inesperado');

      const receitas = lista
        .filter((item) => item && typeof item.name === 'string' && Array.isArray(item.ingredients) && typeof item.instructions === 'string')
        .map((item) => ({
          id: String(item.id || ''),
          name: String(item.name).trim(),
          ingredients: item.ingredients.map((ingrediente) => String(ingrediente).trim()).filter(Boolean),
          instructions: String(item.instructions || '').trim(),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
        }));

      window.ReceitaUI.replaceRecipes(receitas);
      if (dados?.atualizadoEm) localStorage.setItem(PUBLICADO_EM_KEY, dados.atualizadoEm);
      if (!receitas.length) atualizarVazioSemPublicacao(true);
      ultimaBusca = Date.now();
      rotuloDeAtualizacao();
      if (!silencioso) window.ReceitaUI.showToast('Receitas atualizadas.');
    } catch (erro) {
      rotuloDeAtualizacao();
      if (!silencioso) {
        window.ReceitaUI.showToast(
          erro?.message === '404'
            ? 'Ainda não há receitas publicadas.'
            : 'Não foi possível buscar agora. Mostrando as receitas salvas.'
        );
      }
    } finally {
      btnAtualizar?.classList.remove('is-busy');
    }
  }

  function atualizarVazioSemPublicacao(semArquivo) {
    if (!document.body.classList.contains('is-empty')) return;
    const titulo = $('#emptyTitle');
    const texto = $('#emptyCopy');
    if (titulo) titulo.textContent = semArquivo ? 'Nenhuma receita publicada ainda' : 'Nenhuma receita salva';
    if (texto) {
      texto.textContent = semArquivo
        ? 'No computador, abra o app e toque em Publicar.'
        : 'Conecte a internet e toque em Atualizar.';
    }
  }

  /* ------------------------------------------------------------------ */
  /* Ligações                                                            */
  /* ------------------------------------------------------------------ */

  if (SOMENTE_LEITURA) {
    prepararLeitura();
    btnAtualizar?.addEventListener('click', () => carregarPublicado({ silencioso: false }));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - ultimaBusca < 60000) return;
      carregarPublicado({ silencioso: true });
    });
    window.addEventListener('online', () => carregarPublicado({ silencioso: true }));
  } else {
    atualizarStatus();
    btnPublicar?.addEventListener('click', abrirModal);
    btnSidebar?.addEventListener('click', abrirModal);
    $('#closePublicarButton')?.addEventListener('click', () => window.ReceitaUI.closeModal(modal));
    modal?.addEventListener('click', (evento) => {
      if (evento.target === modal) window.ReceitaUI.closeModal(modal);
    });
  }
})();
