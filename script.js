/**
 * GUIA DA CATEQUESE - Sistema Completo
 * VERSÃO CORRIGIDA E OTIMIZADA
 * 
 * Melhorias aplicadas:
 * - Correção de sintaxe em objetos de dados
 * - Sanitização contra XSS
 * - Event delegation em vez de handlers inline
 * - Código DRY com factory functions
 * - Async/await padronizado
 * - Acessibilidade completa no modal
 * - Feedback visual de loading
 * - Debounce em buscas
 */

// ==========================================
// CONFIGURAÇÃO E INICIALIZAÇÃO
// ==========================================

// Configuração do Firebase (em produção, considerar variáveis de ambiente)
const firebaseConfig = {
    apiKey: "AIzaSyCXkQPRRGrYa0bHrvK4KICRgMopeNkZMPw",
    authDomain: "catecismo-9565d.firebaseapp.com",
    projectId: "catecismo-9565d",
    storageBucket: "catecismo-9565d.firebasestorage.app",
    messagingSenderId: "706368409154",
    appId: "1:706368409154:web:8f577fb195e839644967db",
    measurementId: "G-1Y3JSRPLKM"
};

// Inicializar Firebase apenas uma vez
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Estado global da aplicação
const AppState = {
    currentComentarioListener: null,
    catequizandosData: [],
    activeSection: 'dashboard',
    debounceTimers: {}
};

// ==========================================
// UTILITÁRIOS GERAIS
// ==========================================

/**
 * Sanitiza string para prevenir XSS ao inserir no innerHTML
 * @param {string} str - Texto a ser sanitizado
 * @returns {string} - Texto seguro para HTML
 */
function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Formata data no formato brasileiro DD/MM/YYYY
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {string} - Data formatada
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Formata timestamp do Firestore para formato legível
 * @param {firebase.firestore.Timestamp} timestamp
 * @returns {string}
 */
function formatDateTimestamp(timestamp) {
    if (!timestamp) return 'Agora';
    try {
        const date = timestamp.toDate();
        return date.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return 'Data inválida';
    }
}

/**
 * Exibe toast notification com animação
 * @param {string} message - Mensagem a exibir
 * @param {'success'|'error'|'info'} type - Tipo do toast
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <span aria-hidden="true">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${sanitizeHTML(message)}</span>
    `;
    
    container.appendChild(toast);
    
    // Remover após 4 segundos
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Debounce para funções executadas frequentemente
 * @param {Function} func - Função a ser debounced
 * @param {number} wait - Tempo em ms
 * @param {string} key - Chave única para o timer
 */
function debounce(func, wait, key) {
    if (AppState.debounceTimers[key]) {
        clearTimeout(AppState.debounceTimers[key]);
    }
    AppState.debounceTimers[key] = setTimeout(() => {
        func();
        delete AppState.debounceTimers[key];
    }, wait);
}

/**
 * Alterna estado de loading em botões
 * @param {HTMLButtonElement} button
 * @param {boolean} loading
 */
function setButtonLoading(button, loading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (btnText) btnText.classList.toggle('hidden', loading);
    if (btnLoading) btnLoading.classList.toggle('hidden', !loading);
    button.disabled = loading;
}

// ==========================================
// NAVEGAÇÃO E UI
// ==========================================

/**
 * Configura todos os event listeners de navegação
 */
function setupNavigation() {
    // Navegação por sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            navigateTo(section);
        });
    });
    
    // Navegação por cards do dashboard (delegation)
    document.querySelector('.dashboard-grid')?.addEventListener('click', (e) => {
        const card = e.target.closest('.dashboard-card[data-navigate]');
        if (card) {
            navigateTo(card.dataset.navigate);
        }
    });
    
    // Toggle sidebar mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    sidebarToggle?.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        sidebarToggle.setAttribute('aria-expanded', isOpen);
        sidebarToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });
    
    // Fechar sidebar ao clicar no overlay (mobile)
    document.querySelector('.main-content')?.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            sidebarToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Navega para uma seção específica
 * @param {string} sectionId - ID da seção destino
 */
function navigateTo(sectionId) {
    // Atualizar estado
    AppState.activeSection = sectionId;
    
    // Atualizar navegação visual
    document.querySelectorAll('.nav-item').forEach(item => {
        const isActive = item.dataset.section === sectionId;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    
    // Mostrar/ocultar seções
    document.querySelectorAll('.content-section').forEach(section => {
        const isActive = section.id === sectionId;
        section.classList.toggle('active', isActive);
        section.hidden = !isActive;
    });
    
    // Fechar sidebar mobile após navegação
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        sidebar.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
    }
    
    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Focar no título da seção para acessibilidade
    const sectionTitle = document.querySelector(`#${sectionId} h2`);
    sectionTitle?.setAttribute('tabindex', '-1');
    sectionTitle?.focus({ preventScroll: true });
}

// Expor para uso em HTML (se necessário)
window.navigateTo = navigateTo;

// ==========================================
// FACTORY PARA CRUD GENÉRICO
// ==========================================

/**
 * Cria um módulo CRUD reutilizável para uma coleção
 * @param {Object} config - Configuração do módulo
 * @returns {Object} - Métodos do CRUD
 */
function createCRUDModule({
    collection,
    formId,
    listId,
    prefix,
    fields,
    createCard,
    onEditCallback
}) {
    const form = document.getElementById(formId);
    const listContainer = document.getElementById(listId);
    
    if (!form || !listContainer) {
        console.warn(`CRUD Module: Elementos não encontrados para ${collection}`);
        return null;
    }
    
    /**
     * Coleta dados do formulário
     * @returns {Object}
     */
    function getFormData() {
        const data = {};
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                // CORREÇÃO CRÍTICA: atribuir chave e valor corretamente
                data[field.key || field.id.replace(prefix, '')] = 
                    field.type === 'number' 
                        ? parseInt(input.value) || 0 
                        : input.value;
            }
        });
        return data;
    }
    
    /**
     * Preenche formulário com dados
     * @param {Object} data
     * @param {string} id
     */
    function fillForm(data, id) {
        document.getElementById(`${prefix}Id`).value = id;
        
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const key = field.key || field.id.replace(prefix, '');
            if (input && data[key] !== undefined) {
                input.value = data[key];
            }
        });
        
        // Mostrar botão cancelar e atualizar texto do submit
        const btnCancel = document.getElementById(`btnCancel${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`);
        const btnSubmit = form.querySelector('.btn-primary');
        
        if (btnCancel) btnCancel.classList.remove('hidden');
        if (btnSubmit) {
            const defaultText = btnSubmit.querySelector('.btn-text')?.textContent || 'Salvar';
            btnSubmit.querySelector('.btn-text').textContent = 'Atualizar';
            // Armazenar texto original para reset
            btnSubmit.dataset.defaultText = defaultText;
        }
        
        // Scroll suave para o formulário
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    /**
     * Reseta formulário para estado inicial
     */
    function resetForm() {
        form.reset();
        document.getElementById(`${prefix}Id`).value = '';
        
        const btnCancel = document.getElementById(`btnCancel${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`);
        const btnSubmit = form.querySelector('.btn-primary');
        
        if (btnCancel) btnCancel.classList.add('hidden');
        if (btnSubmit && btnSubmit.dataset.defaultText) {
            btnSubmit.querySelector('.btn-text').textContent = btnSubmit.dataset.defaultText;
        }
    }
    
    /**
     * Salva registro (create ou update)
     */
    async function save() {
        const id = document.getElementById(`${prefix}Id`).value;
        const data = getFormData();
        const btnSubmit = form.querySelector('.btn-primary');
        
        try {
            setButtonLoading(btnSubmit, true);
            
            if (id) {
                // Update
                await db.collection(collection).doc(id).update(data);
                showToast('Registro atualizado com sucesso!', 'success');
            } else {
                // Create
                await db.collection(collection).add(data);
                showToast('Registro salvo com sucesso!', 'success');
            }
            
            resetForm();
            await load();
            
        } catch (error) {
            console.error(`Erro ao salvar ${collection}:`, error);
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            setButtonLoading(btnSubmit, false);
        }
    }
    
    /**
     * Carrega e renderiza registros
     */
    async function load() {
        if (!listContainer) return;
        
        listContainer.innerHTML = '<div class="loading">Carregando...</div>';
        
        try {
            const snapshot = await db.collection(collection)
                .orderBy('data', 'desc')
                .get();
            
            if (snapshot.empty) {
                listContainer.innerHTML = '<div class="empty-state">Nenhum registro encontrado</div>';
                return;
            }
            
            // CORREÇÃO: acumular HTML e inserir uma vez (evita reflow múltiplo)
            const html = snapshot.docs.map(doc => {
                const data = doc.data();
                // CORREÇÃO: sanitizar dados antes de inserir no HTML
                return createCard(doc.id, {
                    ...data,
                    // Sanitizar campos de texto
                    tema: sanitizeHTML(data.tema),
                    texto: sanitizeHTML(data.texto),
                    frase: sanitizeHTML(data.frase),
                    causa: sanitizeHTML(data.causa),
                    detalhes: sanitizeHTML(data.detalhes),
                    sacramento: sanitizeHTML(data.sacramento),
                    compromisso: sanitizeHTML(data.compromisso),
                    reflexao: sanitizeHTML(data.reflexao),
                    pergunta: sanitizeHTML(data.pergunta),
                    objetivo: sanitizeHTML(data.objetivo),
                });
            }).join('');
            
            listContainer.innerHTML = html;
            
            // Configurar listeners para comentários (se aplicável)
            if (['inicioFe', 'evangelho', 'missao'].includes(collection)) {
                snapshot.forEach(doc => {
                    listenComments(collection, doc.id);
                });
            }
            
        } catch (error) {
            console.error(`Erro ao carregar ${collection}:`, error);
            listContainer.innerHTML = '<div class="empty-state">Erro ao carregar registros</div>';
        }
    }
    
    /**
     * Prepara edição de registro
     * @param {string} id
     */
    async function edit(id) {
        try {
            const doc = await db.collection(collection).doc(id).get();
            if (doc.exists) {
                fillForm(doc.data(), id);
                if (onEditCallback) onEditCallback(doc.data(), id);
            }
        } catch (error) {
            console.error(`Erro ao carregar registro ${id}:`, error);
            showToast('Erro ao carregar registro', 'error');
        }
    }
    
    /**
     * Exclui registro com confirmação
     * @param {string} id
     */
    async function remove(id) {
        if (!confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        try {
            await db.collection(collection).doc(id).delete();
            showToast('Registro excluído com sucesso!', 'success');
            await load();
        } catch (error) {
            console.error(`Erro ao excluir ${id}:`, error);
            showToast('Erro ao excluir registro', 'error');
        }
    }
    
    /**
     * Configura event listeners do formulário
     */
    function setupEventListeners() {
        // Submit do formulário
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Validação básica do HTML5
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
            const target = e.target;
            
            // Toggle expandir/colapsar
            if (target.closest('.record-header')) {
                const card = target.closest('.record-card');
                const content = card?.querySelector('.record-content');
                const toggleBtn = card?.querySelector('.toggle-btn');
                
                if (content && toggleBtn) {
                    content.classList.toggle('expanded');
                    toggleBtn.classList.toggle('expanded');
                    toggleBtn.textContent = content.classList.contains('expanded') ? '▲' : '▼';
                }
            }
            
            // Botão editar
            const editBtn = target.closest('.btn-edit');
            if (editBtn) {
                const id = editBtn.dataset.id || editBtn.closest('.record-card')?.dataset.id;
                if (id) await edit(id);
            }
            
            // Botão excluir
            const deleteBtn = target.closest('.btn-delete');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id || deleteBtn.closest('.record-card')?.dataset.id;
                if (id) await remove(id);
            }
            
            // Botão comentários
            const commentBtn = target.closest('.btn-comment');
            if (commentBtn) {
                const id = commentBtn.dataset.id;
                const title = commentBtn.dataset.title;
                if (id && title) {
                    openComentariosModal(collection, id, title);
                }
            }
        });
    }
    
    // Inicializar módulo
    setupEventListeners();
    
    // Expor métodos públicos
    return {
        load,
        resetForm,
        save,
        edit,
        remove
    };
}

// ==========================================
// CONFIGURAÇÃO DOS MÓDULOS CRUD
// ==========================================

// Definição dos campos para cada formulário (DRY)
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

// Factory para criar função de renderização de card
function createCardRenderer(templateFn) {
    return (id, data) => {
        // Adicionar data attributes para event delegation
        const html = templateFn(id, data);
        return `<div class="record-card" data-id="${id}">${html}</div>`;
    };
}

// Templates de cards (separados para organização)
const CARD_TEMPLATES = {
    inicioFe: (id, data) => `
        <div class="record-header">
            <div class="record-title">
                <h4>${data.tema || 'Sem título'}</h4>
                <div class="record-meta">📅 ${formatDate(data.data)}</div>
            </div>
            <button class="toggle-btn" aria-label="Expandir detalhes" aria-expanded="false">▼</button>
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
                    <button class="btn btn-comment" data-id="${id}" data-title="${sanitizeHTML(data.tema)}">
                        Ver/Adicionar Comentários
                    </button>
                </div>
            </div>
        </div>
        <div class="record-footer">
            <button class="btn btn-edit" data-id="${id}">Editar</button>
            <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>
    `,
    
    evangelho: (id, data) => `
        <div class="record-header">
            <div class="record-title">
                <h4>${data.referencia || 'Sem referência'}</h4>
                <div class="record-meta">📅 ${formatDate(data.data)}</div>
            </div>
            <button class="toggle-btn" aria-label="Expandir detalhes" aria-expanded="false">▼</button>
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
                    <button class="btn btn-comment" data-id="${id}" data-title="${sanitizeHTML(data.referencia)}">
                        Ver/Adicionar Comentários
                    </button>
                </div>
            </div>
        </div>
        <div class="record-footer">
            <button class="btn btn-edit" data-id="${id}">Editar</button>
            <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>
    `,
    
    oracao: (id, data) => {
        const badgeClass = `badge-${data.tipo?.toLowerCase() || 'pedido'}`;
        return `
            <div class="record-header">
                <div class="record-title">
                    <h4>${data.causa || data.tipo || 'Sem título'}</h4>
                    <div class="record-meta">
                        <span class="badge ${badgeClass}">${data.tipo || 'Pedido'}</span>
                        📅 ${formatDate(data.data)}
                    </div>
                </div>
                <button class="toggle-btn" aria-label="Expandir detalhes" aria-expanded="false">▼</button>
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
            </div>
        `;
    },
    
    sacramentos: (id, data) => `
        <div class="record-header">
            <div class="record-title">
                <h4>${data.sacramento || 'Sem título'}</h4>
                <div class="record-meta">📅 ${formatDate(data.data)}</div>
            </div>
            <button class="toggle-btn" aria-label="Expandir detalhes" aria-expanded="false">▼</button>
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
        </div>
    `,
    
    missao: (id, data) => `
        <div class="record-header">
            <div class="record-title">
                <h4>${data.pergunta || 'Sem pergunta'}</h4>
                <div class="record-meta">📅 ${formatDate(data.data)}</div>
            </div>
            <button class="toggle-btn" aria-label="Expandir detalhes" aria-expanded="false">▼</button>
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
                    <button class="btn btn-comment" data-id="${id}" data-title="${sanitizeHTML(data.pergunta)}">
                        Ver/Adicionar Comentários
                    </button>
                </div>
            </div>
        </div>
        <div class="record-footer">
            <button class="btn btn-edit" data-id="${id}">Editar</button>
            <button class="btn btn-delete" data-id="${id}">Excluir</button>
        </div>
    `,
    
    catequizandos: (id, data) => {
        const badgeClass = `badge-${data.turma?.toLowerCase() || 'outra'}`;
        return `
            <div class="record-header">
                <div class="record-title">
                    <h4>👤 ${data.nome || 'Sem nome'}</h4>
                    <div class="record-meta">
                        <span class="badge ${badgeClass}">${data.turma || 'Outra'}</span>
                        🎂 ${data.idade || '?'} anos • 📍 ${data.local || '?'}
                    </div>
                </div>
                <button class="toggle-btn" aria-label="Expandir detalhes" aria-expanded="false">▼</button>
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
            </div>
        `;
    }
};

// ==========================================
// INICIALIZAÇÃO DOS MÓDULOS
// ==========================================

let crudModules = {};

function initializeCRUDModules() {
    // Início da Fé
    crudModules.inicioFe = createCRUDModule({
        collection: 'inicioFe',
        formId: 'formInicioFe',
        listId: 'listaInicioFe',
        prefix: 'fe',
        fields: FORM_FIELDS.inicioFe,
        createCard: createCardRenderer(CARD_TEMPLATES.inicioFe)
    });
    
    // Evangelho
    crudModules.evangelho = createCRUDModule({
        collection: 'evangelho',
        formId: 'formEvangelho',
        listId: 'listaEvangelho',
        prefix: 'ev',
        fields: FORM_FIELDS.evangelho,
        createCard: createCardRenderer(CARD_TEMPLATES.evangelho)
    });
    
    // Oração (ID corrigido: formOracao)
    crudModules.oracao = createCRUDModule({
        collection: 'oracao',
        formId: 'formOracao',
        listId: 'listaOracao',
        prefix: 'or',
        fields: FORM_FIELDS.oracao,
        createCard: createCardRenderer(CARD_TEMPLATES.oracao)
    });
    
    // Sacramentos
    crudModules.sacramentos = createCRUDModule({
        collection: 'sacramentos',
        formId: 'formSacramentos',
        listId: 'listaSacramentos',
        prefix: 'sa',
        fields: FORM_FIELDS.sacramentos,
        createCard: createCardRenderer(CARD_TEMPLATES.sacramentos)
    });
    
    // Missão
    crudModules.missao = createCRUDModule({
        collection: 'missao',
        formId: 'formMissao',
        listId: 'listaMissao',
        prefix: 'mi',
        fields: FORM_FIELDS.missao,
        createCard: createCardRenderer(CARD_TEMPLATES.missao)
    });
    
    // Catequizandos (com filtro personalizado)
    crudModules.catequizandos = createCRUDModule({
        collection: 'catequizandos',
        formId: 'formCatequizandos',
        listId: 'listaCatequizandos',
        prefix: 'cat',
        fields: FORM_FIELDS.catequizandos,
        createCard: createCardRenderer(CARD_TEMPLATES.catequizandos),
        onEditCallback: (data) => {
            // Manter dados em cache para filtro
            AppState.catequizandosData = AppState.catequizandosData.map(c => 
                c.id === data.id ? { id: data.id, ...data } : c
            );
        }
    });
}

// ==========================================
// FILTRO DE CATEQUIZANDOS (com debounce)
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
        
        container.innerHTML = filtered
            .map(cat => CARD_TEMPLATES.catequizandos(cat.id, cat))
            .join('');
    }
    
    searchInput?.addEventListener('input', () => {
        debounce(applyFilters, 300, 'catequizandoSearch');
    });
    
    filterSelect?.addEventListener('change', applyFilters);
}

// ==========================================
// SISTEMA DE COMENTÁRIOS
// ==========================================

function setupComentariosModal() {
    const modal = document.getElementById('modalComentarios');
    const modalClose = document.getElementById('modalClose');
    const formComentario = document.getElementById('formComentario');
    
    // Fechar modal
    function closeModal() {
        modal?.setAttribute('aria-hidden', 'true');
        modal?.setAttribute('hidden', 'true');
        
        // Limpar listener em tempo real
        if (AppState.currentComentarioListener) {
            AppState.currentComentarioListener();
            AppState.currentComentarioListener = null;
        }
        
        // Restaurar foco no elemento que abriu o modal
        const lastFocus = document.querySelector('[data-last-focus]');
        if (lastFocus) {
            lastFocus.focus();
            lastFocus.removeAttribute('data-last-focus');
        }
    }
    
    // Abrir modal
    window.openComentariosModal = function(collection, id, title) {
        // Salvar referência do elemento que abriu para restaurar foco
        const activeEl = document.activeElement;
        if (activeEl) activeEl.setAttribute('data-last-focus', 'true');
        
        document.getElementById('modalTitulo').textContent = sanitizeHTML(title);
        document.getElementById('comParentCollection').value = collection;
        document.getElementById('comParentId').value = id;
        
        // Reset form
        document.getElementById('comNome').value = '';
        document.getElementById('comTexto').value = '';
        
        modal?.setAttribute('aria-hidden', 'false');
        modal?.removeAttribute('hidden');
        
        // Focar no primeiro campo do modal para acessibilidade
        document.getElementById('comNome')?.focus();
        
        loadComentarios(collection, id);
    };
    
    // Close button
    modalClose?.addEventListener('click', closeModal);
    
    // Fechar ao clicar fora do conteúdo
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Fechar com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') {
            closeModal();
        }
    });
    
    // Trap focus dentro do modal (acessibilidade)
    modal?.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
    
    // Submit do formulário de comentário
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
    
    // Expor closeModal globalmente
    window.closeModal = closeModal;
}

function loadComentarios(collection, id) {
    const container = document.getElementById('listaComentarios');
    if (!container) return;
    
    // Limpar listener anterior
    if (AppState.currentComentarioListener) {
        AppState.currentComentarioListener();
    }
    
    try {
        // Listener em tempo real
        AppState.currentComentarioListener = db
            .collection(collection)
            .doc(id)
            .collection('comentarios')
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
                            </div>
                        `;
                    }).join('');
                }
            });
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        container.innerHTML = '<div class="empty-state">Erro ao carregar comentários</div>';
    }
}

/**
 * Listener para comentários inline nos cards (limitado a 3)
 */
function listenComments(collection, id) {
    const container = document.getElementById(`comentarios-${id}`);
    if (!container) return;
    
    db.collection(collection)
        .doc(id)
        .collection('comentarios')
        .orderBy('createdAt', 'desc')
        .limit(3)
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
                        </div>
                    `;
                }).join('');
            }
        });
}

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================

function setupSearchAndFilters() {
    setupCatequizandoFilters();
}

async function loadAllData() {
    // Carregar módulos que foram inicializados
    Object.values(crudModules).forEach(module => {
        if (module?.load) module.load();
    });
}

// Event listener principal
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🕊️ Guia da Catequese - Sistema Iniciado');
    
    // Setup na ordem correta
    setupNavigation();
    setupComentariosModal();
    initializeCRUDModules();
    setupSearchAndFilters();
    
    // Carregar dados após tudo estar configurado
    await loadAllData();
    
    console.log('✅ Sistema pronto para uso');
});

// Expor funções necessárias globalmente (para handlers em HTML, se houver)
window.navigateTo = navigateTo;
window.openComentariosModal = window.openComentariosModal;
window.closeModal = window.closeModal;
