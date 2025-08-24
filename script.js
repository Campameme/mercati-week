// ===== VARIABILI GLOBALI =====
let mercatini = [];
let fiere = [];
let comuni = new Set();
let categorie = new Set();
let preferiti = new Set();
let calendar;

// ===== ID GOOGLE SHEETS =====
const MERCATINI_SHEET_ID = '1dGB3f47TrT_dVz5PsICci4JuoTWRBQAcPuXjDIYSE58';
const FIERE_SHEET_ID = '1oa6pz7U79YyD8hey2lANS-x6nMCHnaKBC2LtEIsMyTQ';

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inizializzazione applicazione...');
    
    // Inizializza calendario
    inizializzaCalendario();
    
    // Carica preferiti salvati
    caricaPreferiti();
    
    // Carica dati con priorità alta
    caricaDatiConPriorita();
    
    // Inizializza event listeners
    inizializzaEventListeners();
    
    // Controlla stato online/offline
    controllaStatoOnline();
});

// ===== INIZIALIZZAZIONE CALENDARIO =====
function inizializzaCalendario() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,listWeek'
        },
        buttonText: {
            today: 'Oggi',
            month: 'Mese',
            week: 'Settimana',
            list: 'Lista'
        },
        height: 'auto',
        eventClick: function(info) {
            mostraDettagliEvento(info.event);
        },
        dayClick: function(info) {
            mostraEventiGiorno(info.dateStr);
        },
        eventClassNames: function(arg) {
            return ['fade-in'];
        }
    });
    
    calendar.render();
    console.log('✅ Calendario inizializzato');
}

// ===== CARICAMENTO DATI =====
async function caricaDatiConPriorita() {
    console.log('🚀 Avvio caricamento dati da Google Sheets con priorità alta...');
    
    mostraStatusCaricamento('Caricamento dati in corso...');
    
    try {
        // Carica entrambi i dataset in parallelo
        await Promise.all([
            caricaDatiMercatiniGoogleSheets(),
            caricaDatiFiereGoogleSheets()
        ]);
        
        console.log('✅ Tutti i dati caricati, inizializzazione completata');
        nascondiStatusCaricamento();
        
        // Aggiorna UI
        aggiornaFiltri();
        aggiornaCalendario();
        aggiornaEventiVicini();
        
    } catch (error) {
        console.error('❌ Errore durante il caricamento dati:', error);
        mostraStatusCaricamento('Errore nel caricamento dati', 'error');
    }
}

// ===== CARICAMENTO MERCATINI =====
async function caricaDatiMercatiniGoogleSheets() {
    console.log('🛒 Caricamento dati mercatini da Google Sheets...');
    
    try {
        const url = `https://docs.google.com/spreadsheets/d/${MERCATINI_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Foglio1`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.text();
        console.log(`📊 Dati mercatini ricevuti: ${data.length} caratteri`);
        
        return new Promise((resolve, reject) => {
            Papa.parse(data, {
                header: true,
                delimiter: ',',
                skipEmptyLines: true,
                complete: (results) => {
                    console.log(`✅ Parsing mercatini completato: ${results.data.length} righe`);
                    
                    // Filtra righe vuote e pulisci dati
                    mercatini = results.data
                        .filter(item => item.Comune && item.Comune.trim())
                        .map(item => ({
                            ...item,
                            Comune: item.Comune.trim().replace(/\r/g, ''),
                            'Settori merceologici': item['Settori merceologici'] ? item['Settori merceologici'].trim().replace(/\r/g, '') : ''
                        }));
                    
                    console.log(`🎯 Mercatini validi: ${mercatini.length}`);
                    resolve();
                },
                error: (error) => {
                    console.error('❌ Errore parsing mercatini:', error);
                    reject(error);
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Errore caricamento mercatini:', error);
        throw error;
    }
}

// ===== CARICAMENTO FIERE =====
async function caricaDatiFiereGoogleSheets() {
    console.log('🎪 Caricamento dati fiere da Google Sheets...');
    
    try {
        const url = `https://docs.google.com/spreadsheets/d/${FIERE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Foglio1`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.text();
        console.log(`📊 Dati fiere ricevuti: ${data.length} caratteri`);
        
        return new Promise((resolve, reject) => {
            Papa.parse(data, {
                header: true,
                delimiter: ',',
                skipEmptyLines: true,
                complete: (results) => {
                    console.log(`✅ Parsing fiere completato: ${results.data.length} righe`);
                    
                    // Filtra righe vuote e pulisci dati
                    fiere = results.data
                        .filter(item => item.Comune && item.Comune.trim())
                        .map(item => ({
                            ...item,
                            Comune: item.Comune.trim().replace(/\r/g, ''),
                            'Settori merceologici': item['Settori merceologici'] ? item['Settori merceologici'].trim().replace(/\r/g, '') : ''
                        }));
                    
                    console.log(`🎯 Fiere valide: ${fiere.length}`);
                    resolve();
                },
                error: (error) => {
                    console.error('❌ Errore parsing fiere:', error);
                    reject(error);
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Errore caricamento fiere:', error);
        throw error;
    }
}

// ===== GESTIONE STATUS =====
function mostraStatusCaricamento(messaggio, tipo = 'info') {
    const statusEl = document.getElementById('statusCaricamento');
    const statusTestoEl = document.getElementById('statusTesto');
    
    if (statusEl && statusTestoEl) {
        statusTestoEl.textContent = messaggio;
        statusEl.className = `alert alert-${tipo} text-center`;
        statusEl.classList.remove('d-none');
    }
}

function nascondiStatusCaricamento() {
    const statusEl = document.getElementById('statusCaricamento');
    if (statusEl) {
        statusEl.classList.add('d-none');
    }
}

// ===== AGGIORNAMENTO FILTRI =====
function aggiornaFiltri() {
    console.log('🔍 Aggiornamento filtri...');
    
    // Estrai comuni e categorie
    comuni.clear();
    categorie.clear();
    
    // Da mercatini
    mercatini.forEach(mercatino => {
        if (mercatino.Comune) comuni.add(mercatino.Comune);
        if (mercatino['Settori merceologici']) {
            mercatino['Settori merceologici'].split('/').forEach(settore => {
                const settorePulito = settore.trim();
                if (settorePulito) categorie.add(settorePulito);
            });
        }
    });
    
    // Da fiere
    fiere.forEach(fiera => {
        if (fiera.Comune) comuni.add(fiera.Comune);
        if (fiera['Settori merceologici']) {
            fiera['Settori merceologici'].split('/').forEach(settore => {
                const settorePulito = settore.trim();
                if (settorePulito) categorie.add(settorePulito);
            });
        }
    });
    
    // Popola filtri
    popolaSelect('filtroComune', Array.from(comuni).sort());
    popolaSelect('filtroCategoria', Array.from(categorie).sort());
    
    console.log(`✅ Filtri aggiornati: ${comuni.size} comuni, ${categorie.size} categorie`);
}

function popolaSelect(selectId, opzioni) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.warn(`⚠️ Select ${selectId} non trovato`);
        return;
    }
    
    const currentValue = select.value;
    
    // Mantieni solo la prima opzione
    select.innerHTML = `<option value="">${selectId === 'filtroComune' ? 'Tutti i comuni' : 'Tutte le categorie'}</option>`;
    
    // Aggiungi opzioni
    opzioni.forEach(opzione => {
        const option = document.createElement('option');
        option.value = opzione;
        option.textContent = opzione;
        select.appendChild(option);
    });
    
    // Ripristina valore selezionato se ancora valido
    if (opzioni.includes(currentValue)) {
        select.value = currentValue;
    }
}

// ===== AGGIORNAMENTO CALENDARIO =====
function aggiornaCalendario() {
    if (!calendar) {
        console.error('❌ Calendario non inizializzato');
        return;
    }
    
    console.log('🔄 Aggiornamento calendario...');
    
    // Rimuovi eventi esistenti
    calendar.removeAllEvents();
    console.log('🗑️ Eventi esistenti rimossi');
    
    let eventiAggiunti = 0;
    
    // Aggiungi mercatini
    mercatini.forEach((mercatino, index) => {
        const date = creaDataMercatino(mercatino.Giorno);
        if (date) {
            // Se date è un array, crea un evento per ogni data
            if (Array.isArray(date)) {
                date.forEach(dataSingola => {
                    calendar.addEvent({
                        title: `🛒 ${mercatino.Comune}`,
                        start: dataSingola,
                        end: dataSingola,
                        extendedProps: {
                            tipo: 'mercatino',
                            dati: mercatino
                        },
                        className: 'fc-event-mercatino'
                    });
                    eventiAggiunti++;
                });
            } else {
                // Se date è una singola data
                calendar.addEvent({
                    title: `🛒 ${mercatino.Comune}`,
                    start: date,
                    end: date,
                    extendedProps: {
                        tipo: 'mercatino',
                        dati: mercatino
                    },
                    className: 'fc-event-mercatino'
                });
                eventiAggiunti++;
            }
        }
    });
    
    // Aggiungi fiere
    fiere.forEach((fiera, index) => {
        const date = creaDataFiera(fiera['Data inizio']);
        if (date) {
            calendar.addEvent({
                title: `🎪 ${fiera.Denominazione || fiera.Comune}`,
                start: date,
                end: date,
                extendedProps: {
                    tipo: 'fiera',
                    dati: fiera
                },
                className: 'fc-event-fiera'
            });
            eventiAggiunti++;
        }
    });
    
    console.log(`✅ Calendario aggiornato: ${eventiAggiunti} eventi totali aggiunti`);
    console.log(`📊 Eventi nel calendario: ${calendar.getEvents().length}`);
}

// ===== LOGICA DATE =====
function creaDataMercatino(giorno) {
    if (!giorno) return null;
    
    const oggi = new Date();
    const anno = oggi.getFullYear();
    
    console.log(`🔍 Creando data mercatino per: "${giorno}"`);
    
    // Gestisci diversi formati di data
    if (giorno.includes('domenica')) {
        return trovaGiorniSettimanali(anno, 0);
    } else if (giorno.includes('lunedì') || giorno.includes('lunedi')) {
        return trovaGiorniSettimanali(anno, 1);
    } else if (giorno.includes('martedì') || giorno.includes('martedi')) {
        return trovaGiorniSettimanali(anno, 2);
    } else if (giorno.includes('mercoledì') || giorno.includes('mercoledi')) {
        return trovaGiorniSettimanali(anno, 3);
    } else if (giorno.includes('giovedì') || giorno.includes('giovedi')) {
        return trovaGiorniSettimanali(anno, 4);
    } else if (giorno.includes('venerdì') || giorno.includes('venerdi')) {
        return trovaGiorniSettimanali(anno, 5);
    } else if (giorno.includes('sabato')) {
        return trovaGiorniSettimanali(anno, 6);
    }
    
    console.log(`❌ Formato mercatino non riconosciuto: "${giorno}"`);
    return null;
}

function trovaGiorniSettimanali(anno, giornoSettimana) {
    const eventi = [];
    const dataInizio = new Date(anno, 0, 1);
    let data = new Date(dataInizio);
    
    // Trova il primo giorno della settimana
    while (data.getDay() !== giornoSettimana) {
        data.setDate(data.getDate() + 1);
    }
    
    // Genera tutti i giorni per l'anno
    while (data.getFullYear() === anno) {
        eventi.push(data.toISOString().split('T')[0]);
        data.setDate(data.getDate() + 7);
    }
    
    console.log(`📅 Generati ${eventi.length} giorni per anno ${anno}, giorno settimana ${giornoSettimana}`);
    return eventi;
}

function creaDataFiera(dataInizio) {
    if (!dataInizio) return null;
    
    console.log(`🔍 Creando data fiera per: "${dataInizio}"`);
    
    // Prendi solo la prima data se ce ne sono multiple
    const primaData = dataInizio.split('\n')[0].trim();
    
    // Gestisci formato DD/MM
    if (primaData.includes('/')) {
        const [giorno, mese] = primaData.split('/');
        const anno = new Date().getFullYear();
        const data = new Date(anno, parseInt(mese) - 1, parseInt(giorno));
        console.log(`✅ Data fiera generata: ${data.toISOString().split('T')[0]}`);
        return data;
    }
    
    console.log(`❌ Formato data fiera non riconosciuto: "${dataInizio}"`);
    return null;
}

// ===== GESTIONE EVENTI =====
function mostraDettagliEvento(evento) {
    const dati = evento.extendedProps.dati;
    const tipo = evento.extendedProps.tipo;
    
    const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
    const modalBody = document.getElementById('eventoModalBody');
    
    let html = `
        <div class="row">
            <div class="col-md-8">
                <h6 class="text-primary">${tipo === 'mercatino' ? '🛒 Mercatino' : '🎪 Fiera'}</h6>
                <h5>${tipo === 'mercatino' ? dati.Comune : (dati.Denominazione || dati.Comune)}</h5>
                <p class="text-muted">${tipo === 'mercatino' ? dati.Giorno : dati.Mese}</p>
            </div>
            <div class="col-md-4 text-end">
                <button class="btn btn-outline-warning btn-sm" onclick="togglePreferito('${tipo}-${dati.Comune}')">
                    ${isPreferito(tipo, dati.Comune) ? '❤️' : '🤍'}
                </button>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-md-6">
                <strong>📍 Luogo:</strong><br>
                ${dati['Luogo di svolgimento'] || 'Non specificato'}
            </div>
            <div class="col-md-6">
                <strong>🏷️ Categoria:</strong><br>
                ${dati['Settori merceologici'] || 'Non specificato'}
            </div>
        </div>
        ${dati.Orario ? `<hr><strong>🕐 Orario:</strong><br>${dati.Orario}` : ''}
        ${dati['Soggetto organizzatore'] ? `<hr><strong>👥 Organizzatore:</strong><br>${dati['Soggetto organizzatore']}` : ''}
    `;
    
    modalBody.innerHTML = html;
    modal.show();
}

function mostraEventiGiorno(data) {
    const dataObj = new Date(data);
    const dataFormattata = dataObj.toLocaleDateString('it-IT', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const eventiGiorno = calendar.getEvents().filter(evento => {
        const eventoData = evento.start.toISOString().split('T')[0];
        return eventoData === data;
    });
    
    const modal = new bootstrap.Modal(document.getElementById('giornoModal'));
    const modalBody = document.getElementById('giornoModalBody');
    
    let html = `<h5 class="mb-3">📅 Eventi del ${dataFormattata}</h5>`;
    
    if (eventiGiorno.length === 0) {
        html += '<p class="text-muted">Nessun evento programmato per questo giorno.</p>';
    } else {
        eventiGiorno.forEach(evento => {
            const dati = evento.extendedProps.dati;
            const tipo = evento.extendedProps.tipo;
            
            html += `
                <div class="card mb-2">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">${tipo === 'mercatino' ? '🛒' : '🎪'} ${tipo === 'mercatino' ? dati.Comune : (dati.Denominazione || dati.Comune)}</h6>
                                <p class="mb-1 text-muted">${tipo === 'mercatino' ? dati.Giorno : dati.Mese}</p>
                                <small class="text-muted">${dati['Luogo di svolgimento'] || 'Luogo non specificato'}</small>
                            </div>
                            <button class="btn btn-outline-warning btn-sm" onclick="togglePreferito('${tipo}-${dati.Comune}')">
                                ${isPreferito(tipo, dati.Comune) ? '❤️' : '🤍'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    modalBody.innerHTML = html;
    modal.show();
}

// ===== GESTIONE PREFERITI =====
function caricaPreferiti() {
    const preferitiSalvati = localStorage.getItem('preferiti');
    if (preferitiSalvati) {
        preferiti = new Set(JSON.parse(preferitiSalvati));
    }
}

function salvaPreferiti() {
    localStorage.setItem('preferiti', JSON.stringify(Array.from(preferiti)));
}

function togglePreferito(chiave) {
    if (preferiti.has(chiave)) {
        preferiti.delete(chiave);
    } else {
        preferiti.add(chiave);
    }
    
    salvaPreferiti();
    aggiornaListaPreferiti();
}

function isPreferito(tipo, comune) {
    return preferiti.has(`${tipo}-${comune}`);
}

function aggiornaListaPreferiti() {
    const preferitiEl = document.getElementById('preferiti');
    if (!preferitiEl) return;
    
    if (preferiti.size === 0) {
        preferitiEl.innerHTML = '<p class="text-muted small">Nessun evento preferito salvato</p>';
        return;
    }
    
    let html = '';
    preferiti.forEach(chiave => {
        const [tipo, comune] = chiave.split('-');
        const evento = tipo === 'mercatino' 
            ? mercatini.find(m => m.Comune === comune)
            : fiere.find(f => f.Comune === comune);
        
        if (evento) {
            html += `
                <div class="preferito-item">
                    <div>
                        <strong>${tipo === 'mercatino' ? '🛒' : '🎪'} ${comune}</strong><br>
                        <small class="text-muted">${tipo === 'mercatino' ? evento.Giorno : (evento.Mese || '')}</small>
                    </div>
                    <button class="btn-preferito attivo" onclick="togglePreferito('${chiave}')">❤️</button>
                </div>
            `;
        }
    });
    
    preferitiEl.innerHTML = html;
}

// ===== AGGIORNAMENTO EVENTI VICINI =====
function aggiornaEventiVicini() {
    const eventiViciniEl = document.getElementById('eventiVicini');
    if (!eventiViciniEl) return;
    
    const oggi = new Date();
    
    // Trova eventi nelle prossime 2 settimane
    const eventiProssimi = calendar.getEvents().filter(evento => {
        const giorniDiff = Math.ceil((evento.start - oggi) / (1000 * 60 * 60 * 24));
        return giorniDiff >= 0 && giorniDiff <= 14;
    }).sort((a, b) => a.start - b.start).slice(0, 5);
    
    if (eventiProssimi.length === 0) {
        eventiViciniEl.innerHTML = '<p class="text-muted small">Nessun evento nelle prossime 2 settimane</p>';
        return;
    }
    
    let html = '';
    eventiProssimi.forEach(evento => {
        const dati = evento.extendedProps.dati;
        const tipo = evento.extendedProps.tipo;
        const giorniDiff = Math.ceil((evento.start - oggi) / (1000 * 60 * 60 * 24));
        
        html += `
            <div class="evento-vicino">
                <div class="data">${evento.start.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</div>
                <div class="comune">${tipo === 'mercatino' ? dati.Comune : (dati.Denominazione || dati.Comune)}</div>
                <div class="tipo">${tipo === 'mercatino' ? '🛒 Mercatino' : '🎪 Fiera'}</div>
                <small class="text-muted">${giorniDiff === 0 ? 'Oggi' : `Tra ${giorniDiff} giorni`}</small>
            </div>
        `;
    });
    
    eventiViciniEl.innerHTML = html;
}

// ===== EVENT LISTENERS =====
function inizializzaEventListeners() {
    // Filtri
    const filtroComune = document.getElementById('filtroComune');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroTipo = document.getElementById('filtroTipo');
    
    if (filtroComune) filtroComune.addEventListener('change', applicaFiltri);
    if (filtroCategoria) filtroCategoria.addEventListener('change', applicaFiltri);
    if (filtroTipo) filtroTipo.addEventListener('change', applicaFiltri);
    
    // Pulsante ricarica
    const btnRicarica = document.getElementById('btnRicarica');
    if (btnRicarica) btnRicarica.addEventListener('click', ricaricaDati);
}

function applicaFiltri() {
    const comune = document.getElementById('filtroComune')?.value || '';
    const categoria = document.getElementById('filtroCategoria')?.value || '';
    const tipo = document.getElementById('filtroTipo')?.value || '';
    
    console.log(`🔍 Applicazione filtri: Comune=${comune}, Categoria=${categoria}, Tipo=${tipo}`);
    
    // Filtra eventi
    const eventiFiltrati = calendar.getEvents().filter(evento => {
        const dati = evento.extendedProps.dati;
        
        // Filtro comune
        if (comune && dati.Comune !== comune) return false;
        
        // Filtro categoria
        if (categoria && (!dati['Settori merceologici'] || !dati['Settori merceologici'].includes(categoria))) return false;
        
        // Filtro tipo
        if (tipo && evento.extendedProps.tipo !== tipo) return false;
        
        return true;
    });
    
    // Nascondi tutti gli eventi
    calendar.getEvents().forEach(evento => {
        evento.setProp('display', 'none');
    });
    
    // Mostra solo quelli filtrati
    eventiFiltrati.forEach(evento => {
        evento.setProp('display', 'auto');
    });
    
    console.log(`🔍 Filtri applicati: ${eventiFiltrati.length} eventi visibili`);
}

async function ricaricaDati() {
    const btn = document.getElementById('btnRicarica');
    if (!btn) return;
    
    const testoOriginale = btn.innerHTML;
    
    btn.innerHTML = '🔄 Ricaricamento...';
    btn.disabled = true;
    
    try {
        await caricaDatiConPriorita();
        btn.innerHTML = '✅ Completato!';
        setTimeout(() => {
            btn.innerHTML = testoOriginale;
            btn.disabled = false;
        }, 2000);
    } catch (error) {
        btn.innerHTML = '❌ Errore!';
        setTimeout(() => {
            btn.innerHTML = testoOriginale;
            btn.disabled = false;
        }, 3000);
    }
}

// ===== GESTIONE STATO ONLINE =====
function controllaStatoOnline() {
    const statusIndicator = document.getElementById('statusIndicator');
    if (!statusIndicator) return;
    
    function aggiornaStato() {
        if (navigator.onLine) {
            statusIndicator.innerHTML = '<span class="badge bg-success">🟢 Online</span>';
            statusIndicator.classList.remove('offline');
        } else {
            statusIndicator.innerHTML = '<span class="badge bg-danger">🔴 Offline</span>';
            statusIndicator.classList.add('offline');
        }
    }
    
    // Controlla stato iniziale
    aggiornaStato();
    
    // Ascolta cambiamenti
    window.addEventListener('online', aggiornaStato);
    window.addEventListener('offline', aggiornaStato);
}

// ===== UTILITY =====
function formattaData(data) {
    return data.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formattaOra(ora) {
    if (!ora) return '';
    return ora.replace(/\./g, ':').replace(/\//g, ' - ');
}
