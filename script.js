/**
 * GUIA DA CATEQUESE - Sistema Completo
 * CORREÇÃO TOTAL DOS BOTÕES DE SALVAR
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Variáveis globais
let currentComentarioListener = null;
let catequizandosData = [];

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema iniciado - DOM carregado');
    
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
    var navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(function(item) {
        item.addEventListener('click', function() {
            var section = this.getAttribute('data-section');
            navigateTo(section);
        });
    });
}

function navigateTo(section) {
    // Atualizar navegação
    var navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(function(item) {
        item.classList.remove('active');
        if(item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });
    
    // Mostrar seção
    var sections = document.querySelectorAll('.content-section');
    sections.forEach(function(sec) {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
    
    window.scrollTo(0, 0);
}

window.navigateTo = navigateTo;

// ==========================================
// SETUP DOS FORMULÁRIOS - CORREÇÃO PRINCIPAL
// ==========================================
function setupForms() {
    console.log('Configurando formulários...');
    
    // Início da Fé
    var formInicioFe = document.getElementById('formInicioFe');
    if(formInicioFe) {
        formInicioFe.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Salvando Início da Fé...');
            saveInicioFe();
        });
    }
    
    // Evangelho
    var formEvangelho = document.getElementById('formEvangelho');
    if(formEvangelho) {
        formEvangelho.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Salvando Evangelho...');
            saveEvangelho();
        });
    }
    
    // Oração
    var formOração = document.getElementById('formOração');
    if(formOração) {
        formOração.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Salvando Oração...');
            saveOração();
        });
    }
    
    // Sacramentos
    var formSacramentos = document.getElementById('formSacramentos');
    if(formSacramentos) {
        formSacramentos.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Salvando Sacramentos...');
            saveSacramentos();
        });
    }
    
    // Missão
    var formMissao = document.getElementById('formMissao');
    if(formMissao) {
        formMissao.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Salvando Missão...');
            saveMissao();
        });
    }
    
    // Catequizandos
    var formCatequizandos = document.getElementById('formCatequizandos');
    if(formCatequizandos) {
        formCatequizandos.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Salvando Catequizando...');
            saveCatequizando();
        });
    }
    
    console.log('Formulários configurados com sucesso!');
}

function setupSearchAndFilters() {
    var searchInput = document.getElementById('searchCatequizando');
    var filterSelect = document.getElementById('filterTurma');
    
    if(searchInput) {
        searchInput.addEventListener('input', filterCatequizandos);
    }
    if(filterSelect) {
        filterSelect.addEventListener('change', filterCatequizandos);
    }
}

// ==========================================
// INÍCIO DA FÉ - SALVAR
// ==========================================
function saveInicioFe() {
    var id = document.getElementById('feId').value;
    var data = {
         document.getElementById('feData').value,
        tema: document.getElementById('feTema').value,
        objetivo: document.getElementById('feObjetivo').value,
        texto: document.getElementById('feTexto').value
    };
    
    console.log('Dados para salvar:', data);
    
    if(id) {
        // Atualizar
        db.collection('inicioFe').doc(id).update(data)
            .then(function() {
                console.log('Registro atualizado com sucesso!');
                showMessage('Registro atualizado com sucesso!');
                resetForm('fe');
                loadInicioFe();
            })
            .catch(function(error) {
                console.error('Erro ao atualizar:', error);
                showMessage('Erro ao atualizar: ' + error.message, 'error');
            });
    } else {
        // Criar novo
        db.collection('inicioFe').add(data)
            .then(function(docRef) {
                console.log('Registro criado com ID:', docRef.id);
                showMessage('Registro salvo com sucesso!');
                resetForm('fe');
                loadInicioFe();
            })
            .catch(function(error) {
                console.error('Erro ao salvar:', error);
                showMessage('Erro ao salvar: ' + error.message, 'error');
            });
    }
}

async function loadInicioFe() {
    var container = document.getElementById('listaInicioFe');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        var snapshot = await db.collection('inicioFe').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(function(doc) {
            var data = doc.data();
            container.innerHTML += createInicioFeCard(doc.id, data);
            listenComments('inicioFe', doc.id);
        });
    } catch(error) {
        console.error('Erro ao carregar:', error);
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
    var doc = await db.collection('inicioFe').doc(id).get();
    var data = doc.data();
    
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
// EVANGELHO - SALVAR
// ==========================================
function saveEvangelho() {
    var id = document.getElementById('evId').value;
    var data = {
         document.getElementById('evData').value,
        referencia: document.getElementById('evReferencia').value,
        frase: document.getElementById('evFrase').value,
        texto: document.getElementById('evTexto').value
    };
    
    console.log('Dados Evangelho:', data);
    
    if(id) {
        db.collection('evangelho').doc(id).update(data)
            .then(function() {
                showMessage('Evangelho atualizado!');
                resetForm('ev');
                loadEvangelho();
            })
            .catch(function(error) {
                console.error('Erro:', error);
                showMessage('Erro: ' + error.message, 'error');
            });
    } else {
        db.collection('evangelho').add(data)
            .then(function() {
                showMessage('Evangelho salvo!');
                resetForm('ev');
                loadEvangelho();
            })
            .catch(function(error) {
                console.error('Erro:', error);
                showMessage('Erro: ' + error.message, 'error');
            });
    }
}

async function loadEvangelho() {
    var container = document.getElementById('listaEvangelho');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        var snapshot = await db.collection('evangelho').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(function(doc) {
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
    var doc = await db.collection('evangelho').doc(id).get();
    var data = doc.data();
    
    document.getElementById('evId').value = id;
    document.getElementById('evData').value = data.data;
    document.getElementById('evReferencia').value = data.referencia;
    document.getElementById('evFrase').value = data.frase || '';
    document.getElementById('evTexto').value = data.texto || '';
    
    document.getElementById('btnCancelEv').style.display = 'inline-block';
    document.querySelector('#formEvangelho .btn-primary').textContent = 'Atualizar';
}

// ==========================================
// ORAÇÃO - SALVAR
// ==========================================
function saveOração() {
    var id = document.getElementById('orId').value;
    var data = {
         document.getElementById('orData').value,
        tipo: document.getElementById('orTipo').value,
        causa: document.getElementById('orCausa').value,
        detalhes: document.getElementById('orDetalhes').value
    };
    
    if(id) {
        db.collection('oracao').doc(id).update(data)
            .then(function() {
                showMessage('Oração atualizada!');
                resetForm('or');
                loadOração();
            })
            .catch(function(error) {
                showMessage('Erro: ' + error.message, 'error');
            });
    } else {
        db.collection('oracao').add(data)
            .then(function() {
                showMessage('Oração salva!');
                resetForm('or');
                loadOração();
            })
            .catch(function(error) {
                showMessage('Erro: ' + error.message, 'error');
            });
    }
}

async function loadOração() {
    var container = document.getElementById('listaOração');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        var snapshot = await db.collection('oracao').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(function(doc) {
            container.innerHTML += createOraçãoCard(doc.id, doc.data());
        });
    } catch(error) {
        container.innerHTML = '<div class="empty-state">Erro</div>';
    }
}

function createOraçãoCard(id, data) {
    var badgeClass = 'badge-' + data.tipo.toLowerCase();
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
    var doc = await db.collection('oracao').doc(id).get();
    var data = doc.data();
    
    document.getElementById('orId').value = id;
    document.getElementById('orData').value = data.data;
    document.getElementById('orTipo').value = data.tipo;
    document.getElementById('orCausa').value = data.causa || '';
    document.getElementById('orDetalhes').value = data.detalhes || '';
    
    document.getElementById('btnCancelOr').style.display = 'inline-block';
    document.querySelector('#formOração .btn-primary').textContent = 'Atualizar';
}

// ==========================================
// SACRAMENTOS - SALVAR
// ==========================================
function saveSacramentos() {
    var id = document.getElementById('saId').value;
    var data = {
         document.getElementById('saData').value,
        sacramento: document.getElementById('saSacramento').value,
        compromisso: document.getElementById('saCompromisso').value,
        reflexao: document.getElementById('saReflexao').value
    };
    
    if(id) {
        db.collection('sacramentos').doc(id).update(data)
            .then(function() {
                showMessage('Sacramento atualizado!');
                resetForm('sa');
                loadSacramentos();
            })
            .catch(function(error) {
                showMessage('Erro: ' + error.message, 'error');
            });
    } else {
        db.collection('sacramentos').add(data)
            .then(function() {
                showMessage('Sacramento salvo!');
                resetForm('sa');
                loadSacramentos();
            })
            .catch(function(error) {
                showMessage('Erro: ' + error.message, 'error');
            });
    }
}

async function loadSacramentos() {
    var container = document.getElementById('listaSacramentos');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        var snapshot = await db.collection('sacramentos').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(function(doc) {
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
    var doc = await db.collection('sacramentos').doc(id).get();
    var data = doc.data();
    
    document.getElementById('saId').value = id;
    document.getElementById('saData').value = data.data;
    document.getElementById('saSacramento').value = data.sacramento;
    document.getElementById('saCompromisso').value = data.compromisso || '';
    document.getElementById('saReflexao').value = data.reflexao || '';
    
    document.getElementById('btnCancelSa').style.display = 'inline-block';
    document.querySelector('#formSacramentos .btn-primary').textContent = 'Atualizar';
}

// ==========================================
// MISSÃO - SALVAR
// ==========================================
function saveMissao() {
    var id = document.getElementById('miId').value;
    var data = {
         document.getElementById('miData').value,
        pergunta: document.getElementById('miPergunta').value,
        objetivo: document.getElementById('miObjetivo').value
    };
    
    console.log('Dados Missão:', data);
    
    if(id) {
        db.collection('missao').doc(id).update(data)
            .then(function() {
                console.log('Missão atualizada!');
                showMessage('Missão atualizada!');
                resetForm('mi');
                loadMissao();
            })
            .catch(function(error) {
                console.error('Erro:', error);
                showMessage('Erro: ' + error.message, 'error');
            });
    } else {
        db.collection('missao').add(data)
            .then(function(docRef) {
                console.log('Missão salva com ID:', docRef.id);
                showMessage('Missão salva!');
                resetForm('mi');
                loadMissao();
            })
            .catch(function(error) {
                console.error('Erro:', error);
                showMessage('Erro: ' + error.message, 'error');
            });
    }
}

async function loadMissao() {
    var container = document.getElementById('listaMissao');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        var snapshot = await db.collection('missao').orderBy('data', 'desc').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum registro</div>';
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(function(doc) {
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
    var doc = await db.collection('missao').doc(id).get();
    var data = doc.data();
    
    document.getElementById('miId').value = id;
    document.getElementById('miData').value = data.data;
    document.getElementById('miPergunta').value = data.pergunta;
    document.getElementById('miObjetivo').value = data.objetivo || '';
    
    document.getElementById('btnCancelMi').style.display = 'inline-block';
    document.querySelector('#formMissao .btn-primary').textContent = 'Atualizar';
}

// ==========================================
// CATEQUIZANDOS - SALVAR
// ==========================================
function saveCatequizando() {
    var id = document.getElementById('catId').value;
    var data = {
        nome: document.getElementById('catNome').value,
        idade: parseInt(document.getElementById('catIdade').value),
        turma: document.getElementById('catTurma').value,
        local: document.getElementById('catLocal').value,
        contato: document.getElementById('catContato').value,
        observacoes: document.getElementById('catObservacoes').value
    };
    
    console.log('Dados Catequizando:', data);
    
    if(id) {
        db.collection('catequizandos').doc(id).update(data)
            .then(function() {
                console.log('Catequizando atualizado!');
                showMessage('Catequizando atualizado!');
                resetForm('cat');
                loadCatequizandos();
            })
            .catch(function(error) {
                console.error('Erro:', error);
                showMessage('Erro: ' + error.message, 'error');
            });
    } else {
        db.collection('catequizandos').add(data)
            .then(function(docRef) {
                console.log('Catequizando salvo com ID:', docRef.id);
                showMessage('Catequizando cadastrado!');
                resetForm('cat');
                loadCatequizandos();
            })
            .catch(function(error) {
                console.error('Erro:', error);
                showMessage('Erro: ' + error.message, 'error');
            });
    }
}

async function loadCatequizandos() {
    var container = document.getElementById('listaCatequizandos');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        var snapshot = await db.collection('catequizandos').orderBy('nome').get();
        
        if(snapshot.empty) {
            container.innerHTML = '<div class="empty-state">Nenhum catequizando</div>';
            return;
        }
        
        catequizandosData = snapshot.docs.map(function(doc) {
            return {
                id: doc.id,
                ...doc.data()
            };
        });
        
        filterCatequizandos();
    } catch(error) {
        container.innerHTML = '<div class="empty-state">Erro</div>';
    }
}

function filterCatequizandos() {
    var search = document.getElementById('searchCatequizando').value.toLowerCase();
    var turmaFilter = document.getElementById('filterTurma').value;
    var container = document.getElementById('listaCatequizandos');
    
    var filtered = catequizandosData.filter(function(cat) {
        var matchSearch = cat.nome.toLowerCase().includes(search) || cat.turma.toLowerCase().includes(search);
        var matchTurma = !turmaFilter || cat.turma === turmaFilter;
        return matchSearch && matchTurma;
    });
    
    if(filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum encontrado</div>';
        return;
    }
    
    container.innerHTML = '';
    filtered.forEach(function(cat) {
        container.innerHTML += createCatequizandoCard(cat);
    });
}

function createCatequizandoCard(cat) {
    var badgeClass = 'badge-' + cat.turma.toLowerCase();
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
    var cat = catequizandosData.find(function(c) { return c.id === id; });
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
    var formComentario = document.getElementById('formComentario');
    if(formComentario) {
        formComentario.addEventListener('submit', function(e) {
            e.preventDefault();
            saveComentario();
        });
    }
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

function loadComentarios(collection, id) {
    var container = document.getElementById('listaComentarios');
    
    try {
        if(currentComentarioListener) {
            currentComentarioListener();
        }
        
        currentComentarioListener = db.collection(collection).doc(id).collection('comentarios')
            .orderBy('createdAt', 'asc')
            .onSnapshot(function(snapshot) {
                if(snapshot.empty) {
                    container.innerHTML = '<div class="empty-state" style="padding:1rem;">Nenhum comentário</div>';
                } else {
                    container.innerHTML = '';
                    snapshot.forEach(function(doc) {
                        var com = doc.data();
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
        console.error('Erro comentários:', error);
        container.innerHTML = '<div class="empty-state">Erro</div>';
    }
}

function saveComentario() {
    var collection = document.getElementById('comParentCollection').value;
    var parentId = document.getElementById('comParentId').value;
    var nome = document.getElementById('comNome').value;
    var texto = document.getElementById('comTexto').value;
    
    db.collection(collection).doc(parentId).collection('comentarios').add({
        nome: nome,
        texto: texto,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function() {
        document.getElementById('comTexto').value = '';
        showMessage('Comentário adicionado!');
    })
    .catch(function(error) {
        showMessage('Erro: ' + error.message, 'error');
    });
}

function listenComments(collection, id) {
    var container = document.getElementById('comentarios-' + id);
    if(!container) return;
    
    db.collection(collection).doc(id).collection('comentarios')
        .orderBy('createdAt', 'desc')
        .limit(3)
        .onSnapshot(function(snapshot) {
            if(snapshot.empty) {
                container.innerHTML = '<div style="color:#999;font-size:0.85rem;">Sem comentários</div>';
            } else {
                container.innerHTML = '';
                snapshot.forEach(function(doc) {
                    var com = doc.data();
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
    var content = document.getElementById('content-' + id);
    var btn = content.parentElement.querySelector('.toggle-btn');
    
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

window.deleteRecord = function(collection, id) {
    if(!confirm('Confirma exclusão?')) return;
    
    db.collection(collection).doc(id).delete()
        .then(function() {
            showMessage('Excluído!');
            
            var loaders = {
                'inicioFe': loadInicioFe,
                'evangelho': loadEvangelho,
                'oracao': loadOração,
                'sacramentos': loadSacramentos,
                'missao': loadMissao,
                'catequizandos': loadCatequizandos
            };
            
            if(loaders[collection]) {
                loaders[collection]();
            }
        })
        .catch(function(error) {
            showMessage('Erro: ' + error.message, 'error');
        });
};

function resetForm(prefix) {
    document.getElementById(prefix + 'Id').value = '';
    var form = document.getElementById('form' + prefix.charAt(0).toUpperCase() + prefix.slice(1));
    if(form) form.reset();
    
    var btnCancel = document.getElementById('btnCancel' + prefix.charAt(0).toUpperCase() + prefix.slice(1));
    if(btnCancel) btnCancel.style.display = 'none';
    
    var btnPrimary = document.querySelector('#form' + prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' .btn-primary');
    if(btnPrimary) {
        var texts = {
            'fe': 'Salvar Registro',
            'mi': 'Salvar Pergunta',
            'cat': 'Salvar Catequizando'
        };
        btnPrimary.textContent = texts[prefix] || 'Salvar';
    }
}

function formatDate(dateString) {
    if(!dateString) return '-';
    var parts = dateString.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function formatDateTimestamp(timestamp) {
    if(!timestamp) return 'Agora';
    var date = timestamp.toDate();
    return date.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function showMessage(msg, type) {
    var toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;padding:1rem 2rem;background:' + 
        (type === 'error' ? '#dc3545' : '#28a745') + ';color:#fff;border-radius:4px;z-index:9999;';
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

function loadAllData() {
    loadInicioFe();
    loadEvangelho();
    loadOração();
    loadSacramentos();
    loadMissao();
    loadCatequizandos();
}

window.onclick = function(event) {
    var modal = document.getElementById('modalComentarios');
    if(event.target === modal) {
        closeModal();
    }
};
