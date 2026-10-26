const STORAGE_KEY = 'receita-facil:recipes:v1';
const INSTALL_HINT_KEY = 'receita-facil:install-hint';

const state = {
  recipes: loadRecipes(),
  search: '',
  editingId: null,
  selectedId: null,
  pendingDeleteId: null,
};

const $ = (selector) => document.querySelector(selector);
const els = {
  recipeGrid: $('#recipeGrid'),
  emptyState: $('#emptyState'),
  emptyTitle: $('#emptyTitle'),
  emptyCopy: $('#emptyCopy'),
  recipeCount: $('#recipeCount'),
  recipeCountHelper: $('#recipeCountHelper'),
  visibleCount: $('#visibleCount'),
  searchInput: $('#searchInput'),
  formModal: $('#formModal'),
  detailModal: $('#detailModal'),
  confirmModal: $('#confirmModal'),
  recipeForm: $('#recipeForm'),
  formModalTitle: $('#formModalTitle'),
  nameInput: $('#nameInput'),
  ingredientsInput: $('#ingredientsInput'),
  instructionsInput: $('#instructionsInput'),
  markdownFileInput: $('#markdownFileInput'),
  detailHeading: $('#detailHeading'),
  detailContent: $('#detailContent'),
  toast: $('#toast'),
  installBanner: $('#installBanner'),
  installTitle: $('#installTitle'),
  installText: $('#installText'),
  installButton: $('#installButton'),
  dismissInstallButton: $('#dismissInstallButton'),
};

let toastTimer;
let previousFocus;
let deferredInstallPrompt = null;

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function loadRecipes() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter(isRecipe).map((recipe) => ({
      id: isUuid(recipe.id) ? recipe.id : makeId(),
      name: recipe.name.trim(),
      ingredients: recipe.ingredients.map((item) => String(item).trim()).filter(Boolean),
      instructions: String(recipe.instructions || '').trim(),
      createdAt: recipe.createdAt || new Date().toISOString(),
      updatedAt: recipe.updatedAt || recipe.createdAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function isRecipe(item) {
  return item && typeof item.name === 'string' && Array.isArray(item.ingredients) && typeof item.instructions === 'string';
}

function activeRecipes() {
  return state.recipes;
}

function saveRecipes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recipes));
    return true;
  } catch {
    showToast('Não foi possível salvar neste navegador.');
    return false;
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  if (!value) return 'Agora';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)).replace('.', '').replace(' de ', ' ');
  } catch {
    return 'Agora';
  }
}

function normalize(value) {
  return String(value || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getVisibleRecipes() {
  const query = normalize(state.search.trim());
  return [...activeRecipes()]
    .filter((recipe) => {
      if (!query) return true;
      return normalize([recipe.name, recipe.ingredients.join(' '), recipe.instructions].join(' ')).includes(query);
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

function render() {
  renderStats();
  const recipes = getVisibleRecipes();
  els.visibleCount.textContent = recipes.length
    ? `${recipes.length} ${recipes.length === 1 ? 'receita' : 'receitas'}`
    : 'Nenhuma receita';
  document.body.classList.toggle('is-empty', activeRecipes().length === 0);

  if (!recipes.length) {
    els.recipeGrid.innerHTML = '';
    els.emptyState.classList.remove('hidden');
    const hasSearch = Boolean(state.search);
    els.emptyTitle.textContent = hasSearch ? 'Nenhuma receita encontrada' : 'Seu caderno ainda está em branco';
    els.emptyCopy.textContent = hasSearch ? 'Tente outro termo para encontrar sua receita.' : 'Que tal guardar aquela receita que todo mundo pede?';
    $('#emptyAddButton').textContent = hasSearch ? 'Cadastrar nova receita' : 'Cadastrar primeira receita';
    return;
  }

  els.emptyState.classList.add('hidden');
  els.recipeGrid.innerHTML = recipes.map(renderRecipeCard).join('');
  els.recipeGrid.querySelectorAll('.recipe-card').forEach((card) => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetail(card.dataset.id);
      }
    });
  });
}

function renderStats() {
  const total = activeRecipes().length;
  els.recipeCount.textContent = total;
  els.recipeCountHelper.textContent = total ? 'Prontas para consultar e imprimir.' : 'Comece sua coleção hoje.';
}

function renderRecipeCard(recipe) {
  const ingredientsPreview = recipe.ingredients.slice(0, 3).join(' · ');
  const instructionsPreview = recipe.instructions ? `<p class="card-preview">${escapeHtml(recipe.instructions)}</p>` : '';
  return `<article class="recipe-card" data-id="${escapeHtml(recipe.id)}" tabindex="0" role="button" aria-label="Abrir receita ${escapeHtml(recipe.name)}">
    <div class="card-top"><span class="category-tag">receita</span><span class="card-arrow" aria-hidden="true">↗</span></div>
    <h3>${escapeHtml(recipe.name)}</h3>
    <div class="card-meta"><span><i class="meta-dot"></i>${recipe.ingredients.length} ${recipe.ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}</span></div>
    ${instructionsPreview}
    <div class="card-footer"><span class="card-ingredients">${escapeHtml(ingredientsPreview || 'Sem ingredientes listados')}</span><span>${formatDate(recipe.updatedAt || recipe.createdAt)}</span></div>
  </article>`;
}

function openForm(id = null) {
  state.editingId = id;
  const recipe = id ? state.recipes.find((item) => item.id === id) : null;
  els.formModalTitle.textContent = recipe ? 'Editar receita' : 'Nova receita';
  els.nameInput.value = recipe?.name || '';
  els.ingredientsInput.value = recipe?.ingredients?.join('\n') || '';
  els.instructionsInput.value = recipe?.instructions || '';
  showModal(els.formModal);
}

function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(els.recipeForm);
  const name = String(formData.get('name') || '').trim();
  const ingredients = String(formData.get('ingredients') || '').split('\n').map((item) => item.trim()).filter(Boolean);
  const instructions = String(formData.get('instructions') || '').trim();
  if (!name || !ingredients.length) {
    showToast('Informe o nome e pelo menos um ingrediente.');
    return;
  }

  const now = new Date().toISOString();
  const payload = { name, ingredients, instructions, updatedAt: now };
  const previousRecipes = state.recipes;
  const nextRecipes = state.editingId
    ? state.recipes.map((recipe) => recipe.id === state.editingId ? { ...recipe, ...payload } : recipe)
    : [...state.recipes, { id: makeId(), createdAt: now, ...payload }];
  state.recipes = nextRecipes;

  if (!saveRecipes()) {
    state.recipes = previousRecipes;
    return;
  }
  showToast(state.editingId ? 'Receita atualizada com carinho.' : 'Receita guardada no seu caderno.');
  closeModal(els.formModal);
  render();
}

function openDetail(id) {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe) return;
  state.selectedId = id;
  els.detailHeading.innerHTML = `<div class="detail-heading-wrap"><span class="category-tag">receita</span><h2 id="detailTitle">${escapeHtml(recipe.name)}</h2><div class="detail-submeta"><span>${recipe.ingredients.length} ${recipe.ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}</span><span>Atualizada em ${formatDate(recipe.updatedAt || recipe.createdAt)}</span></div></div>`;
  const instructionsBlock = recipe.instructions ? `<div class="detail-block"><h3>Modo de preparo</h3><p class="instructions">${escapeHtml(recipe.instructions)}</p></div>` : '';
  els.detailContent.innerHTML = `<div class="detail-block"><h3>Ingredientes</h3><ul class="ingredient-list">${recipe.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>${instructionsBlock}`;
  showModal(els.detailModal, { focusDialog: true });
}

function requestDelete(id = state.selectedId) {
  if (!id) return;
  state.pendingDeleteId = id;
  showModal(els.confirmModal);
}

function confirmDelete() {
  if (!state.pendingDeleteId) return;
  const deletedName = state.recipes.find((recipe) => recipe.id === state.pendingDeleteId)?.name;
  const previousRecipes = state.recipes;
  state.recipes = state.recipes.filter((recipe) => recipe.id !== state.pendingDeleteId);
  if (!saveRecipes()) {
    state.recipes = previousRecipes;
    return;
  }
  state.pendingDeleteId = null;
  state.selectedId = null;
  closeModal(els.confirmModal);
  closeModal(els.detailModal);
  render();
  showToast(deletedName ? `“${deletedName}” foi excluída.` : 'Receita excluída do caderno.');
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function recipeToMarkdown(recipe) {
  const ingredients = recipe.ingredients.map((item) => `- ${item}`).join('\n');
  const instructionsSection = recipe.instructions ? `\n\n### Modo de preparo\n${recipe.instructions}` : '';
  return `## ${recipe.name}\n\n### Ingredientes\n${ingredients}${instructionsSection}`;
}

async function saveFile(filename, content, mimeType) {
  const file = new File([content], filename, { type: mimeType });
  const prefersShareSheet = window.matchMedia?.('(pointer: coarse)').matches;
  if (prefersShareSheet && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Backup do Receita Fácil' });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  downloadTextFile(filename, content, mimeType);
  return 'downloaded';
}

async function exportMarkdown() {
  if (!activeRecipes().length) {
    showToast('Cadastre pelo menos uma receita antes de criar o backup.');
    return;
  }
  const sorted = [...activeRecipes()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const markdown = `# Receita Fácil\n\nBackup editável da coleção de receitas.\n\n${sorted.map(recipeToMarkdown).join('\n\n---\n\n')}\n`;
  const date = new Date().toISOString().slice(0, 10);
  const result = await saveFile(`receitas-${date}.md`, markdown, 'text/markdown;charset=utf-8');
  if (result === 'shared') showToast('Backup pronto para salvar ou enviar.');
  else if (result === 'downloaded') showToast('Backup Markdown baixado.');
}

function parseMarkdownRecipes(markdown) {
  const sections = markdown.split(/\n\s*---\s*\n/).map((section) => section.trim()).filter(Boolean);
  const parsed = [];
  sections.forEach((section) => {
    const titleMatch = section.match(/^##\s+(.+)$/m);
    if (!titleMatch) return;
    const ingredientsMatch = section.match(/###\s+Ingredientes\s*\n([\s\S]*?)(?=\n###\s+Modo de preparo|$)/i);
    const instructionsMatch = section.match(/###\s+Modo de preparo\s*\n([\s\S]*)$/i);
    const ingredients = (ingredientsMatch?.[1] || '').split('\n').map((line) => line.replace(/^\s*[-*]\s+/, '').trim()).filter(Boolean);
    let instructions = (instructionsMatch?.[1] || '').trim();
    if (instructions === '_Nenhum modo de preparo informado._') instructions = '';
    if (titleMatch[1].trim() && ingredients.length) parsed.push({
      id: makeId(),
      name: titleMatch[1].trim(),
      ingredients,
      instructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
  return parsed;
}

async function importMarkdown(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    const imported = parseMarkdownRecipes(await file.text());
    if (!imported.length) {
      showToast('Não encontrei receitas nesse arquivo Markdown.');
      return;
    }
    const shouldReplace = window.confirm(`Encontrei ${imported.length} ${imported.length === 1 ? 'receita' : 'receitas'}.\n\nOK substitui sua coleção atual.\nCancelar adiciona ao que já existe.`);
    const previousRecipes = state.recipes;
    state.recipes = shouldReplace ? imported : [...state.recipes, ...imported];
    if (!saveRecipes()) {
      state.recipes = previousRecipes;
      return;
    }
    render();
    showToast(`${imported.length} ${imported.length === 1 ? 'receita importada' : 'receitas importadas'} com sucesso.`);
  } catch {
    showToast('Não foi possível ler esse arquivo Markdown.');
  }
}

function exportRecipes() {
  if (!activeRecipes().length) {
    showToast('Cadastre pelo menos uma receita antes de exportar.');
    return;
  }
  const sorted = [...activeRecipes()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const cards = sorted.map((recipe) => {
    const ingredients = recipe.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const instructionsColumn = recipe.instructions ? `<div><h3>Modo de preparo</h3><p>${escapeHtml(recipe.instructions).replace(/\n/g, '<br>')}</p></div>` : '';
    return `<article class="print-recipe"><div class="print-category">receita</div><h2>${escapeHtml(recipe.name)}</h2><div class="print-columns"><div><h3>Ingredientes</h3><ul>${ingredients}</ul></div>${instructionsColumn}</div></article>`;
  }).join('');
  const generatedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
  const printHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Receitas — Receita Fácil</title><style>
    @page { size: A4; margin: 13mm; }
    * { box-sizing: border-box; } body { margin:0; color:#172d36; font-family:Arial, sans-serif; font-size:9.5pt; line-height:1.42; }
    .print-header { display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:10px; border-bottom:2px solid #176b61; margin-bottom:14px; }
    .print-header h1 { margin:0; font-size:21pt; letter-spacing:-.04em; } .print-header p { margin:3px 0 0; color:#607078; font-size:9pt; }
    .print-count { color:#607078; font-size:9pt; text-align:right; } .print-count strong { display:block; color:#176b61; font-size:12pt; }
    .print-grid { column-count:2; column-gap:12px; }
    .print-recipe { display:inline-block; width:100%; vertical-align:top; break-inside:avoid; page-break-inside:avoid; margin:0 0 12px; border:1px solid #d9e2de; border-radius:7px; padding:10px 11px 11px; }
    .print-category { color:#954633; font-size:7pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; } .print-recipe h2 { margin:4px 0 8px; color:#172d36; font-size:13.5pt; line-height:1.12; }
    .print-columns { display:grid; grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr); gap:10px; }
    .print-columns h3 { color:#176b61; margin:0 0 4px; font-size:7.5pt; letter-spacing:.08em; text-transform:uppercase; } .print-columns ul { margin:0; padding-left:14px; } .print-columns li { margin:0 0 2px; } .print-columns p { margin:0; color:#3d4d53; }
    .print-footer { color:#879294; font-size:7.5pt; margin-top:15px; padding-top:7px; border-top:1px solid #e4e9e6; }
    @media print { .print-footer { position:fixed; bottom:0; left:0; right:0; } }
  </style></head><body><header class="print-header"><div><h1>Receita Fácil</h1><p>Minha coleção de receitas</p></div><div class="print-count"><strong>${sorted.length} ${sorted.length === 1 ? 'receita' : 'receitas'}</strong>Gerado em ${escapeHtml(generatedAt)}</div></header><main class="print-grid">${cards}</main><footer class="print-footer">Receita Fácil · seu caderno digital</footer></body></html>`;
  const printUrl = URL.createObjectURL(new Blob([printHtml], { type: 'text/html' }));
  const printWindow = window.open(printUrl, '_blank');
  if (!printWindow) {
    URL.revokeObjectURL(printUrl);
    showToast('Permita pop-ups para abrir a folha de impressão.');
    return;
  }
  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 350);
    window.setTimeout(() => URL.revokeObjectURL(printUrl), 1500);
  };
  printWindow.addEventListener('load', triggerPrint, { once: true });
  window.setTimeout(triggerPrint, 1200);
  showToast('Folha pronta. Escolha “Salvar como PDF” na impressão.');
}

function getActiveModal() {
  return [...document.querySelectorAll('.modal-backdrop')].find((modal) => !modal.classList.contains('hidden'));
}

function showModal(modal, options = {}) {
  if (!getActiveModal() && document.activeElement) previousFocus = document.activeElement;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.body.classList.add('modal-open');
  const dialog = modal.querySelector('.modal');
  const focusTarget = options.focus
    ? modal.querySelector(options.focus)
    : options.focusDialog
      ? dialog
      : modal.querySelector('input, textarea, button');
  if (focusTarget) window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 0);
}

function closeModal(modal) {
  modal.classList.add('hidden');
  if (!getActiveModal()) {
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
    previousFocus = null;
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  toastTimer = window.setTimeout(() => els.toast.classList.add('hidden'), 3500);
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOSDevice() {
  const ua = navigator.userAgent || '';
  const iPadAsMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadAsMac;
}

function canShowInstallHint() {
  if (isStandalone()) return false;
  if (!window.matchMedia?.('(max-width: 900px)').matches) return false;
  if (location.protocol === 'file:') return false;
  try {
    return localStorage.getItem(INSTALL_HINT_KEY) !== 'dismissed';
  } catch {
    return true;
  }
}

function showInstallHint(mode) {
  if (!canShowInstallHint()) return;
  if (mode === 'ios') {
    els.installTitle.textContent = 'Adicione à Tela de Início';
    els.installText.innerHTML = 'No Safari, toque em <strong>Compartilhar</strong> e escolha <strong>Adicionar à Tela de Início</strong>.';
    els.installButton.classList.add('hidden');
  } else if (mode === 'prompt') {
    els.installTitle.textContent = 'Instale o Receita Fácil';
    els.installText.textContent = 'Ícone próprio na tela inicial e acesso mesmo sem internet.';
    els.installButton.classList.remove('hidden');
  } else {
    return;
  }
  els.installBanner.classList.remove('hidden');
  document.body.classList.add('install-visible');
}

function dismissInstallHint() {
  els.installBanner.classList.add('hidden');
  document.body.classList.remove('install-visible');
  try {
    localStorage.setItem(INSTALL_HINT_KEY, 'dismissed');
  } catch {
    /* modo privado pode bloquear o armazenamento */
  }
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  try {
    await deferredInstallPrompt.userChoice;
  } catch {
    /* usuário pode fechar o diálogo */
  }
  deferredInstallPrompt = null;
  dismissInstallHint();
}

function prepareInstallExperience() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallHint('prompt');
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    dismissInstallHint();
    showToast('Aplicativo instalado. Bom apetite!');
  });

  window.setTimeout(() => {
    if (isIOSDevice()) showInstallHint('ios');
  }, 2200);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!secure) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* sem service worker o app continua funcionando, só não abre offline */
    });
  });
}

async function keepStorageSafe() {
  try {
    if (!navigator.storage?.persist) return;
    if (await navigator.storage.persisted()) return;
    await navigator.storage.persist();
  } catch {
    /* alguns navegadores não permitem; o backup em .md continua sendo a garantia */
  }
}

function bindEvents() {
  $('#topAddButton').addEventListener('click', () => openForm());
  $('#emptyAddButton').addEventListener('click', () => openForm());
  $('#fabAddButton').addEventListener('click', () => openForm());
  $('#exportMarkdownButton').addEventListener('click', exportMarkdown);
  $('#importMarkdownButton').addEventListener('click', () => els.markdownFileInput.click());
  els.markdownFileInput.addEventListener('change', importMarkdown);
  $('#topExportButton').addEventListener('click', exportRecipes);
  $('#closeFormButton').addEventListener('click', () => closeModal(els.formModal));
  $('#cancelFormButton').addEventListener('click', () => closeModal(els.formModal));
  $('#closeDetailButton').addEventListener('click', () => closeModal(els.detailModal));
  $('#editButton').addEventListener('click', () => { closeModal(els.detailModal); openForm(state.selectedId); });
  $('#deleteButton').addEventListener('click', () => requestDelete());
  $('#cancelDeleteButton').addEventListener('click', () => closeModal(els.confirmModal));
  $('#confirmDeleteButton').addEventListener('click', confirmDelete);
  els.installButton.addEventListener('click', installApp);
  els.dismissInstallButton.addEventListener('click', dismissInstallHint);
  els.recipeForm.addEventListener('submit', handleFormSubmit);
  els.searchInput.addEventListener('input', (event) => { state.search = event.target.value; render(); });
  [els.formModal, els.detailModal, els.confirmModal].forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal); }));
  document.addEventListener('keydown', (event) => {
    const activeModal = getActiveModal();
    if (!activeModal) return;
    if (event.key === 'Escape') {
      closeModal(activeModal);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...activeModal.querySelectorAll('button, input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

bindEvents();
render();
registerServiceWorker();
prepareInstallExperience();
keepStorageSafe();

// Pontes usadas pelo módulo de publicação (publicar.js).
window.ReceitaUI = {
  showModal,
  closeModal,
  showToast,
  render,
  getRecipes: () => activeRecipes(),
  replaceRecipes(recipes) {
    state.recipes = recipes;
    saveRecipes();
    render();
  },
};

// Atalho do app instalado: "Nova receita" abre o formulário direto (só no computador).
if (
  !document.documentElement.classList.contains('modo-leitura')
  && new URLSearchParams(window.location.search).get('nova') === '1'
) {
  window.setTimeout(() => openForm(), 80);
  window.history.replaceState(null, '', window.location.pathname + window.location.hash);
}

