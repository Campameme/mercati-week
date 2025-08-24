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
                const eventi = date.map(dataSingola => ({
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
