/**
 * GUIA DA CATEQUESE - Sistema Completo
 */

// Configuração do Firebase
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variáveis globais
let currentComentarioListener = null;
let catequizandosData = [];

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupForms();
    setupSearchAndFilters();
    setupComentariosModal();
    loadAllData();
});

// ==========================================
// NAVEGAÇÃO
// ==========================================
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            navigateTo(section);
        });
    });
}

function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if(item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
    
    window.scrollTo(0, 0);
}

window.navigateTo = navigateTo;

// ==========================================
// SETUP DOS FORMULÁRIOS
// ==========================================
function setupForms() {
    // Início da Fé
    document.getElementById('formInicioFe').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveInicioFe();
    });
    
    // Evangelho
    document.getElementById('formEvangelho').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveEvangelho();
    });
    
    // Oração
    document.getElementById('formOração').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveOração();
    });
    
    // Sacramentos
    document.getElementById('formSacramentos').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSacramentos();
    });
    
    // Missão
    document.getElementById('formMissao').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveMissao();
    });
    
    // Catequizandos
    document.getElementById('formCatequizandos').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCatequizando();
    });
}

function setupSearchAndFilters() {
    document.getElementById('searchCatequizando').addEventListener('input', filterCatequizandos);
    document.getElementById('filterTurma').addEventListener('change', filterCatequizandos);
}

// ==========================================
// INÍCIO DA FÉ
// ==========================================
async function saveInicioFe() {
    const id = document.getElementById('feId').value;
    const data = {
        data: document.getElementById('feData').value,
        tema: document.getElementById('feTema').value,
        objetivo: document.getElementById('feObjetivo').value,
        texto: document.getElementById('feTexto').value
    };
    
    try {
        if(id) {
            await db.collection('inicioFe').doc(id).update(data);
            showMessage('Registro atualizado!');
        } else {
            await db.collection('inicioFe').add(data);
            showMessage('Registro salvo!');
        }
        resetForm('fe');
        loadInicioFe();
    } catch(error) {
        console.error('Erro:', error);
        showMessage('Erro ao salvar', 'error');
    }
}

async function loadInicioFe() {
    const container = document.getElementById('listaInicioFe');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const snapshot = await db.collection('inicioFe').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            container.innerHTML += createInicioFeCard(doc.id, data);
            listenComments('inicioFe', doc.id);
        });
    } catch(error) {
        container.innerHTML = '<div class="empty-state">Erro ao carregar</div>';
    }
}

function createInicioFeCard(id, data) {
    return `
        <div class="record-card">
            <div class="record-header" onclick="toggleRecord('${id}')">
                <div class="record-title">
                    <h4>${data.tema}</h4>
                    <div class="record-meta">📅 ${formatDate(data.data)}</div>
                </div>
                <button class="toggle-btn" onclick="event.stopPropagation()">▼</button>
            </div>
            <div class="record-content" id="content-${id}">
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
                    <button class="btn btn-comment" onclick="openComentariosModal('inicioFe', '${id}', '${data.tema}')">
                        Ver/Adicionar Comentários
                    </button>
                </div>
            </div>
            <div class="record-footer">
                <button class="btn btn-edit" onclick="editInicioFe('${id}')">Editar</button>
                <button class="btn btn-delete" onclick="deleteRecord('inicioFe', '${id}')">Excluir</button>
            </div>
        </div>
    `;
}

async function editInicioFe(id) {
    const doc = await db.collection('inicioFe').doc(id).get();
    const data = doc.data();
    
    document.getElementById('feId').value = id;
    document.getElementById('feData').value = data.data;
    document.getElementById('feTema').value = data.tema;
    document.getElementById('feObjetivo').value = data.objetivo || '';
    document.getElementById('feTexto').value = data.texto || '';
    
    document.getElementById('btnCancelFe').style.display = 'inline-block';
    document.querySelector('#formInicioFe .btn-primary').textContent = 'Atualizar';
    document.getElementById('formInicioFe').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// EVANGELHO
// ==========================================
async function saveEvangelho() {
    const id = document.getElementById('evId').value;
    const data = {
        data: document.getElementById('evData').value,
        referencia: document.getElementById('evReferencia').value,
        frase: document.getElementById('evFrase').value,
        texto: document.getElementById('evTexto').value
    };
    
    try {
        if(id) {
            await db.collection('evangelho').doc(id).update(data);
            showMessage('Atualizado!');
        } else {
            await db.collection('evangelho').add(data);
            showMessage('Salvo!');
        }
        resetForm('ev');
        loadEvangelho();
    } catch(error) {
        showMessage('Erro', 'error');
    }
}

async function loadEvangelho() {
    const container = document.getElementById('listaEvangelho');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const snapshot = await db.collection('evangelho').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            container.innerHTML += createEvangelhoCard(doc.id, doc.data());
            listenComments('evangelho', doc.id);
        });
    } catch(error) {
        container.innerHTML = '<div class="empty-state">Erro</div>';
    }
}

function createEvangelhoCard(id, data) {
    return `
        <div class="record-card">
            <div class="record-header" onclick="toggleRecord('${id}')">
                <div class="record-title">
                    <h4>${data.referencia}</h4>
                    <div class="record-meta">📅 ${formatDate(data.data)}</div>
                </div>
                <button class="toggle-btn" onclick="event.stopPropagation()">▼</button>
            </div>
            <div class="record-content" id="content-${id}">
                <div class="record-detail">
                    <div class="record-detail-label">Frase</div>
                    <div class="record-detail-text">${data.frase || '-'}</div>
                </div>
                <div class="record-detail">
                    <div class="record-detail-label">Texto</div>
                    <div class="record-detail-text">${data.texto || '-'}</div>
                </div>
                <div class="comentarios-section">
                    <h5>💬 Comentários</h5>
                    <div id="comentarios-${id}"></div>
                    <button class="btn btn-comment" onclick="openComentariosModal('evangelho', '${id}', '${data.referencia}')">
                        Ver/Adicionar Comentários
                    </button>
                </div>
            </div>
            <div class="record-footer">
                <button class="btn btn-edit" onclick="editEvangelho('${id}')">Editar</button>
                <button class="btn btn-delete" onclick="deleteRecord('evangelho', '${id}')">Excluir</button>
            </div>
        </div>
    `;
}

async function editEvangelho(id) {
    const doc = await db.collection('evangelho').doc(id).get();
    const data = doc.data();
    
    document.getElementById('evId').value = id;
    document.getElementById('evData').value = data.data;
    document.getElementById('evReferencia').value = data.referencia;
    document.getElementById('evFrase').value = data.frase || '';
    document.getElementById('evTexto').value = data.texto || '';
    
    document.getElementById('btnCancelEv').style.display = 'inline-block';
    document.querySelector('#formEvangelho .btn-primary').textContent = 'Atualizar';
}

// ==========================================
// ORAÇÃO
// ==========================================
async function saveOração() {
    const id = document.getElementById('orId').value;
    const data = {
        data: document.getElementById('orData').value,
        tipo: document.getElementById('orTipo').value,
        causa: document.getElementById('orCausa').value,
        detalhes: document.getElementById('orDetalhes').value
    };
    
    try {
        if(id) {
            await db.collection('oracao').doc(id).update(data);
        } else {
            await db.collection('oracao').add(data);
        }
        resetForm('or');
        loadOração();
        showMessage('Salvo!');
    } catch(error) {
        showMessage('Erro', 'error');
    }
}

async function loadOração() {
    const container = document.getElementById('listaOração');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const snapshot = await db.collection('oracao').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            container.innerHTML += createOraçãoCard(doc.id, doc.data());
        });
    } catch(error) {
        container.innerHTML = '<div class="empty-state">Erro</div>';
    }
}

function createOraçãoCard(id, data) {
    const badgeClass = `badge-${data.tipo.toLowerCase()}`;
    return `
        <div class="record-card">
            <div class="record-header" onclick="toggleRecord('${id}')">
                <div class="record-title">
                    <h4>${data.causa || data.tipo}</h4>
                    <div class="record-meta">
                        <span class="badge ${badgeClass}">${data.tipo}</span>
                        📅 ${formatDate(data.data)}
                    </div>
                </div>
                <button class="toggle-btn" onclick="event.stopPropagation()">▼</button>
            </div>
            <div class="record-content" id="content-${id}">
                <div class="record-detail">
                    <div class="record-detail-label">Detalhes</div>
                    <div class="record-detail-text">${data.detalhes || '-'}</div>
                </div>
            </div>
            <div class="record-footer">
                <button class="btn btn-edit" onclick="editOração('${id}')">Editar</button>
                <button class="btn btn-delete" onclick="deleteRecord('oracao', '${id}')">Excluir</button>
            </div>
        </div>
    `;
}

async function editOração(id) {
    const doc = await db.collection('oracao').doc(id).get();
    const data = doc.data();
    
    document.getElementById('orId').value = id;
    document.getElementById('orData').value = data.data;
    document.getElementById('orTipo').value = data.tipo;
    document.getElementById('orCausa').value = data.causa || '';
    document.getElementById('orDetalhes').value = data.detalhes || '';
    
    document.getElementById('btnCancelOr').style.display = 'inline-block';
    document.querySelector('#formOração .btn-primary').textContent = 'Atualizar';
}

// ==========================================
// SACRAMENTOS
// ==========================================
async function saveSacramentos() {
    const id = document.getElementById('saId').value;
    const data = {
        data: document.getElementById('saData').value,
        sacramento: document.getElementById('saSacramento').value,
        compromisso: document.getElementById('saCompromisso').value,
        reflexao: document.getElementById('saReflexao').value
    };
    
    try {
        if(id) {
            await db.collection('sacramentos').doc(id).update(data);
        } else {
            await db.collection('sacramentos').add(data);
        }
        resetForm('sa');
        loadSacramentos();
        showMessage('Salvo!');
    } catch(error) {
        showMessage('Erro', 'error');
    }
}

async function loadSacramentos() {
    const container = document.getElementById('listaSacramentos');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const snapshot = await db.collection('sacramentos').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            container.innerHTML += createSacramentosCard(doc.id, doc.data());
        });
    } catch(error) {
        container.innerHTML = '<div class="empty-state">Erro</div>';
    }
}

function createSacramentosCard(id, data) {
    return `
        <div class="record-card">
            <div class="record-header" onclick="toggleRecord('${id}')">
                <div class="record-title">
                    <h4>${data.sacramento}</h4>
                    <div class="record-meta">📅 ${formatDate(data.data)}</div>
                </div>
                <button class="toggle-btn" onclick="event.stopPropagation()">▼</button>
            </div>
            <div class="record-content" id="content-${id}">
                <div class="record-detail">
                    <div class="record-detail-label">Compromisso</div>
                    <div class="record-detail-text">${data.compromisso || '-'}</div>
                </div>
                <div class="record-detail">
                    <div class="record-detail-label">Reflexão</div>
                    <div class="record-detail-text">${data.reflexao || '-'}</div>
                </div>
            </div>
            <div class="record-footer">
                <button class="btn btn-edit" onclick="editSacramentos('${id}')">Editar</button>
                <button class="btn btn-delete" onclick="deleteRecord('sacramentos', '${id}')">Excluir</button>
            </div>
        </div>
    `;
}

async function editSacramentos(id) {
    const doc = await db.collection('sacramentos').doc(id).get();
    const data = doc.data();
    
    document.getElementById('saId').value = id;
    document.getElementById('saData').value = data.data;
    document.getElementById('saSacramento').value = data.sacramento;
    document.getElementById('saCompromisso').value = data.compromisso || '';
    document.getElementById('saReflexao').value = data.reflexao || '';
    
    document.getElementById('btnCancelSa').style.display = 'inline-block';
    document.querySelector('#formSacramentos .btn-primary').textContent = 'Atualizar';
}

// ==========================================
// MISSÃO
// ==========================================
async function saveMissao() {
    const id = document.getElementById('miId').value;
    const data = {
        data: document.getElementById('miData').value,
        pergunta: document.getElementById('miPergunta').value,
        objetivo: document.getElementById('miObjetivo').value
    };
    
    try {
        if(id) {
            await db.collection('missao').doc(id).update(data);
        } else {
            await db.collection('missao').add(data);
        }
        resetForm('mi');
        loadMissao();
        showMessage('Salvo!');
    } catch(error) {
        showMessage('Erro', 'error');
    }
}

async function loadMissao() {
    const container = document.getElementById('listaMissao');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const snapshot = await db.collection('missao').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            container.innerHTML += createMissaoCard(doc.id, doc.data());
            listenComments('missao', doc.id);
        });
    } catch(error) {
        container.innerHTML = '<div class="empty-state">Erro</div>';
    }
}

function createMissaoCard(id, data) {
    return `
        <div class="record-card">
            <div class="record-header" onclick="toggleRecord('${id}')">
                <div class="record-title">
                    <h4>${data.pergunta}</h4>
                    <div class="record-meta">📅 ${formatDate(data.data)}</div>
                </div>
                <button class="toggle-btn" onclick="event.stopPropagation()">▼</button>
            </div>
            <div class="record-content" id="content-${id}">
                <div class="record-detail">
                    <div class="record-detail-label">Objetivo</div>
                    <div class="record-detail-text">${data.objetivo || '-'}</div>
                </div>
                <div class="comentarios-section">
                    <h5>💬 Comentários</h5>
                    <div id="comentarios-${id}"></div>
                    <button class="btn btn-comment" onclick="openComentariosModal('missao', '${id}', '${data.pergunta}')">
                        Ver/Adicionar Comentários
                    </button>
                </div>
            </div>
            <div class="record-footer">
                <button class="btn btn-edit" onclick="editMissao('${id}')">Editar</button>
                <button class="btn btn-delete" onclick="deleteRecord('missao', '${id}')">Excluir</button>
            </div>
        </div>
    `;
}

async function editMissao(id) {
    const doc = await db.collection('missao').doc(id).get();
    const data = doc.data();
    
    document.getElementById('miId').value = id;
    document.getElementById('miData').value = data.data;
    document.getElementById('miPergunta').value = data.pergunta;
    document.getElementById('miObjetivo').value = data.objetivo || '';
    
    document.getElementById('btnCancelMi').style.display = 'inline-block';
    document.querySelector('#formMissao .btn-primary').textContent = 'Atualizar';
}

// ==========================================
// CATEQUIZANDOS
// ==========================================
async function saveCatequizando() {
    const id = document.getElementById('catId').value;
    const data = {
        nome: document.getElementById('catNome').value,
        idade: parseInt(document.getElementById('catIdade').value),
        turma: document.getElementById('catTurma').value,
        local: document.getElementById('catLocal').value,
        contato: document.getElementById('catContato').value,
        observacoes: document.getElementById('catObservacoes').value
    };
    
    try {
        if(id) {
            await db.collection('catequizandos').doc(id).update(data);
            showMessage('Atualizado!');
        } else {
            await db.collection('catequizandos').add(data);
            showMessage('Cadastrado!');
        }
        resetForm('cat');
        loadCatequizandos();
    } catch(error) {
        showMessage('Erro', 'error');
    }
}

async function loadCatequizandos() {
    const container = document.getElementById('listaCatequizandos');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const snapshot = await db.collection('catequizandos').orderBy('nome').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum catequizando</div>';
            return;
        }
        
        catequizandosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        filterCatequizandos();
    } catch(error) {
        container.innerHTML = '<div class="empty-state">Erro</div>';
    }
}

function filterCatequizandos() {
    const search = document.getElementById('searchCatequizando').value.toLowerCase();
    const turmaFilter = document.getElementById('filterTurma').value;
    const container = document.getElementById('listaCatequizandos');
    
    let filtered = catequizandosData.filter(cat => {
        const matchSearch = cat.nome.toLowerCase().includes(search) || cat.turma.toLowerCase().includes(search);
        const matchTurma = !turmaFilter || cat.turma === turmaFilter;
        return matchSearch && matchTurma;
    });
    
    if(filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum encontrado</div>';
        return;
    }
    
    container.innerHTML = '';
    filtered.forEach(cat => {
        container.innerHTML += createCatequizandoCard(cat);
    });
}

function createCatequizandoCard(cat) {
    const badgeClass = `badge-${cat.turma.toLowerCase()}`;
    return `
        <div class="record-card">
            <div class="record-header" onclick="toggleRecord('${cat.id}')">
                <div class="record-title">
                    <h4>👤 ${cat.nome}</h4>
                    <div class="record-meta">
                        <span class="badge ${badgeClass}">${cat.turma}</span>
                        🎂 ${cat.idade} anos • 📍 ${cat.local}
                    </div>
                </div>
                <button class="toggle-btn" onclick="event.stopPropagation()">▼</button>
            </div>
            <div class="record-content" id="content-${cat.id}">
                <div class="record-detail">
                    <div class="record-detail-label">Contato</div>
                    <div class="record-detail-text">${cat.contato || '-'}</div>
                </div>
                <div class="record-detail">
                    <div class="record-detail-label">Observações</div>
                    <div class="record-detail-text">${cat.observacoes || '-'}</div>
                </div>
            </div>
            <div class="record-footer">
                <button class="btn btn-edit" onclick="editCatequizando('${cat.id}')">Editar</button>
                <button class="btn btn-delete" onclick="deleteRecord('catequizandos', '${cat.id}')">Excluir</button>
            </div>
        </div>
    `;
}

async function editCatequizando(id) {
    const cat = catequizandosData.find(c => c.id === id);
    if(!cat) return;
    
    document.getElementById('catId').value = id;
    document.getElementById('catNome').value = cat.nome;
    document.getElementById('catIdade').value = cat.idade;
    document.getElementById('catTurma').value = cat.turma;
    document.getElementById('catLocal').value = cat.local;
    document.getElementById('catContato').value = cat.contato || '';
    document.getElementById('catObservacoes').value = cat.observacoes || '';
    
    document.getElementById('btnCancelCat').style.display = 'inline-block';
    document.querySelector('#formCatequizandos .btn-primary').textContent = 'Atualizar';
}

// ==========================================
// COMENTÁRIOS
// ==========================================
function setupComentariosModal() {
    document.getElementById('formComentario').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveComentario();
    });
}

window.openComentariosModal = function(collection, id, title) {
    document.getElementById('modalTitulo').textContent = title;
    document.getElementById('comParentCollection').value = collection;
    document.getElementById('comParentId').value = id;
    document.getElementById('comNome').value = '';
    document.getElementById('comTexto').value = '';
    
    document.getElementById('modalComentarios').style.display = 'block';
    loadComentarios(collection, id);
};

window.closeModal = function() {
    document.getElementById('modalComentarios').style.display = 'none';
    if(currentComentarioListener) {
        currentComentarioListener();
        currentComentarioListener = null;
    }
};

async function loadComentarios(collection, id) {
    const container = document.getElementById('listaComentarios');
    
    try {
        if(currentComentarioListener) {
            currentComentarioListener();
        }
        
        currentComentarioListener = db.collection(collection).doc(id).collection('comentarios')
            .orderBy('createdAt', 'asc')
            .onSnapshot((snapshot) => {
                if(snapshot.empty) {
                    container.innerHTML = '<div class="empty-state" style="padding:1rem;">Nenhum comentário</div>';
                } else {
                    container.innerHTML = '';
                    snapshot.forEach(doc => {
                        const com = doc.data();
                        container.innerHTML += `
                            <div class="comentario-item">
                                <div class="comentario-nome">👤 ${com.nome}</div>
                                <div class="comentario-texto">${com.texto}</div>
                                <div class="comentario-data">${formatDateTimestamp(com.createdAt)}</div>
                            </div>
                        `;
                    });
                }
            });
    } catch(error) {
        container.innerHTML = '<div class="empty-state">Erro</div>';
    }
}

async function saveComentario() {
    const collection = document.getElementById('comParentCollection').value;
    const parentId = document.getElementById('comParentId').value;
    const nome = document.getElementById('comNome').value;
    const texto = document.getElementById('comTexto').value;
    
    try {
        await db.collection(collection).doc(parentId).collection('comentarios').add({
            nome: nome,
            texto: texto,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.getElementById('comTexto').value = '';
        showMessage('Comentário adicionado!');
    } catch(error) {
        showMessage('Erro', 'error');
    }
}

function listenComments(collection, id) {
    const container = document.getElementById(`comentarios-${id}`);
    if(!container) return;
    
    db.collection(collection).doc(id).collection('comentarios')
        .orderBy('createdAt', 'desc')
        .limit(3)
        .onSnapshot((snapshot) => {
            if(snapshot.empty) {
                container.innerHTML = '<div style="color:#999;font-size:0.85rem;">Sem comentários</div>';
            } else {
                container.innerHTML = '';
                snapshot.forEach(doc => {
                    const com = doc.data();
                    container.innerHTML += `
                        <div class="comentario-item" style="margin-bottom:0.5rem;">
                            <div class="comentario-nome">${com.nome}</div>
                            <div class="comentario-texto">${com.texto}</div>
                        </div>
                    `;
                });
            }
        });
}

// ==========================================
// UTILITÁRIOS
// ==========================================
window.toggleRecord = function(id) {
    const content = document.getElementById(`content-${id}`);
    const btn = content.parentElement.querySelector('.toggle-btn');
    
    if(content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        btn.classList.remove('expanded');
        btn.textContent = '▼';
    } else {
        content.classList.add('expanded');
        btn.classList.add('expanded');
        btn.textContent = '▲';
    }
};

async function deleteRecord(collection, id) {
    if(!confirm('Confirma exclusão?')) return;
    
    try {
        await db.collection(collection).doc(id).delete();
        showMessage('Excluído!');
        
        const loaders = {
            'inicioFe': loadInicioFe,
            'evangelho': loadEvangelho,
            'oracao': loadOração,
            'sacramentos': loadSacramentos,
            'missao': loadMissao,
            'catequizandos': loadCatequizandos
        };
        
        if(loaders[collection]) loaders[collection]();
    } catch(error) {
        showMessage('Erro', 'error');
    }
}

window.deleteRecord = deleteRecord;

function resetForm(prefix) {
    document.getElementById(`${prefix}Id`).value = '';
    const form = document.getElementById(`form${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`);
    if(form) form.reset();
    
    const btnCancel = document.getElementById(`btnCancel${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`);
    if(btnCancel) btnCancel.style.display = 'none';
    
    const btnPrimary = document.querySelector(`#form${prefix.charAt(0).toUpperCase() + prefix.slice(1)} .btn-primary`);
    if(btnPrimary) {
        const texts = {
            'fe': 'Salvar Registro',
            'mi': 'Salvar Pergunta',
            'cat': 'Salvar Catequizando'
        };
        btnPrimary.textContent = texts[prefix] || 'Salvar';
    }
}

function formatDate(dateString) {
    if(!dateString) return '-';
    const [ano, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatDateTimestamp(timestamp) {
    if(!timestamp) return 'Agora';
    const date = timestamp.toDate();
    return date.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function showMessage(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
        position:fixed;top:20px;right:20px;padding:1rem 2rem;
        background:${type==='error'?'#dc3545':'#28a745'};color:#fff;
        border-radius:4px;z-index:9999;animation:slideIn 0.3s;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function loadAllData() {
    loadInicioFe();
    loadEvangelho();
    loadOração();
    loadSacramentos();
    loadMissao();
    loadCatequizandos();
}

window.onclick = function(event) {
    const modal = document.getElementById('modalComentarios');
    if(event.target === modal) closeModal();
};

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from{transform:translateX(400px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes slideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(400px);opacity:0} }
`;
document.head.appendChild(style);