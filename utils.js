// Configurazione dell'applicazione
console.log('🚀 Caricamento utils.js...');

const CONFIG = {
    // Google Sheets URLs
    GOOGLE_SHEETS_URL: 'https://docs.google.com/spreadsheets/d/1BCCgGLKYZOz3SdWZx199kbp1PV387N_qzM3oTuRVESU/gviz/tq?tqx=out:csv&sheet=Foglio1',
    
    // Impostazioni calendario
    CALENDAR: {
        INITIAL_VIEW: 'dayGridMonth',
        LOCALE: 'it',
        HEIGHT: 'auto',
        MONTHS_TO_GENERATE: 12
    },
    
    // Colori eventi
    COLORS: {
        MERCATINO: '#28a745',
        FIERA: '#ffc107',
        FIERA_TEXT: '#000'
    },
    
    // Logging
    DEBUG: true,
    
    // Timeout e intervalli
    TIMEOUTS: {
        LOADING: 30000,
        RENDER_DELAY: 100
    }
};

console.log('📝 Definizione Logger...');

// Utility per il logging
const Logger = {
    info: (message, data = null) => {
        if (CONFIG.DEBUG) {
            console.log(`ℹ️ ${message}`, data || '');
        }
    },
    
    success: (message, data = null) => {
        if (CONFIG.DEBUG) {
            console.log(`✅ ${message}`, data || '');
        }
    },
    
    warning: (message, data = null) => {
        if (CONFIG.DEBUG) {
            console.warn(`⚠️ ${message}`, data || '');
        }
    },
    
    error: (message, data = null) => {
        if (CONFIG.DEBUG) {
            console.error(`❌ ${message}`, data || '');
        }
    },
    
    debug: (message, data = null) => {
        if (CONFIG.DEBUG) {
            console.log(`🔍 ${message}`, data || '');
        }
    }
};

console.log('🔧 Definizione Utils...');

// Utility per la gestione delle date e dati
const Utils = {
    // Genera date per mercatini ricorrenti
    generaDateMercatino(giorno, anno, mesi, dataInizio = null, dataFine = null) {
        if (!giorno) return null;
        
        // Pulisci i dati
        const giornoPulito = giorno.toString().trim().replace(/\r/g, '');
        
        const date = [];
        let dataInizioCalcolo = new Date(anno, 0, 1);
        let dataFineCalcolo = new Date(anno, mesi, 0);
        
        // Se ci sono date specifiche, usa quelle come limite
        if (dataInizio && dataInizio !== 'ricorrente') {
            try {
                const [giornoInizio, meseInizio] = dataInizio.split('/');
                if (giornoInizio && meseInizio) {
                    dataInizioCalcolo = new Date(anno, parseInt(meseInizio) - 1, parseInt(giornoInizio));
                }
            } catch (error) {
                Logger.warning(`Errore parsing data inizio: ${dataInizio}`);
            }
        }
        
        if (dataFine && dataFine !== 'ricorrente') {
            try {
                const [giornoFine, meseFine] = dataFine.split('/');
                if (giornoFine && meseFine) {
                    dataFineCalcolo = new Date(anno, parseInt(meseFine) - 1, parseInt(giornoFine));
                }
            } catch (error) {
                Logger.warning(`Errore parsing data fine: ${dataFine}`);
            }
        }
        
        // Determina il giorno della settimana
        let giornoSettimana = -1;
        if (giornoPulito.includes('domenica')) giornoSettimana = 0;
        else if (giornoPulito.includes('lunedì') || giornoPulito.includes('lunedi') || giornoPulito.includes('Lunedì') || giornoPulito.includes('Lunedi')) giornoSettimana = 1;
        else if (giornoPulito.includes('martedì') || giornoPulito.includes('martedi') || giornoPulito.includes('Martedì') || giornoPulito.includes('Martedi')) giornoSettimana = 2;
        else if (giornoPulito.includes('mercoledì') || giornoPulito.includes('mercoledi') || giornoPulito.includes('Mercoledì') || giornoPulito.includes('Mercoledi')) giornoSettimana = 3;
        else if (giornoPulito.includes('giovedì') || giornoPulito.includes('giovedi') || giornoPulito.includes('Giovedì') || giornoPulito.includes('Giovedi')) giornoSettimana = 4;
        else if (giornoPulito.includes('venerdì') || giornoPulito.includes('venerdi') || giornoPulito.includes('Venerdì') || giornoPulito.includes('Venerdi')) giornoSettimana = 5;
        else if (giornoPulito.includes('sabato') || giornoPulito.includes('Sabato')) giornoSettimana = 6;
        
        if (giornoSettimana === -1) {
            Logger.error(`Giorno non riconosciuto: ${giornoPulito}`);
            return null;
        }
        
        // Trova il primo giorno della settimana a partire dalla data inizio
        let data = new Date(dataInizioCalcolo);
        while (data.getDay() !== giornoSettimana) {
            data.setDate(data.getDate() + 1);
        }
        
        // Genera date per il periodo specificato
        while (data <= dataFineCalcolo) {
            if (data >= new Date()) {
                date.push(data.toISOString().split('T')[0]);
            }
            data.setDate(data.getDate() + 7);
        }
        
        return date;
    },
    
    // Genera data per fiere
    generaDataFiera(dataInizio, anno) {
        if (!dataInizio) return null;
        
        // Pulisci i dati
        const dataPulita = dataInizio.toString().trim().replace(/\r/g, '');
        
        // Gestisci formato DD/MM
        if (dataPulita.includes('/')) {
            const parti = dataPulita.split('/');
            if (parti.length >= 2) {
                const [giorno, mese] = parti;
                if (!isNaN(giorno) && !isNaN(mese)) {
                    const data = new Date(anno, parseInt(mese) - 1, parseInt(giorno));
                    if (data >= new Date()) {
                        return data.toISOString().split('T')[0];
                    }
                }
            }
        }
        
        // Gestisci formato DD.MM.YYYY
        if (dataPulita.includes('.')) {
            const parti = dataPulita.split('.');
            if (parti.length >= 3) {
                const [giorno, mese, annoData] = parti;
                if (!isNaN(giorno) && !isNaN(mese)) {
                    const annoUsato = annoData && !isNaN(annoData) ? parseInt(annoData) : anno;
                    const data = new Date(annoUsato, parseInt(mese) - 1, parseInt(giorno));
                    if (data >= new Date()) {
                        return data.toISOString().split('T')[0];
                    }
                }
            }
        }
        
        // Gestisci formato solo mese
        const mesi = {
            'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
            'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
        };
        
        for (let [meseNome, meseNum] of Object.entries(mesi)) {
            if (dataPulita.toLowerCase().includes(meseNome)) {
                const data = new Date(anno, meseNum, 1);
                if (data >= new Date()) {
                    return data.toISOString().split('T')[0];
                }
            }
        }
        
        return null;
    },
    
    // Pulisci e valida i dati
    validaDati(item) {
        return {
            comune: item.Comune && item.Comune.trim(),
            evento: item.Evento && item.Evento.trim(),
            tipologia: item.Tipologia && item.Tipologia.trim(),
            giorno: item.Giorno && item.Giorno.trim(),
            dataInizio: item['Data inizio'] && item['Data inizio'].trim(),
            dataFine: item['Data fine'] && item['Data fine'].trim(),
            mese: item.Mese && item.Mese.trim(),
            orario: item.Orario || item['Orario di svolgimento'],
            luogo: item.Luogo || item['Luogo di svolgimento'],
            organizzatore: item.Organizzatore || item['Soggetto organizzatore'],
            settori: item['Settori merceologici']
        };
    },
    
    // Controlla se è online
    isOnline() {
        return navigator.onLine;
    },
    
    // Formatta data per visualizzazione
    formattaData(data) {
        return new Date(data).toLocaleDateString('it-IT');
    },
    
    // Genera ID univoco per evento
    generaIdEvento(tipo, comune, data) {
        return `${tipo}_${comune}_${data}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }
};

console.log('📅 Definizione CalendarManager...');

// Gestione del calendario FullCalendar
const CalendarManager = {
    calendar: null,
    
    // Inizializza il calendario
    init() {
        Logger.info('Inizializzazione calendario...');
        
        const calendarEl = document.getElementById('calendar');
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: CONFIG.CALENDAR.INITIAL_VIEW,
            locale: CONFIG.CALENDAR.LOCALE,
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
            height: CONFIG.CALENDAR.HEIGHT,
            eventClick: (info) => this.onEventClick(info.event),
            dateClick: (info) => this.onDayClick(info.dateStr),
            eventClassNames: (arg) => this.getEventClassNames(arg),
            dayMaxEvents: false, // Mostra tutti gli eventi per giorno
            eventDisplay: 'block', // Mostra eventi come blocchi
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
            }
        });
        
        this.calendar.render();
        Logger.success('Calendario inizializzato');
    },
    
    // Gestisce il click su un evento
    onEventClick(evento) {
        Logger.debug('Click su evento:', evento.title);
        EventManager.mostraDettagliEvento(evento);
    },
    
    // Gestisce il click su un giorno
    onDayClick(data) {
        Logger.debug('Click su giorno:', data);
        EventManager.mostraEventiGiorno(data);
    },
    
    // Restituisce le classi CSS per gli eventi
    getEventClassNames(arg) {
        const classNames = ['fade-in'];
        if (arg.event.extendedProps.tipo === 'mercatino') {
            classNames.push('fc-event-mercatino');
        } else if (arg.event.extendedProps.tipo === 'fiera') {
            classNames.push('fc-event-fiera');
        }
        return classNames;
    },
    
    // Rimuove tutti gli eventi
    clearEvents() {
        if (this.calendar) {
            this.calendar.removeAllEvents();
            Logger.info('Eventi rimossi dal calendario');
        }
    },
    
    // Aggiunge un evento
    addEvent(evento) {
        if (this.calendar) {
            try {
                this.calendar.addEvent(evento);
                Logger.success(`Evento aggiunto: ${evento.title} - ${evento.start}`);
                return true;
            } catch (error) {
                Logger.error(`Errore aggiunta evento: ${error.message}`);
                return false;
            }
        }
        return false;
    },
    
    // Aggiunge più eventi
    addEvents(eventi) {
        if (this.calendar && eventi.length > 0) {
            let successi = 0;
            eventi.forEach(evento => {
                if (this.addEvent(evento)) {
                    successi++;
                }
            });
            Logger.success(`${successi}/${eventi.length} eventi aggiunti con successo`);
            
            // Forza refresh del calendario
            setTimeout(() => {
                this.calendar.render();
            }, CONFIG.TIMEOUTS.RENDER_DELAY);
        }
    },
    
    // Restituisce tutti gli eventi
    getEvents() {
        return this.calendar ? this.calendar.getEvents() : [];
    },
    
    // Restituisce il numero di eventi
    getEventCount() {
        return this.getEvents().length;
    },
    
    // Filtra gli eventi
    filterEvents(filtri) {
        const eventi = this.getEvents();
        let eventiVisibili = 0;
        
        eventi.forEach(evento => {
            let mostra = true;
            
            if (filtri.comune && evento.extendedProps.comune !== filtri.comune) {
                mostra = false;
            }
            
            if (filtri.categoria && evento.extendedProps.tipologia !== filtri.categoria) {
                mostra = false;
            }
            
            if (filtri.tipo && evento.extendedProps.tipo !== filtri.tipo) {
                mostra = false;
            }
            
            if (mostra) {
                evento.setProp('display', 'auto');
                eventiVisibili++;
            } else {
                evento.setProp('display', 'none');
            }
        });
        
        Logger.info(`Filtri applicati: ${eventiVisibili}/${eventi.length} eventi visibili`);
        return eventiVisibili;
    },
    
    // Aggiorna la vista
    refresh() {
        if (this.calendar) {
            this.calendar.render();
            Logger.info('Calendario aggiornato');
        }
    }
};

console.log('📊 Definizione DataLoader...');

// Gestione del caricamento e parsing dei dati
const DataLoader = {
    mercatini: [],
    fiere: [],
    
    // Carica tutti i dati
    async caricaDati() {
        Logger.info('🚀 Avvio caricamento dati...');
        
        try {
            // Carica entrambi i dataset in parallelo
            await Promise.all([
                this.caricaMercatini(),
                this.caricaFiere()
            ]);
            
            Logger.success('✅ Tutti i dati caricati');
            
            // Aggiorna UI
            FilterManager.aggiornaFiltri();
            this.aggiornaCalendario();
            EventManager.aggiornaEventiVicini();
            
            return true;
            
        } catch (error) {
            Logger.error('❌ Errore durante il caricamento dati:', error);
            throw error;
        }
    },
    
    // Carica mercatini da Google Sheets
    async caricaMercatini() {
        Logger.info('Caricamento mercatini...');
        
        try {
            const response = await fetch(CONFIG.GOOGLE_SHEETS_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.text();
            Logger.info(`📊 Dati mercatini ricevuti: ${data.length} caratteri`);
            
            return new Promise((resolve, reject) => {
                Papa.parse(data, {
                    header: true,
                    delimiter: ',',
                    skipEmptyLines: true,
                    complete: (results) => {
                        Logger.success(`✅ Parsing mercatini completato: ${results.data.length} righe`);
                        
                        // Filtra solo i mercatini
                        this.mercatini = results.data.filter(item => {
                            const dati = Utils.validaDati(item);
                            
                            // Verifica che sia un mercatino
                            const isMercatino = (dati.evento && dati.evento.toLowerCase().includes('mercatino')) ||
                                               (dati.tipologia && dati.tipologia.toLowerCase().includes('mercatino'));
                            
                            // Verifica che abbia i campi necessari
                            const hasRequiredFields = dati.comune && 
                                                    (dati.giorno || dati.dataInizio || dati.mese);
                            
                            return isMercatino && hasRequiredFields;
                        });
                        
                        Logger.success(`Mercatini validi: ${this.mercatini.length}`);
                        resolve();
                    },
                    error: (error) => {
                        Logger.error(`Errore parsing mercatini: ${error.message}`);
                        reject(error);
                    }
                });
            });
            
        } catch (error) {
            Logger.error(`Errore caricamento mercatini: ${error.message}`);
            throw error;
        }
    },
    
    // Carica fiere da Google Sheets
    async caricaFiere() {
        Logger.info('Caricamento fiere...');
        
        try {
            const response = await fetch(CONFIG.GOOGLE_SHEETS_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.text();
            Logger.info(`📊 Dati fiere ricevuti: ${data.length} caratteri`);
            
            return new Promise((resolve, reject) => {
                Papa.parse(data, {
                    header: true,
                    delimiter: ',',
                    skipEmptyLines: true,
                    complete: (results) => {
                        Logger.success(`✅ Parsing fiere completato: ${results.data.length} righe`);
                        
                        // Filtra solo le fiere/eventi (tutto tranne mercatini)
                        this.fiere = results.data.filter(item => {
                            const dati = Utils.validaDati(item);
                            
                            // Verifica che NON sia un mercatino
                            const isNotMercatino = !(dati.evento && dati.evento.toLowerCase().includes('mercatino')) &&
                                                  !(dati.tipologia && dati.tipologia.toLowerCase().includes('mercatino'));
                            
                            // Verifica che abbia i campi necessari
                            const hasRequiredFields = dati.comune && 
                                                    (dati.dataInizio || dati.mese || dati.giorno);
                            
                            return isNotMercatino && hasRequiredFields;
                        });
                        
                        Logger.success(`Fiere valide: ${this.fiere.length}`);
                        resolve();
                    },
                    error: (error) => {
                        Logger.error(`Errore parsing fiere: ${error.message}`);
                        reject(error);
                    }
                });
            });
            
        } catch (error) {
            Logger.error(`Errore caricamento fiere: ${error.message}`);
            throw error;
        }
    },
    
    // Aggiorna calendario con tutti gli eventi
    aggiornaCalendario() {
        Logger.info('Aggiornamento calendario...');
        
        // Rimuovi eventi esistenti
        CalendarManager.clearEvents();
        
        let eventiAggiunti = 0;
        const oggi = new Date();
        const anno = oggi.getFullYear();
        
        // Aggiungi mercatini
        Logger.info('🛒 Aggiunta mercatini al calendario...');
        this.mercatini.forEach((mercatino) => {
            const dati = Utils.validaDati(mercatino);
            
            let date = null;
            
            // Prova prima con Giorno (per ricorrenze)
            if (dati.giorno) {
                date = Utils.generaDateMercatino(dati.giorno, anno, CONFIG.CALENDAR.MONTHS_TO_GENERATE, dati.dataInizio, dati.dataFine);
            }
            
            // Se non funziona, prova con Data inizio
            if (!date && dati.dataInizio) {
                date = Utils.generaDataFiera(dati.dataInizio, anno);
                if (date) {
                    date = [date]; // Converti in array per compatibilità
                }
            }
            
            // Se non funziona, prova con Mese
            if (!date && dati.mese) {
                date = Utils.generaDataFiera(dati.mese, anno);
                if (date) {
                    date = [date]; // Converti in array per compatibilità
                }
            }
            
            if (date && date.length > 0) {
                const eventi = date.map((dataSingola, index) => ({
                    id: `mercatino_${dati.comune}_${dataSingola}_${index}`,
                    title: `🛒 ${dati.comune}`,
                    start: dataSingola,
                    end: dataSingola,
                    backgroundColor: CONFIG.COLORS.MERCATINO,
                    borderColor: CONFIG.COLORS.MERCATINO,
                    extendedProps: {
                        tipo: 'mercatino',
                        comune: dati.comune,
                        giorno: dati.giorno || 'N/A',
                        orario: dati.orario || 'N/A',
                        luogo: dati.luogo || 'N/A',
                        tipologia: dati.tipologia || 'N/A',
                        organizzatore: dati.organizzatore || 'N/A',
                        settori: dati.settori || 'N/A',
                        dataInizio: dati.dataInizio || 'N/A',
                        dataFine: dati.dataFine || 'N/A'
                    }
                }));
                
                CalendarManager.addEvents(eventi);
                eventiAggiunti += eventi.length;
            }
        });
        
        Logger.success(`Mercatini aggiunti: ${eventiAggiunti} eventi totali`);
        
        // Aggiungi fiere
        Logger.info('🎪 Aggiunta fiere al calendario...');
        let fiereAggiunte = 0;
        
        this.fiere.forEach((fiera) => {
            const dati = Utils.validaDati(fiera);
            
            let date = null;
            
            // Prova prima con Data inizio
            if (dati.dataInizio) {
                date = Utils.generaDataFiera(dati.dataInizio, anno);
            }
            
            // Se non funziona, prova con Mese
            if (!date && dati.mese) {
                date = Utils.generaDataFiera(dati.mese, anno);
            }
            
            // Se non funziona, prova con Giorno
            if (!date && dati.giorno) {
                date = Utils.generaDataFiera(dati.giorno, anno);
            }
            
            if (date) {
                const evento = {
                    id: `fiera_${dati.comune}_${date}_${fiereAggiunte}`,
                    title: `🎪 ${dati.evento || dati.comune}`,
                    start: date,
                    end: date,
                    backgroundColor: CONFIG.COLORS.FIERA,
                    borderColor: CONFIG.COLORS.FIERA,
                    textColor: CONFIG.COLORS.FIERA_TEXT,
                    extendedProps: {
                        tipo: 'fiera',
                        comune: dati.comune,
                        evento: dati.evento || dati.comune,
                        tipologia: dati.tipologia || 'N/A',
                        mese: dati.mese || 'N/A',
                        luogo: dati.luogo || 'N/A',
                        orario: dati.orario || 'N/A',
                        organizzatore: dati.organizzatore || 'N/A',
                        dataInizio: dati.dataInizio || 'N/A',
                        dataFine: dati.dataFine || 'N/A'
                    }
                };
                
                if (CalendarManager.addEvent(evento)) {
                    fiereAggiunte++;
                }
            }
        });
        
        Logger.success(`Fiere aggiunte: ${fiereAggiunte} eventi totali`);
        Logger.info(`Totale eventi nel calendario: ${CalendarManager.getEventCount()}`);
        
        // Forza refresh finale
        CalendarManager.refresh();
    }
};

console.log('🎯 Definizione App...');

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
    }
};

console.log('🔍 Definizione FilterManager...');

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
    }
};

console.log('⭐ Definizione EventManager...');

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
            
            if (evento.extendedProps.settori && evento.extendedProps.settori !== 'N/A') {
                html += `
                    <div class="event-detail-row">
                        <span class="event-detail-label">🛍️ Settori:</span>
                        <span class="event-detail-value">${evento.extendedProps.settori}</span>
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
        } else {
            let html = '';
            eventi.forEach(evento => {
                let dettagli = `📅 ${Utils.formattaData(evento.start)}`;
                
                if (evento.extendedProps.comune) {
                    dettagli += ` | 📍 ${evento.extendedProps.comune}`;
                }
                
                if (evento.extendedProps.tipologia && evento.extendedProps.tipologia !== 'N/A') {
                    dettagli += ` | 🏷️ ${evento.extendedProps.tipologia}`;
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
    }
};

console.log('🎬 Setup inizializzazione...');

// Inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM caricato, avvio App.init()...');
    App.init();
});

// Rendi App accessibile globalmente
window.app = App;
console.log('✅ App resa accessibile globalmente come window.app');
console.log('🎯 Tutti i moduli caricati:', {
    CONFIG: !!CONFIG,
    Logger: !!Logger,
    Utils: !!Utils,
    CalendarManager: !!CalendarManager,
    DataLoader: !!DataLoader,
    App: !!App,
    FilterManager: !!FilterManager,
    EventManager: !!EventManager
});

// Test di funzionalità
console.log('🧪 Test funzionalità:');
console.log('- CONFIG.GOOGLE_SHEETS_URL:', CONFIG.GOOGLE_SHEETS_URL);
console.log('- Logger.info test:', typeof Logger.info);
console.log('- Utils.formattaData test:', typeof Utils.formattaData);
console.log('- CalendarManager.init test:', typeof CalendarManager.init);
console.log('- DataLoader.caricaDati test:', typeof DataLoader.caricaDati);
console.log('- App.init test:', typeof App.init);
console.log('- window.app test:', typeof window.app);
