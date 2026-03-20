/**
 * GUIA DA CATEQUESE - Sistema Completo
 * Versão Final - Todos os bugs corrigidos
 * 
 * ✅ Edição funcionando (preenche formulário)
 * ✅ Catequizandos salvando corretamente
 * ✅ Tratamento de erro "No document to update"
 * ✅ Firebase Compat API estável
 */

// ==========================================
// CONFIGURAÇÃO FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCXkQPRRGrYa0bHrvK4KICRgMopeNkZMPw",
    authDomain: "catecismo-9565d.firebaseapp.com",
    projectId: "catecismo-9565d",
    storageBucket: "catecismo-9565d.firebasestorage.app",
    messagingSenderId: "706368409154",
    appId: "1:706368409154:web:8f577fb195e839644967db",
    measurementId: "G-1Y3JSRPLKM"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Estado global
const AppState = {
    currentCommentListener: null,
    catequizandosData: [],
    debounceTimers: {}
};

// ==========================================
// UTILITÁRIOS
// ==========================================

function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function formatDateTimestamp(timestamp) {
    if (!timestamp) return 'Agora';
    try {
        return timestamp.toDate().toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return 'Data inválida'; }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span aria-hidden="true">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${sanitizeHTML(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function debounce(func, wait, key) {
    if (AppState.debounceTimers[key]) clearTimeout(AppState.debounceTimers[key]);
    AppState.debounceTimers[key] = setTimeout(() => { func(); delete AppState.debounceTimers[key]; }, wait);
}

function setButtonLoading(button, loading) {
    const btnText = button?.querySelector('.btn-text');
    const btnLoading = button?.querySelector('.btn-loading');
    if (btnText) btnText.classList.toggle('hidden', loading);
    if (btnLoading) btnLoading.classList.toggle('hidden', !loading);
    if (button) button.disabled = loading;
}

// ==========================================
// NAVEGAÇÃO
// ==========================================

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => navigateTo(e.currentTarget.dataset.section));
    });
    
    document.querySelector('.dashboard-grid')?.addEventListener('click', (e) => {
        const card = e.target.closest('.dashboard-card[data-navigate]');
        if (card) navigateTo(card.dataset.navigate);
    });
    
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    sidebarToggle?.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        sidebarToggle.setAttribute('aria-expanded', isOpen);
        sidebarToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });
    
    document.querySelector('.main-content')?.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && document.getElementById('sidebar')?.classList.contains('open')) {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarToggle')?.setAttribute('aria-expanded', 'false');
        }
    });
}

function navigateTo(sectionId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        const isActive = item.dataset.section === sectionId;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    
    document.querySelectorAll('.content-section').forEach(section => {
        const isActive = section.id === sectionId;
        section.classList.toggle('active', isActive);
        section.hidden = !isActive;
    });
    
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarToggle')?.setAttribute('aria-expanded', 'false');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const sectionTitle = document.querySelector(`#${sectionId} h2`);
    sectionTitle?.setAttribute('tabindex', '-1');
    sectionTitle?.focus({ preventScroll: true });
}

window.navigateTo = navigateTo;

// ==========================================
// CRUD MODULE FACTORY
// ==========================================

function createCRUDModule({ collection, formId, listId, prefix, fields, createCard, supportsComments = false }) {
    const form = document.getElementById(formId);
    const listContainer = document.getElementById(listId);
    if (!form || !listContainer) {
        console.error(`CRUD Module: Elementos não encontrados - form: ${formId}, list: ${listId}`);
        return null;
    }
    
    function getFormData() {
        const data = {};
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                // ✅ CORREÇÃO CRÍTICA: chave e valor corretos
                data[field.key || field.id.replace(prefix, '')] = 
                    field.type === 'number' ? (parseInt(input.value) || 0) : input.value;
            }
        });
        return data;
    }
    
    function fillForm(data, id) {
        // ✅ Preencher ID hidden
        document.getElementById(`${prefix}Id`).value = id;
        
        // ✅ Preencher todos os campos do formulário
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const key = field.key || field.id.replace(prefix, '');
            if (input && data[key] !== undefined) {
                input.value = data[key] || '';
            }
        });
        
        // ✅ Mostrar botão cancelar
        const btnCancel = document.getElementById(`btnCancel${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`);
        if (btnCancel) btnCancel.classList.remove('hidden');
        
        // ✅ Atualizar texto do botão submit
        const btnSubmit = form.querySelector('.btn-primary');
        if (btnSubmit) {
            const defaultText = btnSubmit.querySelector('.btn-text')?.textContent || 'Salvar';
            btnSubmit.querySelector('.btn-text').textContent = 'Atualizar';
            btnSubmit.dataset.defaultText = defaultText;
        }
        
        // ✅ Scroll suave até o formulário
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        console.log(`✅ Formulário preenchido para edição: ${collection}/${id}`);
    }
    
    function resetForm() {
        form.reset();
        document.getElementById(`${prefix}Id`).value = '';
        
        const btnCancel = document.getElementById(`btnCancel${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`);
        if (btnCancel) btnCancel.classList.add('hidden');
        
        const btnSubmit = form.querySelector('.btn-primary');
        if (btnSubmit?.dataset.defaultText) {
            btnSubmit.querySelector('.btn-text').textContent = btnSubmit.dataset.defaultText;
        }
    }
    
    async function save() {
        const id = document.getElementById(`${prefix}Id`).value;
        const data = getFormData();
        const btnSubmit = form.querySelector('.btn-primary');
        
        console.log(`💾 Salvando ${collection}... ID: ${id || 'NOVO'}`);
        console.log('Dados:', data);
        
        try {
            setButtonLoading(btnSubmit, true);
            
            if (id) {
                // ✅ VERIFICAR se documento existe antes de atualizar
                const docRef = db.collection(collection).doc(id);
                const doc = await docRef.get();
                
                if (doc.exists) {
                    // Documento existe - atualizar
                    await docRef.update({
                        ...data,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    showToast('Registro atualizado com sucesso!', 'success');
                    console.log(`✅ Atualizado: ${collection}/${id}`);
                } else {
                    // Documento NÃO existe - criar novo
                    console.warn(`⚠️ Documento ${id} não encontrado. Criando novo...`);
                    const newRef = await db.collection(collection).add({
                        ...data,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    showToast('Documento não encontrado. Novo registro criado!', 'info');
                    console.log(`✅ Criado novo: ${collection}/${newRef.id}`);
                }
            } else {
                // Criar novo documento
                const newRef = await db.collection(collection).add({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast('Registro salvo com sucesso!', 'success');
                console.log(`✅ Criado: ${collection}/${newRef.id}`);
            }
            
            resetForm();
            await load();
            
        } catch (error) {
            console.error(`❌ Erro ao salvar ${collection}:`, error);
            
            // ✅ TRATAMENTO ESPECÍFICO para "No document to update"
            if (error.code === 'not-found' || error.message.includes('No document to update')) {
                showToast('Registro não encontrado. Criando novo...', 'info');
                try {
                    await db.collection(collection).add({
                        ...data,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    resetForm();
                    await load();
                } catch (retryError) {
                    showToast(`Erro ao criar registro: ${retryError.message}`, 'error');
                }
            } else {
                showToast(`Erro: ${error.message}`, 'error');
            }
        } finally {
            setButtonLoading(btnSubmit, false);
        }
    }
    
    async function load() {
        if (!listContainer) return;
        listContainer.innerHTML = '<div class="loading">Carregando...</div>';
        
        try {
            const snapshot = await db.collection(collection).orderBy('data', 'desc').get();
            
            if (snapshot.empty) {
                listContainer.innerHTML = '<div class="empty-state">Nenhum registro encontrado</div>';
                return;
            }
            
            // ✅ Acumular HTML antes de inserir (performance)
            const html = snapshot.docs.map(doc => {
                const data = doc.data();
                // ✅ Sanitizar dados contra XSS
                return createCard(doc.id, {
                    ...data,
                    tema: sanitizeHTML(data.tema), texto: sanitizeHTML(data.texto),
                    frase: sanitizeHTML(data.frase), causa: sanitizeHTML(data.causa),
                    detalhes: sanitizeHTML(data.detalhes), sacramento: sanitizeHTML(data.sacramento),
                    compromisso: sanitizeHTML(data.compromisso), reflexao: sanitizeHTML(data.reflexao),
                    pergunta: sanitizeHTML(data.pergunta), objetivo: sanitizeHTML(data.objetivo),
                    nome: sanitizeHTML(data.nome), local: sanitizeHTML(data.local),
                    contato: sanitizeHTML(data.contato), observacoes: sanitizeHTML(data.observacoes),
                    referencia: sanitizeHTML(data.referencia)
                });
            }).join('');
            
            listContainer.innerHTML = html;
            
            if (supportsComments) {
                snapshot.forEach(doc => listenComments(collection, doc.id));
            }
            
            console.log(`✅ Carregados ${snapshot.size} registros de ${collection}`);
            
        } catch (error) {
            console.error(`❌ Erro ao carregar ${collection}:`, error);
            listContainer.innerHTML = '<div class="empty-state">Erro ao carregar registros</div>';
        }
    }
    
    async function edit(id) {
        console.log(`📝 Editando ${collection}/${id}...`);
        
        try {
            const doc = await db.collection(collection).doc(id).get();
            
            // ✅ VERIFICAR se documento existe
            if (!doc.exists) {
                showToast('Registro não encontrado. Atualizando lista...', 'error');
                resetForm();
                await load();
                return;
            }
            
            fillForm(doc.data(), id);
            
        } catch (error) {
            console.error(`❌ Erro ao carregar ${id}:`, error);
            showToast('Erro ao carregar registro para edição', 'error');
            resetForm();
        }
    }
    
    async function remove(id) {
        if (!confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        try {
            await db.collection(collection).doc(id).delete();
            showToast('Registro excluído com sucesso!', 'success');
            console.log(`✅ Excluído: ${collection}/${id}`);
            await load();
        } catch (error) {
            console.error(`❌ Erro ao excluir ${id}:`, error);
            showToast('Erro ao excluir registro', 'error');
        }
    }
    
    function setupEventListeners() {
        // Submit do formulário
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            await save();
        });
        
        // Botão cancelar
        const btnCancel = document.getElementById(`btnCancel${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`);
        btnCancel?.addEventListener('click', () => {
            resetForm();
        });
        
        // Delegação de eventos para ações nos cards
        listContainer.addEventListener('click', async (e) => {
            // Toggle expandir/colapsar
            if (e.target.closest('.record-header')) {
                const card = e.target.closest('.record-card');
                const content = card?.querySelector('.record-content');
                const toggleBtn = card?.querySelector('.toggle-btn');
                
                if (content && toggleBtn) {
                    content.classList.toggle('expanded');
                    toggleBtn.classList.toggle('expanded');
                    toggleBtn.textContent = content.classList.contains('expanded') ? '▲' : '▼';
                }
            }
            
            // Botão editar
            const editBtn = e.target.closest('.btn-edit');
            if (editBtn) {
                const id = editBtn.dataset.id || editBtn.closest('.record-card')?.dataset.id;
                if (id) {
                    console.log(`🔘 Click editar: ${id}`);
                    await edit(id);
                }
            }
            
            // Botão excluir
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id || deleteBtn.closest('.record-card')?.dataset.id;
                if (id) await remove(id);
            }
            
            // Botão comentários
            if (supportsComments) {
                const commentBtn = e.target.closest('.btn-comment');
                if (commentBtn) {
                    const id = commentBtn.dataset.id;
                    const title = commentBtn.dataset.title;
                    if (id && title) openComentariosModal(collection, id, title);
                }
            }
        });
    }
    
    setupEventListeners();
    
    return { load, resetForm, save, edit, remove };
}

// ==========================================
// CONFIGURAÇÃO DOS MÓDULOS
// ==========================================

const FORM_FIELDS = {
    inicioFe: [
        { id: 'feData', key: 'data' },
        { id: 'feTema', key: 'tema' },
        { id: 'feObjetivo', key: 'objetivo' },
        { id: 'feTexto', key: 'texto' }
    ],
    evangelho: [
        { id: 'evData', key: 'data' },
        { id: 'evReferencia', key: 'referencia' },
        { id: 'evFrase', key: 'frase' },
        { id: 'evTexto', key: 'texto' }
    ],
    oracao: [
        { id: 'orData', key: 'data' },
        { id: 'orTipo', key: 'tipo' },
        { id: 'orCausa', key: 'causa' },
        { id: 'orDetalhes', key: 'detalhes' }
    ],
    sacramentos: [
        { id: 'saData', key: 'data' },
        { id: 'saSacramento', key: 'sacramento' },
        { id: 'saCompromisso', key: 'compromisso' },
        { id: 'saReflexao', key: 'reflexao' }
    ],
    missao: [
        { id: 'miData', key: 'data' },
        { id: 'miPergunta', key: 'pergunta' },
        { id: 'miObjetivo', key: 'objetivo' }
    ],
    catequizandos: [
        { id: 'catNome', key: 'nome' },
        { id: 'catIdade', key: 'idade', type: 'number' },
        { id: 'catTurma', key: 'turma' },
        { id: 'catLocal', key: 'local' },
        { id: 'catContato', key: 'contato' },
        { id: 'catObservacoes', key: 'observacoes' }
    ]
};

const CARD_TEMPLATES = {
    inicioFe: (id, data) => `
        <div class="record-header">
            <div class="record-title">
                <h4>${data.tema || 'Sem título'}</h4>
                <div class="record-meta">📅 ${formatDate(data.data)}</div>
            </div>
            <button class="toggle-btn" aria-label="Expandir">▼</button>
        </div>
        <div class="record-content">
            <div class="record-body">
                <div class="record-detail">
                    <div class="record-detail-label">Objetivo</div>
                    <div class="record-detail-text">${data.objetivo || '-'}</div>
                </div>
                <div class="record-detail">
                    <div class="record-detail-label">Texto</div>
                    <div class="record-detail-text">${data.texto || '-'}</div>
                </div>
                <div class="comentarios-section">
                    <h5>💬 Comentários</h5>
                    <div id="comentarios-${id}"></div>
                    <button class="btn btn-comment" data-id="${id}" data-title="${sanitizeHTML(data.tema)}">Ver/Adicionar Comentários</button>
                </div>
            </div>
        </div>
        <div class="record-footer">
            <button class="btn btn-edit" data-id="${id}">Editar</button>
            <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>`,
    
    evangelho: (id, data) => `
        <div class="record-header">
            <div class="record-title">
                <h4>${data.referencia || 'Sem referência'}</h4>
                <div class="record-meta">📅 ${formatDate(data.data)}</div>
            </div>
            <button class="toggle-btn" aria-label="Expandir">▼</button>
        </div>
        <div class="record-content">
            <div class="record-body">
                <div class="record-detail">
                    <div class="record-detail-label">Frase-Chave</div>
                    <div class="record-detail-text">${data.frase || '-'}</div>
                </div>
                <div class="record-detail">
                    <div class="record-detail-label">Texto</div>
                    <div class="record-detail-text">${data.texto || '-'}</div>
                </div>
                <div class="comentarios-section">
                    <h5>💬 Comentários</h5>
                    <div id="comentarios-${id}"></div>
                    <button class="btn btn-comment" data-id="${id}" data-title="${sanitizeHTML(data.referencia)}">Ver/Adicionar Comentários</button>
                </div>
            </div>
        </div>
        <div class="record-footer">
            <button class="btn btn-edit" data-id="${id}">Editar</button>
            <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>`,
    
    oracao: (id, data) => {
        const badge = `badge-${data.tipo?.toLowerCase() || 'pedido'}`;
        return `
        <div class="record-header">
            <div class="record-title">
                <h4>${data.causa || data.tipo || 'Sem título'}</h4>
                <div class="record-meta">
                    <span class="badge ${badge}">${data.tipo || 'Pedido'}</span>
                    📅 ${formatDate(data.data)}
                </div>
            </div>
            <button class="toggle-btn" aria-label="Expandir">▼</button>
        </div>
        <div class="record-content">
            <div class="record-body">
                <div class="record-detail">
                    <div class="record-detail-label">Detalhes</div>
                    <div class="record-detail-text">${data.detalhes || '-'}</div>
                </div>
            </div>
        </div>
        <div class="record-footer">
            <button class="btn btn-edit" data-id="${id}">Editar</button>
            <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>`;
    },
    
    sacramentos: (id, data) => `
        <div class="record-header">
            <div class="record-title">
                <h4>${data.sacramento || 'Sem título'}</h4>
                <div class="record-meta">📅 ${formatDate(data.data)}</div>
            </div>
            <button class="toggle-btn" aria-label="Expandir">▼</button>
        </div>
        <div class="record-content">
            <div class="record-body">
                <div class="record-detail">
                    <div class="record-detail-label">Compromisso</div>
                    <div class="record-detail-text">${data.compromisso || '-'}</div>
                </div>
                <div class="record-detail">
                    <div class="record-detail-label">Reflexão</div>
                    <div class="record-detail-text">${data.reflexao || '-'}</div>
                </div>
            </div>
        </div>
        <div class="record-footer">
            <button class="btn btn-edit" data-id="${id}">Editar</button>
            <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>`,
    
    missao: (id, data) => `
        <div class="record-header">
            <div class="record-title">
                <h4>${data.pergunta || 'Sem pergunta'}</h4>
                <div class="record-meta">📅 ${formatDate(data.data)}</div>
            </div>
            <button class="toggle-btn" aria-label="Expandir">▼</button>
        </div>
        <div class="record-content">
            <div class="record-body">
                <div class="record-detail">
                    <div class="record-detail-label">Objetivo</div>
                    <div class="record-detail-text">${data.objetivo || '-'}</div>
                </div>
                <div class="comentarios-section">
                    <h5>💬 Comentários</h5>
                    <div id="comentarios-${id}"></div>
                    <button class="btn btn-comment" data-id="${id}" data-title="${sanitizeHTML(data.pergunta)}">Ver/Adicionar Comentários</button>
                </div>
            </div>
        </div>
        <div class="record-footer">
            <button class="btn btn-edit" data-id="${id}">Editar</button>
            <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>`,
    
    catequizandos: (id, data) => {
        const badge = `badge-${data.turma?.toLowerCase() || 'outra'}`;
        return `
        <div class="record-header">
            <div class="record-title">
                <h4>👤 ${data.nome || 'Sem nome'}</h4>
                <div class="record-meta">
                    <span class="badge ${badge}">${data.turma || 'Outra'}</span>
                    🎂 ${data.idade || '?'} anos • 📍 ${data.local || '?'}
                </div>
            </div>
            <button class="toggle-btn" aria-label="Expandir">▼</button>
        </div>
        <div class="record-content">
            <div class="record-body">
                <div class="record-detail">
                    <div class="record-detail-label">Contato</div>
                    <div class="record-detail-text">${data.contato || '-'}</div>
                </div>
                <div class="record-detail">
                    <div class="record-detail-label">Observações</div>
                    <div class="record-detail-text">${data.observacoes || '-'}</div>
                </div>
            </div>
        </div>
        <div class="record-footer">
            <button class="btn btn-edit" data-id="${id}">Editar</button>
            <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>`;
    }
};

function createCardRenderer(templateFn) {
    return (id, data) => `<div class="record-card" data-id="${id}">${templateFn(id, data)}</div>`;
}

let crudModules = {};

function initializeCRUDModules() {
    crudModules.inicioFe = createCRUDModule({
        collection: 'inicioFe', formId: 'formInicioFe', listId: 'listaInicioFe',
        prefix: 'fe', fields: FORM_FIELDS.inicioFe,
        createCard: createCardRenderer(CARD_TEMPLATES.inicioFe), supportsComments: true
    });
    
    crudModules.evangelho = createCRUDModule({
        collection: 'evangelho', formId: 'formEvangelho', listId: 'listaEvangelho',
        prefix: 'ev', fields: FORM_FIELDS.evangelho,
        createCard: createCardRenderer(CARD_TEMPLATES.evangelho), supportsComments: true
    });
    
    crudModules.oracao = createCRUDModule({
        collection: 'oracao', formId: 'formOracao', listId: 'listaOracao',
        prefix: 'or', fields: FORM_FIELDS.oracao,
        createCard: createCardRenderer(CARD_TEMPLATES.oracao)
    });
    
    crudModules.sacramentos = createCRUDModule({
        collection: 'sacramentos', formId: 'formSacramentos', listId: 'listaSacramentos',
        prefix: 'sa', fields: FORM_FIELDS.sacramentos,
        createCard: createCardRenderer(CARD_TEMPLATES.sacramentos)
    });
    
    crudModules.missao = createCRUDModule({
        collection: 'missao', formId: 'formMissao', listId: 'listaMissao',
        prefix: 'mi', fields: FORM_FIELDS.missao,
        createCard: createCardRenderer(CARD_TEMPLATES.missao), supportsComments: true
    });
    
    // ✅ CATEQUIZANDOS - Configuração corrigida
    crudModules.catequizandos = createCRUDModule({
        collection: 'catequizandos', formId: 'formCatequizandos', listId: 'listaCatequizandos',
        prefix: 'cat', fields: FORM_FIELDS.catequizandos,
        createCard: createCardRenderer(CARD_TEMPLATES.catequizandos)
    });
    
    console.log('✅ Módulos CRUD inicializados:', Object.keys(crudModules).join(', '));
}

// ==========================================
// FILTROS DE CATEQUIZANDOS
// ==========================================

function setupCatequizandoFilters() {
    const searchInput = document.getElementById('searchCatequizando');
    const filterSelect = document.getElementById('filterTurma');
    
    function applyFilters() {
        const search = searchInput?.value.toLowerCase() || '';
        const turmaFilter = filterSelect?.value || '';
        const container = document.getElementById('listaCatequizandos');
        if (!container) return;
        
        const filtered = AppState.catequizandosData.filter(cat => {
            const matchSearch = !search || 
                cat.nome?.toLowerCase().includes(search) || 
                cat.turma?.toLowerCase().includes(search);
            const matchTurma = !turmaFilter || cat.turma === turmaFilter;
            return matchSearch && matchTurma;
        });
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum catequizando encontrado</div>';
            return;
        }
        
        container.innerHTML = filtered.map(cat => 
            CARD_TEMPLATES.catequizandos(cat.id, cat)
        ).join('');
    }
    
    searchInput?.addEventListener('input', () => {
        debounce(applyFilters, 300, 'catequizandoSearch');
    });
    
    filterSelect?.addEventListener('change', applyFilters);
}

// ==========================================
// COMENTÁRIOS
// ==========================================

function setupComentariosModal() {
    const modal = document.getElementById('modalComentarios');
    const modalClose = document.getElementById('modalClose');
    const formComentario = document.getElementById('formComentario');
    
    function closeModal() {
        modal?.setAttribute('aria-hidden', 'true');
        modal?.setAttribute('hidden', 'true');
        if (AppState.currentCommentListener) {
            AppState.currentCommentListener();
            AppState.currentCommentListener = null;
        }
        const lastFocus = document.querySelector('[data-last-focus]');
        if (lastFocus) {
            lastFocus.focus();
            lastFocus.removeAttribute('data-last-focus');
        }
    }
    
    window.openComentariosModal = function(collection, id, title) {
        const activeEl = document.activeElement;
        if (activeEl) activeEl.setAttribute('data-last-focus', 'true');
        
        document.getElementById('modalTitulo').textContent = sanitizeHTML(title);
        document.getElementById('comParentCollection').value = collection;
        document.getElementById('comParentId').value = id;
        document.getElementById('comNome').value = '';
        document.getElementById('comTexto').value = '';
        
        modal?.setAttribute('aria-hidden', 'false');
        modal?.removeAttribute('hidden');
        document.getElementById('comNome')?.focus();
        
        loadComentarios(collection, id);
    };
    
    modalClose?.addEventListener('click', closeModal);
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') {
            closeModal();
        }
    });
    
    // Trap focus
    modal?.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
    
    formComentario?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const collection = document.getElementById('comParentCollection').value;
        const parentId = document.getElementById('comParentId').value;
        const nome = document.getElementById('comNome').value.trim();
        const texto = document.getElementById('comTexto').value.trim();
        const btnSubmit = document.getElementById('btnSubmitComentario');
        
        if (!nome || !texto) {
            formComentario.reportValidity();
            return;
        }
        
        try {
            setButtonLoading(btnSubmit, true);
            await db.collection(collection).doc(parentId).collection('comentarios').add({
                nome: sanitizeHTML(nome),
                texto: sanitizeHTML(texto),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            document.getElementById('comTexto').value = '';
            showToast('Comentário adicionado!', 'success');
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            showToast('Erro ao adicionar comentário', 'error');
        } finally {
            setButtonLoading(btnSubmit, false);
        }
    });
    
    window.closeModal = closeModal;
}

function loadComentarios(collection, id) {
    const container = document.getElementById('listaComentarios');
    if (!container) return;
    
    if (AppState.currentCommentListener) {
        AppState.currentCommentListener();
    }
    
    try {
        AppState.currentCommentListener = db.collection(collection).doc(id).collection('comentarios')
            .orderBy('createdAt', 'asc')
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    container.innerHTML = '<div class="empty-state" style="padding:1rem;">Nenhum comentário ainda</div>';
                } else {
                    container.innerHTML = snapshot.docs.map(doc => {
                        const com = doc.data();
                        return `
                            <div class="comentario-item">
                                <div class="comentario-nome">👤 ${sanitizeHTML(com.nome)}</div>
                                <div class="comentario-texto">${sanitizeHTML(com.texto)}</div>
                                <div class="comentario-data">${formatDateTimestamp(com.createdAt)}</div>
                            </div>`;
                    }).join('');
                }
            });
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        container.innerHTML = '<div class="empty-state">Erro ao carregar comentários</div>';
    }
}

function listenComments(collection, id) {
    const container = document.getElementById(`comentarios-${id}`);
    if (!container) return;
    
    db.collection(collection).doc(id).collection('comentarios')
        .orderBy('createdAt', 'desc').limit(3)
        .onSnapshot((snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = '<div style="color:#999;font-size:0.85rem;">Sem comentários</div>';
            } else {
                container.innerHTML = snapshot.docs.map(doc => {
                    const com = doc.data();
                    return `
                        <div class="comentario-item" style="margin-bottom:0.5rem;">
                            <div class="comentario-nome">${sanitizeHTML(com.nome)}</div>
                            <div class="comentario-texto">${sanitizeHTML(com.texto)}</div>
                        </div>`;
                }).join('');
            }
        });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function loadAllData() {
    // Carregar todos os módulos
    Object.values(crudModules).forEach(module => {
        if (module?.load) {
            module.load();
        }
    });
    
    // Carregar dados de catequizandos para filtro
    try {
        const snapshot = await db.collection('catequizandos').orderBy('nome').get();
        AppState.catequizandosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ Carregados ${AppState.catequizandosData.length} catequizandos`);
    } catch (e) {
        console.error('Erro ao carregar catequizandos:', e);
    }
}

// Inicialização principal
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🕊️ Guia da Catequese - Sistema Iniciado');
    console.log('Firebase:', firebase.apps.length > 0 ? '✅ Conectado' : '❌ Falhou');
    
    setupNavigation();
    setupComentariosModal();
    initializeCRUDModules();
    setupCatequizandoFilters();
    
    // Aguardar módulos estarem prontos
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadAllData();
    
    console.log('✅ Sistema pronto para uso');
});

// Teste de conexão Firebase (remover em produção se desejar)
async function testFirebaseConnection() {
    try {
        console.log('🔍 Testando conexão Firebase...');
        const ref = await db.collection('test_connection').add({
            teste: true,
            ts: new Date().toISOString()
        });
        console.log('✅ Firebase OK! Documento:', ref.id);
        // Limpar teste
        await db.collection('test_connection').doc(ref.id).delete();
    } catch (e) {
        console.error('❌ Firebase erro:', e.code, e.message);
        showToast(`Firebase: ${e.message}`, 'error');
    }
}

// Executar teste após carregamento
setTimeout(testFirebaseConnection, 3000);
