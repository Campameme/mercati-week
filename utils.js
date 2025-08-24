// Configurazione dell'applicazione
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
