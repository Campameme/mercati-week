// Applicazione principale
const App = {
    // Inizializzazione
    init() {
        Logger.info('🚀 Inizializzazione applicazione...');
        
        try {
            // Inizializza calendario
            CalendarManager.init();
            
            // Carica preferiti salvati
            EventManager.caricaPreferiti();
            
            // Controlla stato online/offline
            this.controllaStatoOnline();
            
            // Aggiungi event listeners per i filtri
            this.setupEventListeners();
            
            Logger.success('✅ Applicazione inizializzata');
            
        } catch (error) {
            Logger.error('❌ Errore durante l\'inizializzazione:', error);
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Filtri
        document.getElementById('comuneFilter').addEventListener('change', () => this.applicaFiltri());
        document.getElementById('categoriaFilter').addEventListener('change', () => this.applicaFiltri());
        document.getElementById('tipoFilter').addEventListener('change', () => this.applicaFiltri());
        
        // Eventi online/offline
        window.addEventListener('online', () => this.aggiornaStatoOnline());
        window.addEventListener('offline', () => this.aggiornaStatoOnline());
    },
    
    // Carica dati
    async caricaDati() {
        Logger.info('🚀 Avvio caricamento dati...');
        
        try {
            // Mostra loading
            this.mostraLoading(true);
            this.aggiornaStatus('Caricamento dati in corso...');
            
            // Carica dati
            await DataLoader.caricaDati();
            
            // Aggiorna status
            this.aggiornaStatus('Dati caricati con successo', 'success');
            
        } catch (error) {
            Logger.error('❌ Errore durante il caricamento dati:', error);
            this.aggiornaStatus(`Errore nel caricamento dati: ${error.message}`, 'error');
            
            // Mostra errore più dettagliato
            setTimeout(() => {
                this.aggiornaStatus('Riprova a caricare i dati', 'warning');
            }, 3000);
        } finally {
            this.mostraLoading(false);
        }
    },
    
    // Applica filtri
    applicaFiltri() {
        const filtri = {
            comune: document.getElementById('comuneFilter').value,
            categoria: document.getElementById('categoriaFilter').value,
            tipo: document.getElementById('tipoFilter').value
        };
        
        Logger.debug('Applicazione filtri:', filtri);
        
        const eventiVisibili = CalendarManager.filterEvents(filtri);
        this.aggiornaStatus(`Eventi filtrati: ${eventiVisibili} di ${CalendarManager.getEventCount()} totali`);
    },
    
    // Mostra preferiti
    mostraPreferiti() {
        EventManager.aggiornaListaPreferiti();
    },
    
    // Mostra eventi vicini
    mostraEventiVicini() {
        EventManager.aggiornaEventiVicini();
    },
    
    // Controlla stato online/offline
    controllaStatoOnline() {
        this.aggiornaStatoOnline();
    },
    
    // Aggiorna stato online/offline
    aggiornaStatoOnline() {
        const indicator = document.getElementById('statusIndicator');
        
        if (Utils.isOnline()) {
            indicator.innerHTML = '<span class="status-online">🟢 Online</span>';
        } else {
            indicator.innerHTML = '<span class="status-offline">🔴 Offline</span>';
        }
    },
    
    // Mostra/ nasconde loading
    mostraLoading(mostra) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = mostra ? 'block' : 'none';
    },
    
    // Aggiorna status
    aggiornaStatus(messaggio, tipo = 'info') {
        const status = document.getElementById('loadingStatus');
        status.textContent = messaggio;
        
        // Rimuovi classi precedenti
        status.className = '';
        
        // Aggiungi classe appropriata
        switch (tipo) {
            case 'error':
                status.className = 'text-danger fw-bold';
                break;
            case 'warning':
                status.className = 'text-warning fw-bold';
                break;
            case 'success':
                status.className = 'text-success fw-bold';
                break;
            default:
                status.className = 'text-info';
        }
        
        Logger.info(`Status aggiornato: ${messaggio} (${tipo})`);
    }
};

// Gestione filtri
const FilterManager = {
    // Aggiorna filtri
    aggiornaFiltri() {
        // Comuni
        const comuni = [...new Set([
            ...DataLoader.mercatini.map(m => m.Comune).filter(Boolean),
            ...DataLoader.fiere.map(f => f.Comune).filter(Boolean)
        ])];
        
        const comuneSelect = document.getElementById('comuneFilter');
        comuneSelect.innerHTML = '<option value="">Tutti i comuni</option>';
        comuni.forEach(comune => {
            const option = document.createElement('option');
            option.value = comune;
            option.textContent = comune;
            comuneSelect.appendChild(option);
        });
        
        // Categorie/Tipologie
        const tipologie = [...new Set([
            ...DataLoader.mercatini.map(m => m.Tipologia).filter(Boolean),
            ...DataLoader.fiere.map(f => f.Tipologia).filter(Boolean)
        ])];
        
        const categoriaSelect = document.getElementById('categoriaFilter');
        categoriaSelect.innerHTML = '<option value="">Tutte le tipologie</option>';
        tipologie.forEach(tipologia => {
            const option = document.createElement('option');
            option.value = tipologia;
            option.textContent = tipologia;
            categoriaSelect.appendChild(option);
        });
        
        Logger.info(`Filtri aggiornati: ${comuni.length} comuni, ${tipologie.length} tipologie`);
    }
};

// Gestione eventi e modali
const EventManager = {
    preferiti: new Set(),
    
    // Carica preferiti
    caricaPreferiti() {
        const salvati = localStorage.getItem('preferiti');
        if (salvati) {
            this.preferiti = new Set(JSON.parse(salvati));
        }
    },
    
    // Salva preferiti
    salvaPreferiti() {
        localStorage.setItem('preferiti', JSON.stringify([...this.preferiti]));
    },
    
    // Toggle preferito
    togglePreferito(eventoId) {
        if (this.preferiti.has(eventoId)) {
            this.preferiti.delete(eventoId);
        } else {
            this.preferiti.add(eventoId);
        }
        
        this.salvaPreferiti();
        this.aggiornaListaPreferiti();
    },
    
    // Controlla se è preferito
    isPreferito(eventoId) {
        return this.preferiti.has(eventoId);
    },
    
    // Aggiorna lista preferiti
    aggiornaListaPreferiti() {
        const lista = document.getElementById('preferitiList');
        const eventi = CalendarManager.getEvents().filter(evento => this.preferiti.has(evento.id));
        
        if (eventi.length === 0) {
            lista.innerHTML = '<p class="text-muted">Nessun evento preferito salvato</p>';
            return;
        }
        
        let html = '';
        eventi.forEach(evento => {
            let dettagli = `📅 ${Utils.formattaData(evento.start)}`;
            
            if (evento.extendedProps.comune) {
                dettagli += ` | 📍 ${evento.extendedProps.comune}`;
            }
            
            if (evento.extendedProps.tipologia && evento.extendedProps.tipologia !== 'N/A') {
                dettagli += ` | 🏷️ ${evento.extendedProps.tipologia}`;
            }
            
            // Aggiungi informazioni sulla ricorrenza per mercatini
            if (evento.extendedProps.tipo === 'mercatino' && evento.extendedProps.giorno && evento.extendedProps.giorno !== 'N/A') {
                let validita = '';
                if (evento.extendedProps.dataInizio === 'ricorrente') {
                    validita = ' | 🔄 Ricorrente tutto l\'anno';
                } else if (evento.extendedProps.dataInizio && evento.extendedProps.dataInizio !== 'N/A') {
                    validita = ` | 📅 Dal ${evento.extendedProps.dataInizio}`;
                    if (evento.extendedProps.dataFine && evento.extendedProps.dataFine !== 'N/A' && evento.extendedProps.dataFine !== 'ricorrente') {
                        validita += ` al ${evento.extendedProps.dataFine}`;
                    }
                }
                dettagli += validita;
            }
            
            html += `
                <div class="event-item">
                    <div class="event-title">${evento.title}</div>
                    <div class="event-details">
                        ${dettagli}
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-sm btn-primary" onclick="EventManager.mostraDettagliEvento(${JSON.stringify(evento)})">
                            📋 Dettagli
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="EventManager.togglePreferito('${evento.id}')">
                            💔 Rimuovi
                        </button>
                    </div>
                </div>
            `;
        });
        
        lista.innerHTML = html;
    },
    
    // Mostra dettagli evento
    mostraDettagliEvento(evento) {
        const modal = new bootstrap.Modal(document.getElementById('eventModal'));
        const title = document.getElementById('eventModalTitle');
        const body = document.getElementById('eventModalBody');
        
        title.textContent = evento.title;
        
        let html = `
            <div class="event-detail-row">
                <span class="event-detail-label">📅 Data:</span>
                <span class="event-detail-value">${Utils.formattaData(evento.start)}</span>
            </div>
            <div class="event-detail-row">
                <span class="event-detail-label">🏘️ Comune:</span>
                <span class="event-detail-value">${evento.extendedProps.comune}</span>
            </div>
            <div class="event-detail-row">
                <span class="event-detail-label">🏷️ Tipologia:</span>
                <span class="event-detail-value">${evento.extendedProps.tipologia}</span>
            </div>
        `;
        
        // Aggiungi campi specifici per mercatini
        if (evento.extendedProps.tipo === 'mercatino') {
            if (evento.extendedProps.giorno && evento.extendedProps.giorno !== 'N/A') {
                html += `
                    <div class="event-detail-row">
                        <span class="event-detail-label">🔄 Ricorrenza:</span>
                        <span class="event-detail-value">${evento.extendedProps.giorno}</span>
                    </div>
                `;
            }
            
            if (evento.extendedProps.dataInizio && evento.extendedProps.dataInizio !== 'N/A') {
                const validita = evento.extendedProps.dataInizio === 'ricorrente' ? 'Tutto l\'anno' : `Dal ${evento.extendedProps.dataInizio}`;
                html += `
                    <div class="event-detail-row">
                        <span class="event-detail-label">📅 Validità:</span>
                        <span class="event-detail-value">${validita}</span>
                    </div>
                `;
            }
            
            if (evento.extendedProps.dataFine && evento.extendedProps.dataFine !== 'N/A' && evento.extendedProps.dataFine !== 'ricorrente') {
                html += `
                    <div class="event-detail-row">
                        <span class="event-detail-label">🏁 Fino al:</span>
                        <span class="event-detail-value">${evento.extendedProps.dataFine}</span>
                    </div>
                `;
            }
            
            if (evento.extendedProps.settori && evento.extendedProps.settori !== 'N/A') {
                html += `
                    <div class="event-detail-row">
                        <span class="event-detail-label">🛍️ Settori:</span>
                        <span class="event-detail-value">${evento.extendedProps.settori}</span>
                    </div>
                `;
            }
        }
        
        // Aggiungi campi specifici per fiere
        if (evento.extendedProps.tipo === 'fiera') {
            if (evento.extendedProps.mese && evento.extendedProps.mese !== 'N/A') {
                html += `
                    <div class="event-detail-row">
                        <span class="event-detail-label">📅 Mese:</span>
                        <span class="event-detail-value">${evento.extendedProps.mese}</span>
                    </div>
                `;
            }
            
            if (evento.extendedProps.dataInizio && evento.extendedProps.dataInizio !== 'N/A') {
                html += `
                    <div class="event-detail-row">
                        <span class="event-detail-label">🚀 Data Inizio:</span>
                        <span class="event-detail-value">${evento.extendedProps.dataInizio}</span>
                    </div>
                `;
            }
            
            if (evento.extendedProps.dataFine && evento.extendedProps.dataFine !== 'N/A') {
                html += `
                    <div class="event-detail-row">
                        <span class="event-detail-label">🏁 Data Fine:</span>
                        <span class="event-detail-value">${evento.extendedProps.dataFine}</span>
                    </div>
                `;
            }
        }
        
        // Aggiungi campi comuni
        html += `
            <div class="event-detail-row">
                <span class="event-detail-label">📍 Luogo:</span>
                <span class="event-detail-value">${evento.extendedProps.luogo}</span>
            </div>
            <div class="event-detail-row">
                <span class="event-detail-label">🕐 Orario:</span>
                <span class="event-detail-value">${evento.extendedProps.orario}</span>
            </div>
            <div class="event-detail-row">
                <span class="event-detail-label">👥 Organizzatore:</span>
                <span class="event-detail-value">${evento.extendedProps.organizzatore}</span>
            </div>
        `;
        
        body.innerHTML = html;
        modal.show();
    },
    
    // Mostra eventi del giorno
    mostraEventiGiorno(data) {
        const modal = new bootstrap.Modal(document.getElementById('dailyModal'));
        const title = document.getElementById('dailyModalTitle');
        const body = document.getElementById('dailyModalBody');
        
        title.textContent = `Eventi del ${Utils.formattaData(data)}`;
        
        const eventiGiorno = CalendarManager.getEvents().filter(evento => 
            evento.start.toISOString().split('T')[0] === data
        );
        
        if (eventiGiorno.length === 0) {
            body.innerHTML = '<p class="text-muted">Nessun evento per questo giorno</p>';
        } else {
            let html = '';
            eventiGiorno.forEach(evento => {
                let dettagli = `📍 ${evento.extendedProps.comune}`;
                
                if (evento.extendedProps.tipologia && evento.extendedProps.tipologia !== 'N/A') {
                    dettagli += ` | 🏷️ ${evento.extendedProps.tipologia}`;
                }
                
                if (evento.extendedProps.orario && evento.extendedProps.orario !== 'N/A') {
                    dettagli += ` | 🕐 ${evento.extendedProps.orario}`;
                }
                
                if (evento.extendedProps.luogo && evento.extendedProps.luogo !== 'N/A') {
                    dettagli += ` | 📍 ${evento.extendedProps.luogo}`;
                }
                
                // Aggiungi informazioni sulla ricorrenza per mercatini
                if (evento.extendedProps.tipo === 'mercatino' && evento.extendedProps.giorno && evento.extendedProps.giorno !== 'N/A') {
                    let validita = '';
                    if (evento.extendedProps.dataInizio === 'ricorrente') {
                        validita = ' | 🔄 Ricorrente tutto l\'anno';
                    } else if (evento.extendedProps.dataInizio && evento.extendedProps.dataInizio !== 'N/A') {
                        validita = ` | 📅 Dal ${evento.extendedProps.dataInizio}`;
                        if (evento.extendedProps.dataFine && evento.extendedProps.dataFine !== 'N/A' && evento.extendedProps.dataFine !== 'ricorrente') {
                            validita += ` al ${evento.extendedProps.dataFine}`;
                        }
                    }
                    dettagli += validita;
                }
                
                html += `
                    <div class="event-item">
                        <div class="event-title">${evento.title}</div>
                        <div class="event-details">
                            ${dettagli}
                        </div>
                        <div class="event-actions">
                            <button class="btn btn-sm btn-primary" onclick="EventManager.mostraDettagliEvento(${JSON.stringify(evento)})">
                                📋 Dettagli
                            </button>
                            <button class="btn btn-sm btn-success" onclick="EventManager.togglePreferito('${evento.id}')">
                                ${this.isPreferito(evento.id) ? '💔 Rimuovi' : '❤️ Aggiungi'}
                            </button>
                        </div>
                    </div>
                `;
            });
            body.innerHTML = html;
        }
        
        modal.show();
    },
    
    // Aggiorna eventi vicini
    aggiornaEventiVicini() {
        const container = document.getElementById('eventiVicini');
        const eventi = CalendarManager.getEvents().filter(evento => 
            evento.start >= new Date()
        ).slice(0, 5);
        
        if (eventi.length === 0) {
            container.innerHTML = '<p class="text-muted">Nessun evento futuro trovato</p>';
            return;
        }
        
        let html = '';
        eventi.forEach(evento => {
            let dettagli = `📅 ${Utils.formattaData(evento.start)}`;
            
            if (evento.extendedProps.comune) {
                dettagli += ` | 📍 ${evento.extendedProps.comune}`;
            }
            
            if (evento.extendedProps.tipologia && evento.extendedProps.tipologia !== 'N/A') {
                dettagli += ` | 🏷️ ${evento.extendedProps.tipologia}`;
            }
            
            // Aggiungi informazioni sulla ricorrenza per mercatini
            if (evento.extendedProps.tipo === 'mercatino' && evento.extendedProps.giorno && evento.extendedProps.giorno !== 'N/A') {
                let validita = '';
                if (evento.extendedProps.dataInizio === 'ricorrente') {
                    validita = ' | 🔄 Ricorrente tutto l\'anno';
                } else if (evento.extendedProps.dataInizio && evento.extendedProps.dataInizio !== 'N/A') {
                    validita = ` | 📅 Dal ${evento.extendedProps.dataInizio}`;
                    if (evento.extendedProps.dataFine && evento.extendedProps.dataFine !== 'N/A' && evento.extendedProps.dataFine !== 'ricorrente') {
                        validita += ` al ${evento.extendedProps.dataFine}`;
                    }
                }
                dettagli += validita;
            }
            
            html += `
                <div class="event-item">
                    <div class="event-title">${evento.title}</div>
                    <div class="event-details">
                        ${dettagli}
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-sm btn-primary" onclick="EventManager.mostraDettagliEvento(${JSON.stringify(evento)})">
                            📋 Dettagli
                        </button>
                        <button class="btn btn-sm btn-success" onclick="EventManager.togglePreferito('${evento.id}')">
                            ${this.isPreferito(evento.id) ? '💔 Rimuovi' : '❤️ Aggiungi'}
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
};

// Inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
