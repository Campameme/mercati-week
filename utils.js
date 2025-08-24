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
    // Genera date per mercatini ricorrenti - NUOVA LOGICA per struttura aggiornata
    generaDateMercatino(dati, anno = new Date().getFullYear(), mesi = CONFIG.CALENDAR.MONTHS_TO_GENERATE) {
        const { dataInizio, dataFine, giornoRicorrente, comune } = dati;
        
        console.log(`📅 Generazione date per ${comune}:`, { dataInizio, dataFine, giornoRicorrente });
        
        // Verifica che abbiamo il giorno ricorrente
        if (!giornoRicorrente) {
            console.log('⚠️ Nessun giorno ricorrente specificato');
            return [];
        }
        
        const date = [];
        const oggi = new Date();
        
        // Determina il periodo di validità
        let dataPartenza, dataLimite;
        
        if (dataInizio === 'ricorrente' && dataFine === 'ricorrente') {
            // Valido tutto l'anno - generiamo date per i prossimi mesi
            console.log('✅ Evento ricorrente tutto l\'anno');
            dataPartenza = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
            dataLimite = new Date(oggi.getFullYear(), oggi.getMonth() + mesi, 0);
        } else {
            // Valido solo per periodo specifico
            console.log('📅 Evento con periodo limitato');
            
            if (dataInizio && dataInizio !== 'ricorrente') {
                try {
                    const [giornoI, meseI] = dataInizio.split('/').map(Number);
                    if (giornoI && meseI && !isNaN(giornoI) && !isNaN(meseI)) {
                        dataPartenza = new Date(anno, meseI - 1, giornoI);
                    } else {
                        console.warn(`⚠️ Data inizio non valida per ${comune}: ${dataInizio}`);
                        dataPartenza = new Date(anno, 0, 1);
                    }
                } catch (error) {
                    console.warn(`⚠️ Errore parsing data inizio per ${comune}: ${dataInizio}`, error);
                    dataPartenza = new Date(anno, 0, 1);
                }
            } else {
                dataPartenza = new Date(anno, 0, 1); // Inizio anno
            }
            
            if (dataFine && dataFine !== 'ricorrente') {
                try {
                    const [giornoF, meseF] = dataFine.split('/').map(Number);
                    if (giornoF && meseF && !isNaN(giornoF) && !isNaN(meseF)) {
                        dataLimite = new Date(anno, meseF - 1, giornoF);
                    } else {
                        console.warn(`⚠️ Data fine non valida per ${comune}: ${dataFine}`);
                        dataLimite = new Date(anno, 11, 31);
                    }
                } catch (error) {
                    console.warn(`⚠️ Errore parsing data fine per ${comune}: ${dataFine}`, error);
                    dataLimite = new Date(anno, 11, 31);
                }
            } else {
                dataLimite = new Date(anno, 11, 31); // Fine anno
            }
        }
        
        // Verifica che le date siano valide
        if (!dataPartenza || isNaN(dataPartenza.getTime())) {
            console.warn(`⚠️ Data partenza non valida per ${comune}, uso inizio anno`);
            dataPartenza = new Date(anno, 0, 1);
        }
        
        if (!dataLimite || isNaN(dataLimite.getTime())) {
            console.warn(`⚠️ Data limite non valida per ${comune}, uso fine anno`);
            dataLimite = new Date(anno, 11, 31);
        }
        
        console.log(`📅 Periodo: da ${dataPartenza.toLocaleDateString()} a ${dataLimite.toLocaleDateString()}`);
        
        // Analizza il giorno ricorrente e genera le date
        const dateGenerate = this.parseGiornoRicorrente(giornoRicorrente, dataPartenza, dataLimite);
        
        console.log(`📊 Generate ${dateGenerate.length} date per ${comune}`);
        return dateGenerate.map(d => d.toISOString().split('T')[0]);
    },
    
    // Nuova funzione per interpretare il "giorno ricorrente"
    parseGiornoRicorrente(giornoRicorrente, dataInizio, dataFine) {
        const giorno = giornoRicorrente.toLowerCase().trim();
        const date = [];
        
        // Giorni della settimana
        const giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
        
        // Caso 1: Giorno settimanale semplice (es: "mercoledì", "giovedì")
        const giornoSettimanale = giorni.findIndex(g => giorno.includes(g));
        if (giornoSettimanale !== -1 && !giorno.includes('°') && !giorno.includes('^') && !giorno.includes('prima') && !giorno.includes('ultima')) {
            console.log(`📅 Giorno settimanale: ${giorni[giornoSettimanale]}`);
            return this.generaDateSettimanali(giornoSettimanale, dataInizio, dataFine);
        }
        
        // Caso 2: Giorni mensili ordinali (es: "2^ domenica del mese", "3^ sabato del mese")
        const ordinaleMatch = giorno.match(/(\d+)[°^]\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)/);
        if (ordinaleMatch) {
            const ordinale = parseInt(ordinaleMatch[1]);
            const giornoDellaSettimana = giorni.indexOf(ordinaleMatch[2]);
            console.log(`📅 ${ordinale}° ${ordinaleMatch[2]} del mese`);
            return this.generaDateMensili(ordinale, giornoDellaSettimana, dataInizio, dataFine);
        }
        
        // Caso 3: Prima/Ultima (es: "prima domenica", "ultima domenica", "tutte le prime domeniche")
        const primaMatch = giorno.match(/prima\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)/);
        const ultimaMatch = giorno.match(/ultima?\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)/);
        const tuttePrimeMatch = giorno.match(/tutte le prime\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)/);
        
        if (primaMatch || tuttePrimeMatch) {
            const matchResult = primaMatch || tuttePrimeMatch;
            const giornoDellaSettimana = giorni.indexOf(matchResult[1]);
            console.log(`📅 Prima ${matchResult[1]} del mese`);
            return this.generaDateMensili(1, giornoDellaSettimana, dataInizio, dataFine);
        }
        
        if (ultimaMatch) {
            const giornoDellaSettimana = giorni.indexOf(ultimaMatch[1]);
            console.log(`📅 Ultima ${ultimaMatch[1]} del mese`);
            return this.generaDateMensili(-1, giornoDellaSettimana, dataInizio, dataFine);
        }
        
        // Caso 4: Complessi (gestiremo caso per caso)
        console.log(`⚠️ Formato giorno ricorrente non riconosciuto: "${giornoRicorrente}"`);
        return [];
    },
    
    // Genera date settimanali
    generaDateSettimanali(giornoSettimana, dataInizio, dataFine) {
        const date = [];
        let data = new Date(dataInizio);
        
        // Trova il primo giorno della settimana nel periodo
        while (data.getDay() !== giornoSettimana && data <= dataFine) {
            data.setDate(data.getDate() + 1);
        }
        
        // Aggiungi tutte le occorrenze settimanali
        while (data <= dataFine) {
            date.push(new Date(data));
            data.setDate(data.getDate() + 7);
        }
        
        return date;
    },
    
    // Genera date mensili (1°, 2°, 3°, ultimo)
    generaDateMensili(ordinale, giornoSettimana, dataInizio, dataFine) {
        const date = [];
        
        // Itera su ogni mese nel periodo
        let data = new Date(dataInizio.getFullYear(), dataInizio.getMonth(), 1);
        const fineData = new Date(dataFine.getFullYear(), dataFine.getMonth(), 1);
        
        while (data <= fineData) {
            let giornoTarget;
            
            if (ordinale === -1) {
                // Ultimo giorno della settimana del mese
                giornoTarget = new Date(data.getFullYear(), data.getMonth() + 1, 0); // Ultimo giorno del mese
                while (giornoTarget.getDay() !== giornoSettimana) {
                    giornoTarget.setDate(giornoTarget.getDate() - 1);
                }
            } else {
                // N-esimo giorno della settimana del mese
                giornoTarget = new Date(data.getFullYear(), data.getMonth(), 1);
                while (giornoTarget.getDay() !== giornoSettimana) {
                    giornoTarget.setDate(giornoTarget.getDate() + 1);
                }
                giornoTarget.setDate(giornoTarget.getDate() + (ordinale - 1) * 7);
                
                // Verifica che sia ancora nello stesso mese
                if (giornoTarget.getMonth() !== data.getMonth()) {
                    data.setMonth(data.getMonth() + 1);
                    continue;
                }
            }
            
            // Aggiungi solo se è nel range
            if (giornoTarget >= dataInizio && giornoTarget <= dataFine) {
                date.push(new Date(giornoTarget));
            }
            
            // Prossimo mese
            data.setMonth(data.getMonth() + 1);
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
    
    // Pulisci e valida i dati - AGGIORNATO per nuova struttura Google Sheet
    validaDati(item) {
        console.log('🔍 Validazione dati item:', item);
        
        // Mappatura colonne per la nuova struttura
        const colonne = Object.keys(item);
        console.log('📋 Colonne disponibili:', colonne);
        
        const dati = {
            comune: this.estraiValore(item, ['Comune', 'comune']),
            tipologia: this.estraiValore(item, ['Tipologia', 'tipologia']),
            dataInizio: this.estraiValore(item, ['Data inizio', 'data inizio', 'dataInizio']),
            dataFine: this.estraiValore(item, ['Data fine', 'data fine', 'dataFine']),
            giornoRicorrente: this.estraiValore(item, ['Giorno ricorrente', 'giorno ricorrente', 'giornoRicorrente']),
            orario: this.estraiValore(item, ['Orario', 'orario', 'Orario di svolgimento']),
            organizzatore: this.estraiValore(item, ['Organizzatore', 'organizzatore', 'Soggetto organizzatore']),
            
            // Manteniamo compatibilità con vecchia struttura
            evento: this.estraiValore(item, ['Evento', 'evento']),
            giorno: this.estraiValore(item, ['Giorno', 'giorno']),
            mese: this.estraiValore(item, ['Mese', 'mese']),
            luogo: this.estraiValore(item, ['Luogo', 'luogo', 'Luogo di svolgimento']),
            settori: this.estraiValore(item, ['Settori merceologici', 'settori'])
        };
        
        console.log('✅ Dati validati:', dati);
        return dati;
    },
    
    // Helper per estrarre valori da possibili nomi di colonna
    estraiValore(item, possibiliNomi) {
        for (const nome of possibiliNomi) {
            if (item[nome] !== undefined && item[nome] !== null && String(item[nome]).trim() !== '') {
                return String(item[nome]).trim();
            }
        }
        return null;
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
        if (!calendarEl) {
            Logger.error('❌ Elemento calendario non trovato!');
            return;
        }
        
        if (typeof FullCalendar === 'undefined') {
            Logger.error('❌ FullCalendar non caricato!');
            return;
        }
        
        Logger.info('✅ Elemento calendario trovato, dimensioni:', {
            width: calendarEl.offsetWidth,
            height: calendarEl.offsetHeight
        });
        
        try {
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
            dayMaxEvents: false, // Mostra tutti gli eventi per ora
            // moreLinkClick: this.onMoreLinkClick.bind(this),
            // moreLinkText: function(num) {
            //     return `+${num} altri`;
            // },
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
            }
        });
        
        this.calendar.render();
        Logger.success('✅ Calendario inizializzato e renderizzato');
        
        // Verifica che il calendario sia stato renderizzato
        setTimeout(() => {
            const fcEvents = calendarEl.querySelectorAll('.fc-event');
            const fcCells = calendarEl.querySelectorAll('.fc-daygrid-day');
            console.log('📊 Stato calendario dopo render:', {
                eventi: fcEvents.length,
                celle: fcCells.length,
                altezza: calendarEl.offsetHeight,
                larghezza: calendarEl.offsetWidth
            });
        }, 100);
        
        } catch (error) {
            Logger.error('❌ Errore inizializzazione calendario:', error);
            console.error('Stack trace:', error.stack);
        }
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
    
    // Gestisce il click su "+N altri"
    onMoreLinkClick(info) {
        Logger.debug('Click su più eventi:', info.date);
        EventManager.mostraEventiGiorno(info.date.toISOString().split('T')[0]);
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
            // Carica tutti gli eventi dal singolo Google Sheet
            await this.caricaMercatini();
            
            Logger.success('✅ Tutti i dati caricati');
            
            // Nascondi indicatore di caricamento
            const loadingText = document.querySelector('.loading-text');
            if (loadingText) {
                loadingText.style.display = 'none';
            }
            
            // Aggiorna UI
            FilterManager.aggiornaFiltri();
            this.aggiornaCalendario();
            EventManager.aggiornaEventiVicini();
            
            return true;
            
        } catch (error) {
            Logger.error('❌ Errore durante il caricamento dati:', error);
            
            // Nascondi indicatore di caricamento anche in caso di errore
            const loadingText = document.querySelector('.loading-text');
            if (loadingText) {
                loadingText.style.display = 'none';
            }
            
            throw error;
        }
    },
    
    // Carica tutti gli eventi da Google Sheets (mercatini e fiere)
    async caricaMercatini() {
        Logger.info('Caricamento eventi da Google Sheet...');
        
        try {
            // Aggiungi timestamp per evitare cache del browser
            const timestamp = new Date().getTime();
            const urlConCache = `${CONFIG.GOOGLE_SHEETS_URL}&_t=${timestamp}`;
            
            Logger.info(`📡 Richiesta dati: ${urlConCache}`);
            const response = await fetch(urlConCache, {
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.text();
            const timeReceived = new Date().toLocaleTimeString();
            Logger.info(`📊 Dati eventi ricevuti alle ${timeReceived}: ${data.length} caratteri`);
            
            // Mostra hash dei primi caratteri per verificare che i dati siano diversi
            const dataHash = data.substring(0, 100);
            console.log(`🔍 Hash dati (primi 100 char): ${dataHash}`);
            
            return new Promise((resolve, reject) => {
                Papa.parse(data, {
                    header: true,
                    delimiter: ',',
                    skipEmptyLines: true,
                    complete: (results) => {
                        Logger.success(`✅ Parsing eventi completato: ${results.data.length} righe`);
                        
                        // 🔍 DEBUG: Analizza le prime righe per capire la struttura
                        console.log('🔍 HEADER (prima riga):', results.data[0]);
                        console.log('🔍 SECONDA riga:', results.data[1]);
                        console.log('🔍 TERZA riga:', results.data[2]);
                        console.log('🔍 Numero colonne nell\'header:', Object.keys(results.data[0] || {}).length);
                        
                        // Prova con delimitatore semicolon
                        if (Object.keys(results.data[0] || {}).length < 5) {
                            console.log('🔄 Troppo poche colonne, riprovo con delimitatore ;');
                            Papa.parse(data, {
                                header: true,
                                delimiter: ';',
                                skipEmptyLines: true,
                                complete: (results2) => {
                                    console.log('🔍 Con delimitatore ;, header:', results2.data[0]);
                                    console.log('🔍 Con delimitatore ;, colonne:', Object.keys(results2.data[0] || {}).length);
                                    this.processResults(results2.data.length > results.data.length ? results2 : results);
                                    resolve();
                                }
                            });
                            return;
                        }
                        
                        this.processResults(results);
                    },
                    error: (error) => {
                        Logger.error('Errore parsing CSV:', error);
                        reject(error);
                    }
                });
            });
        },
        
        // Processa i risultati del parsing
        processResults(results) {
            // Filtra e processa tutti gli eventi
            this.mercatini = results.data.filter((item, index) => {
                            const dati = Utils.validaDati(item);
                            console.log(`🔍 Processando item ${index + 1}:`, dati);
                            
                            // Per Imperia, aggiungi debug specifico
                            if (dati.comune && dati.comune.toLowerCase().includes('imperia')) {
                                console.log('🎯 IMPERIA TROVATA:', {
                                    comune: dati.comune,
                                    tipologia: dati.tipologia,
                                    dataInizio: dati.dataInizio,
                                    dataFine: dati.dataFine,
                                    giornoRicorrente: dati.giornoRicorrente,
                                    oggettoCompleto: dati
                                });
                            }
                            
                            // Verifica che abbia almeno comune e qualche informazione temporale
                            const hasRequiredFields = dati.comune && 
                                (dati.tipologia || dati.giornoRicorrente || dati.dataInizio || dati.dataFine);
                            
                            if (!hasRequiredFields) {
                                console.log('⚠️ Mancano campi richiesti per:', dati.comune, dati);
                                return false;
                            }
                            
                            // Tutti gli eventi con info minime sono validi
                            console.log('✅ Evento valido:', dati.comune, '-', dati.tipologia || 'NO TIPOLOGIA');
                            return true;
                        });
                        
                        Logger.success(`Eventi validi: ${this.mercatini.length}`);
                        resolve();
            },
            
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
        this.mercatini.forEach((mercatino, index) => {
            const dati = Utils.validaDati(mercatino);
            console.log(`🔍 Processando evento calendario ${index + 1}:`, dati);
            
            // Debug specifico per Imperia
            if (dati.comune && dati.comune.toLowerCase().includes('imperia')) {
                console.log('🎯 PROCESSANDO IMPERIA nel calendario:', dati);
            }
            
            let date = null;
            
            // Usa la nuova logica basata su giornoRicorrente
            if (dati.giornoRicorrente) {
                console.log(`📅 Generando date per ${dati.comune} con giorno: ${dati.giornoRicorrente}`);
                date = Utils.generaDateMercatino(dati, anno, CONFIG.CALENDAR.MONTHS_TO_GENERATE);
                console.log(`📊 Date generate per ${dati.comune}:`, date);
            } else {
                console.log(`⚠️ Nessun giorno ricorrente per ${dati.comune}`);
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
                // Determina tipo e colore basandosi sulla tipologia
                const isMercatino = dati.tipologia && dati.tipologia.toLowerCase().includes('mercatino');
                const iconaEvento = isMercatino ? '🛒' : '🎪';
                const coloreEvento = isMercatino ? CONFIG.COLORS.MERCATINO : CONFIG.COLORS.FIERA;
                const tipoEvento = isMercatino ? 'mercatino' : 'fiera';
                
                const eventi = date.map((dataSingola, index) => ({
                    id: `${tipoEvento}_${dati.comune}_${dataSingola}_${index}`,
                    title: `${iconaEvento} ${dati.comune}`,
                    start: dataSingola,
                    end: dataSingola,
                    backgroundColor: coloreEvento,
                    borderColor: coloreEvento,
                    textColor: isMercatino ? 'white' : CONFIG.COLORS.FIERA_TEXT,
                    extendedProps: {
                        tipo: tipoEvento,
                        comune: dati.comune,
                        tipologia: dati.tipologia || 'N/A',
                        giornoRicorrente: dati.giornoRicorrente || 'N/A',
                        orario: dati.orario || 'N/A',
                        luogo: dati.luogo || 'N/A',
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
        
        Logger.success(`Eventi aggiunti: ${eventiAggiunti} eventi totali`);
        Logger.info(`Totale eventi nel calendario: ${CalendarManager.getEventCount()}`);
        
        // Forza refresh finale
        CalendarManager.refresh();
        
        // Verifica finale
        setTimeout(() => {
            const totalEvents = CalendarManager.getEventCount();
            console.log('🎯 Riepilogo finale caricamento:');
            console.log(`- Eventi aggiunti: ${eventiAggiunti || 0}`);
            console.log(`- Eventi totali nel calendario: ${totalEvents}`);
            
            if (totalEvents === 0) {
                console.warn('⚠️ Nessun evento nel calendario! Verifica i dati.');
            } else {
                console.log('✅ Eventi caricati con successo nel calendario!');
            }
        }, 200);
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
        
        // Mostra indicatore di caricamento
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = '⏳ Aggiornamento dati da Google Sheets...';
            loadingText.style.display = 'block';
        }
        
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
                            <button class="btn btn-sm btn-primary" onclick="EventManager.mostraDettagliEventoById('${evento.id}')">
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
    
    // Mostra dettagli evento tramite ID
    mostraDettagliEventoById(eventoId) {
        console.log('🔍 Cercando evento con ID:', eventoId);
        
        // Cerca direttamente negli eventi del calendario
        const calendarEvent = CalendarManager.calendar.getEvents().find(e => e.id === eventoId);
        if (calendarEvent) {
            console.log('✅ Evento trovato nel calendario:', calendarEvent.title);
            this.mostraDettagliEvento(calendarEvent);
        } else {
            console.error('❌ Evento non trovato nel calendario:', eventoId);
            // Fallback: cerca nei dati grezzi
            const evento = DataLoader.mercatini.find(item => {
                const dati = Utils.validaDati(item);
                return eventoId.includes(dati.comune);
            });
            
            if (evento) {
                console.log('✅ Evento trovato nei dati grezzi, ma non nel calendario');
                // Crea un evento fittizio per mostrare i dettagli
                const fakeEvent = {
                    title: `${evento.comune || 'Evento'}`,
                    start: new Date().toISOString().split('T')[0],
                    extendedProps: Utils.validaDati(evento)
                };
                this.mostraDettagliEvento(fakeEvent);
            }
        }
    },
    
    // Mostra dettagli evento
    mostraDettagliEvento(evento) {
        const modal = new bootstrap.Modal(document.getElementById('eventModal'));
        const title = document.getElementById('eventModalTitle');
        const body = document.getElementById('eventModalBody');
        
        title.textContent = evento.title;
        
        // Ottieni il giorno della settimana
        const dataEvento = new Date(evento.start);
        const giornoSettimana = dataEvento.toLocaleDateString('it-IT', { weekday: 'long' });
        
        let html = `
            <div class="event-detail-row">
                <span class="event-detail-label">📅 Data:</span>
                <span class="event-detail-value">${Utils.formattaData(evento.start)} (${giornoSettimana})</span>
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
        
        const dataObj = new Date(data);
        const giornoSettimana = dataObj.toLocaleDateString('it-IT', { weekday: 'long' });
        title.textContent = `Eventi di ${giornoSettimana} ${Utils.formattaData(data)}`;
        
        const eventiGiorno = CalendarManager.getEvents().filter(evento => 
            evento.start.toISOString().split('T')[0] === data
        );
        
        if (eventiGiorno.length === 0) {
            body.innerHTML = '<p class="text-muted">Nessun evento per questo giorno</p>';
        } else {
            let html = '';
            eventiGiorno.forEach((evento, index) => {
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
                    <div class="event-item border rounded p-3 mb-3 ${index % 2 === 0 ? 'bg-light' : ''}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="event-title h6 mb-2">${evento.title}</div>
                                <div class="event-details">
                                    <small class="text-muted">${dettagli}</small>
                                </div>
                            </div>
                            <div class="btn-group-vertical ms-3" role="group">
                                <button class="btn btn-sm btn-outline-primary mb-1" onclick="EventManager.mostraDettagliEventoById('${evento.id}')">
                                    📋 Dettagli
                                </button>
                                <button class="btn btn-sm ${this.isPreferito(evento.id) ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="EventManager.togglePreferito('${evento.id}')">
                                    ${this.isPreferito(evento.id) ? '💔 Rimuovi' : '❤️ Aggiungi'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            // Aggiungi header con conteggio e rendi scrollabile
            const finalHtml = `
                <div class="alert alert-info mb-3">
                    <strong>${eventiGiorno.length}</strong> evento${eventiGiorno.length > 1 ? 'i' : ''} trovato${eventiGiorno.length > 1 ? 'i' : ''}
                </div>
                <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                    ${html}
                </div>
            `;
            body.innerHTML = finalHtml;
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
                            <button class="btn btn-sm btn-primary" onclick="EventManager.mostraDettagliEventoById('${evento.id}')">
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
function initApp() {
    console.log('📱 Tentativo di inizializzazione app...');
    
    // Verifica librerie esterne
    console.log('📦 Verifica librerie:', {
        FullCalendar: typeof FullCalendar !== 'undefined',
        bootstrap: typeof bootstrap !== 'undefined',
        Papa: typeof Papa !== 'undefined'
    });
    
    if (typeof FullCalendar === 'undefined') {
        console.error('❌ FullCalendar non caricato, riprovo tra 100ms...');
        setTimeout(initApp, 100);
        return;
    }
    
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap non caricato, riprovo tra 100ms...');
        setTimeout(initApp, 100);
        return;
    }
    
    if (typeof Papa === 'undefined') {
        console.error('❌ PapaParse non caricato, riprovo tra 100ms...');
        setTimeout(initApp, 100);
        return;
    }
    
    // Verifica che l'elemento calendario esista
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('❌ Elemento calendario non trovato, riprovo tra 100ms...');
        setTimeout(initApp, 100);
        return;
    }
    
    console.log('✅ Tutti i componenti esterni caricati!');
    console.log('🔍 Verifica moduli interni:', {
        CONFIG: typeof CONFIG !== 'undefined',
        Logger: typeof Logger !== 'undefined',
        Utils: typeof Utils !== 'undefined',
        CalendarManager: typeof CalendarManager !== 'undefined',
        DataLoader: typeof DataLoader !== 'undefined',
        App: typeof App !== 'undefined',
        FilterManager: typeof FilterManager !== 'undefined',
        EventManager: typeof EventManager !== 'undefined'
    });
    
    console.log('🚀 Avvio App.init()...');
    App.init();
    
    // Carica automaticamente i dati all'avvio
    console.log('📡 Caricamento automatico dati...');
    setTimeout(() => {
        App.caricaDati().catch(error => {
            console.error('❌ Errore caricamento automatico:', error);
        });
    }, 500);
}

// Avvia l'inizializzazione
console.log('🎬 Impostazione inizializzazione...');
console.log('📄 Document readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ DOM in caricamento, attendo DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ DOMContentLoaded ricevuto');
        setTimeout(initApp, 50); // Piccolo delay per assicurare che tutto sia pronto
    });
} else {
    console.log('✅ DOM già caricato, avvio immediato');
    setTimeout(initApp, 50);
}

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
