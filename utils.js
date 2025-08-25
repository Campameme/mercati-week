// Configurazione dell'applicazione
console.log('🚀 Caricamento utils.js...');

const CONFIG = {
    // Google Sheets URLs - Usa endpoint pubblico CSV
    GOOGLE_SHEETS_URL: 'https://docs.google.com/spreadsheets/d/1BCCgGLKYZOz3SdWZx199kbp1PV387N_qzM3oTuRVESU/export?format=csv&gid=0',
    
    // URL alternativo per fallback
    GOOGLE_SHEETS_FALLBACK: 'https://docs.google.com/spreadsheets/d/1BCCgGLKYZOz3SdWZx199kbp1PV387N_qzM3oTuRVESU/gviz/tq?tqx=out:csv&sheet=Foglio1',
    
    // Impostazioni calendario
    CALENDAR: {
        INITIAL_VIEW: 'dayGridMonth',
        LOCALE: 'it',
        HEIGHT: 'auto',
        MONTHS_TO_GENERATE: 3  // Ridotto a 3 mesi (precedente + corrente + successivo)
    },
    
    // Colori eventi
    COLORS: {
        MERCATINO: '#28a745',
        FIERA: '#ffc107',
        FIERA_TEXT: '#000'
    },
    
    // Logging - Abilitato temporaneamente per debug
    DEBUG: true,
    
    // Timeout e intervalli - OTTIMIZZATI
    TIMEOUTS: {
        LOADING: 15000,  // Ridotto da 30s a 15s
        RENDER_DELAY: 50 // Ridotto da 100ms a 50ms
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
    // Cache AGGRESSIVA con timestamp
    _dateCache: new Map(),
    _validationCache: new Map(),
    _cacheTimestamp: Date.now(),
    
    // Funzione per pulire la cache (solo se vecchia di più di 5 minuti)
    clearCache(force = false) {
        if (force || (Date.now() - this._cacheTimestamp) > 300000) { // 5 minuti
            this._dateCache.clear();
            this._validationCache.clear();
            this._cacheTimestamp = Date.now();
        }
    },
    // Nota: Funzioni di range specifico rimosse - ora usiamo logica semplificata
    
    // Genera date per mercatini ricorrenti - LOGICA INTELLIGENTE per tutti i tipi
    generaDateMercatino(dati, anno = new Date().getFullYear(), mesi = CONFIG.CALENDAR.MONTHS_TO_GENERATE) {
        const { dataInizio, dataFine, giornoRicorrente, comune } = dati;
        
        // Cache key per evitare ricalcoli
        const cacheKey = `${comune}_${giornoRicorrente}_${dataInizio}_${dataFine}_${anno}`;
        if (this._dateCache.has(cacheKey)) {
            return this._dateCache.get(cacheKey);
        }
        
        // Verifica che abbiamo il giorno ricorrente
        if (!giornoRicorrente) {
            Logger.debug('⚠️ Nessun giorno ricorrente specificato');
            return [];
        }
        
        const oggi = new Date();
        
        // Determina il periodo di validità - RANGE ESTESO per mese corrente + precedente + successivo
        let dataPartenza, dataLimite;
        
        if (dataInizio === 'ricorrente' && dataFine === 'ricorrente') {
            // Valido tutto l'anno - generiamo date dall'inizio dell'anno fino al prossimo anno
            Logger.debug('✅ Evento ricorrente tutto l\'anno');
            dataPartenza = new Date(oggi.getFullYear(), 0, 1); // Inizio anno corrente
            dataLimite = new Date(oggi.getFullYear() + 1, 11, 31); // Fine anno prossimo
        } else {
            // Valido solo per periodo specifico
            Logger.debug('📅 Evento con periodo limitato');
            
            if (dataInizio && dataInizio !== 'ricorrente') {
                try {
                    const [giornoI, meseI] = dataInizio.split('/').map(Number);
                    if (giornoI && meseI && !isNaN(giornoI) && !isNaN(meseI)) {
                        dataPartenza = new Date(anno, meseI - 1, giornoI);
                    } else {
                        Logger.warning(`⚠️ Data inizio non valida per ${comune}: ${dataInizio}`);
                        // RANGE ESTESO: 1 mese prima del mese corrente
                        dataPartenza = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1);
                    }
                } catch (error) {
                    Logger.warning(`⚠️ Errore parsing data inizio per ${comune}: ${dataInizio}`, error);
                    // RANGE ESTESO: 1 mese prima del mese corrente
                    dataPartenza = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1);
                }
            } else {
                // RANGE ESTESO: 1 mese prima del mese corrente
                dataPartenza = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1);
            }
            
            if (dataFine && dataFine !== 'ricorrente') {
                try {
                    const [giornoF, meseF] = dataFine.split('/').map(Number);
                    if (giornoF && meseF && !isNaN(giornoF) && !isNaN(meseF)) {
                        dataLimite = new Date(anno, meseF - 1, giornoF);
                    } else {
                        Logger.warning(`⚠️ Data fine non valida per ${comune}: ${dataFine}`);
                        // RANGE ESTESO: 1 mese dopo il mese corrente
                        dataLimite = new Date(oggi.getFullYear(), oggi.getMonth() + 2, 0);
                    }
                } catch (error) {
                    Logger.warning(`⚠️ Errore parsing data fine per ${comune}: ${dataFine}`, error);
                    // RANGE ESTESO: 1 mese dopo il mese corrente
                    dataLimite = new Date(oggi.getFullYear(), oggi.getMonth() + 2, 0);
                }
            } else {
                // RANGE ESTESO: 1 mese dopo il mese corrente
                dataLimite = new Date(oggi.getFullYear(), oggi.getMonth() + 2, 0);
            }
        }
        
        // Verifica che le date siano valide
        if (!dataPartenza || isNaN(dataPartenza.getTime())) {
            Logger.warning(`⚠️ Data partenza non valida per ${comune}, uso inizio anno`);
            dataPartenza = new Date(anno, 0, 1);
        }
        
        if (!dataLimite || isNaN(dataLimite.getTime())) {
            Logger.warning(`⚠️ Data limite non valida per ${comune}, uso fine anno`);
            dataLimite = new Date(anno, 11, 31);
        }
        
        Logger.debug(`📅 Periodo: da ${dataPartenza.toLocaleDateString()} a ${dataLimite.toLocaleDateString()}`);
        Logger.debug(`📅 Tipo ricorrenza: "${giornoRicorrente}" per ${comune}`);
        
        // CLASSIFICAZIONE INTELLIGENTE del tipo di ricorrenza
        const dateGenerate = this.classificaERisolveRicorrenza(giornoRicorrente, dataPartenza, dataLimite, comune);
        
        Logger.debug(`📊 Generate ${dateGenerate.length} date per ${comune}:`, 
            dateGenerate.length > 5 ? 
                [...dateGenerate.slice(0, 3).map(d => d.toLocaleDateString()), '...', ...dateGenerate.slice(-2).map(d => d.toLocaleDateString())] : 
                dateGenerate.map(d => d.toLocaleDateString())
        );
        
        // Fix timezone: usa formato locale invece di UTC
        const risultato = dateGenerate.map(d => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        });
        
        // Salva in cache per riuso
        this._dateCache.set(cacheKey, risultato);
        return risultato;
    },
    
    // FUNZIONE INTELLIGENTE che classifica e risolve TUTTI i tipi di ricorrenza
    classificaERisolveRicorrenza(giornoRicorrente, dataInizio, dataFine, comune) {
        const giorno = giornoRicorrente.toLowerCase().trim();
        Logger.debug(`🔍 Classificazione ricorrenza per ${comune}: "${giorno}"`);
        
        // CASO 1: GIORNI SETTIMANALI SEMPLICI (es: "Venerdì", "Mercoledì")
        const giorniSettimana = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
        const giornoSettimanale = giorniSettimana.findIndex(g => giorno === g);
        if (giornoSettimanale !== -1) {
            Logger.debug(`📅 SETTIMANALE: "${giorno}" → ogni ${giorno}`);
            return this.generaDateSettimanali(giornoSettimanale, dataInizio, dataFine);
        }
        
        // CASO 2: GIORNI MENSILI ORDINALI SINGOLI (es: "1^ Domenica", "2^ Sabato")
        const ordinaleSingoloMatch = giorno.match(/^(\d+)[°^]\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)$/);
        if (ordinaleSingoloMatch) {
            const ordinale = parseInt(ordinaleSingoloMatch[1]);
            const giornoDellaSettimana = giorniSettimana.indexOf(ordinaleSingoloMatch[2]);
            Logger.debug(`📅 MENSILE SINGOLO: ${ordinale}° ${ordinaleSingoloMatch[2]} di ogni mese`);
            return this.generaDateMensili(ordinale, giornoDellaSettimana, dataInizio, dataFine);
        }
        
        // CASO 3: GIORNI MENSILI ORDINALI MULTIPLI (es: "2^ e 4^ giovedì", "1^ e 3^ giovedì")
        const ordinaliMultipliMatch = giorno.match(/^(\d+)[°^]\s*e\s*(\d+)[°^]\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)$/);
        if (ordinaliMultipliMatch) {
            const ordinale1 = parseInt(ordinaliMultipliMatch[1]);
            const ordinale2 = parseInt(ordinaliMultipliMatch[2]);
            const giornoDellaSettimana = giorniSettimana.indexOf(ordinaliMultipliMatch[3]);
            Logger.debug(`📅 MENSILE MULTIPLO: ${ordinale1}° e ${ordinale2}° ${ordinaliMultipliMatch[3]} di ogni mese`);
            
            const date1 = this.generaDateMensili(ordinale1, giornoDellaSettimana, dataInizio, dataFine);
            const date2 = this.generaDateMensili(ordinale2, giornoDellaSettimana, dataInizio, dataFine);
            return [...date1, ...date2].sort((a, b) => new Date(a) - new Date(b));
        }
        
        // CASO 4: GIORNI MENSILI MISTI (es: "1^ Sabato e 1^ Domenica")
        const mistiMatch = giorno.match(/^(\d+)[°^]\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)\s*e\s*(\d+)[°^]\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)$/);
        if (mistiMatch) {
            const ordinale1 = parseInt(mistiMatch[1]);
            const giorno1 = giorniSettimana.indexOf(mistiMatch[2]);
            const ordinale2 = parseInt(mistiMatch[3]);
            const giorno2 = giorniSettimana.indexOf(mistiMatch[4]);
            
            Logger.debug(`📅 MENSILE MISTO: ${ordinale1}° ${mistiMatch[2]} e ${ordinale2}° ${mistiMatch[4]} di ogni mese`);
            
            const date1 = this.generaDateMensili(ordinale1, giorno1, dataInizio, dataFine);
            const date2 = this.generaDateMensili(ordinale2, giorno2, dataInizio, dataFine);
            return [...date1, ...date2].sort((a, b) => new Date(a) - new Date(b));
        }
        
        // CASO 5: PRIMA/ULTIMA (es: "prima domenica", "ultima domenica")
        const primaMatch = giorno.match(/^prima\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)$/);
        const ultimaMatch = giorno.match(/^ultima?\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)$/);
        
        if (primaMatch) {
            const giornoDellaSettimana = giorniSettimana.indexOf(primaMatch[1]);
            Logger.debug(`📅 MENSILE PRIMA: prima ${primaMatch[1]} di ogni mese`);
            return this.generaDateMensili(1, giornoDellaSettimana, dataInizio, dataFine);
        }
        
        if (ultimaMatch) {
            const giornoDellaSettimana = giorniSettimana.indexOf(ultimaMatch[1]);
            Logger.debug(`📅 MENSILE ULTIMA: ultima ${ultimaMatch[1]} di ogni mese`);
            return this.generaDateMensili(-1, giornoDellaSettimana, dataInizio, dataFine);
        }
        
        // CASO 6: TUTTE LE (es: "tutte le domeniche")
        const tutteMatch = giorno.match(/^tutte le\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)$/);
        if (tutteMatch) {
            const giornoDellaSettimana = giorniSettimana.indexOf(tutteMatch[1]);
            Logger.debug(`📅 SETTIMANALE TUTTE: tutte le ${tutteMatch[1]}`);
            return this.generaDateSettimanali(giornoDellaSettimana, dataInizio, dataFine);
        }
        
        // CASO 7: FORMATO NON RICONOSCIUTO
        Logger.warning(`⚠️ Formato ricorrenza non riconosciuto per ${comune}: "${giornoRicorrente}"`);
        return [];
    },
    
    // Funzione originale mantenuta per compatibilità
    parseGiornoRicorrente(giornoRicorrente, dataInizio, dataFine) {
        const giorno = giornoRicorrente.toLowerCase().trim();
        const date = [];
        
        // Giorni della settimana
        const giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
        
        // Caso 1: Giorno settimanale semplice (es: "mercoledì", "giovedì")
        const giornoSettimanale = giorni.findIndex(g => giorno.includes(g));
        if (giornoSettimanale !== -1 && !giorno.includes('°') && !giorno.includes('^') && !giorno.includes('prima') && !giorno.includes('ultima')) {
            console.log(`📅 Giorno settimanale rilevato: "${giorno}" → ${giorni[giornoSettimanale]} (indice ${giornoSettimanale})`);
            return this.generaDateSettimanali(giornoSettimanale, dataInizio, dataFine);
        }
        
        // Caso 2a: Giorni mensili ordinali multipli (es: "2^ e 4^ giovedì", "1^ e 3^ domenica")
        const ordinaliMultipliMatch = giorno.match(/(\d+)[°^]\s*e\s*(\d+)[°^]\s*(domenica|lunedì|martedì|mercoledì|giovedì|venerdì|sabato)/);
        if (ordinaliMultipliMatch) {
            const ordinale1 = parseInt(ordinaliMultipliMatch[1]);
            const ordinale2 = parseInt(ordinaliMultipliMatch[2]);
            const giornoSettimana = ordinaliMultipliMatch[3];
            const giornoIndice = giorni.indexOf(giornoSettimana);
            console.log(`📅 ${ordinale1}° e ${ordinale2}° ${giornoSettimana} del mese`);
            
            const date1 = this.generaDateMensili(ordinale1, giornoIndice, dataInizio, dataFine);
            const date2 = this.generaDateMensili(ordinale2, giornoIndice, dataInizio, dataFine);
            return [...date1, ...date2].sort((a, b) => new Date(a) - new Date(b));
        }

        // Caso 2b: Giorni mensili ordinali semplici (es: "2^ domenica del mese", "3^ sabato del mese")
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
    
    // Genera date settimanali (migliorato per coprire tutto l'anno)
    generaDateSettimanali(giornoSettimana, dataInizio, dataFine) {
        const date = [];
        
        // Usa il range specificato se disponibile, altrimenti RANGE ESTESO (mese precedente + corrente + successivo)
        const oggi = new Date();
        const dataPartenza = dataInizio || new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1);
        const dataFinale = dataFine || new Date(oggi.getFullYear(), oggi.getMonth() + 2, 0);
        
        Logger.debug(`📅 Generazione settimanale: ogni ${['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'][giornoSettimana]} da ${dataPartenza.toLocaleDateString()} a ${dataFinale.toLocaleDateString()}`);
        
        // Trova il primo giorno della settimana nel periodo
        let data = new Date(dataPartenza);
        while (data.getDay() !== giornoSettimana) {
            data.setDate(data.getDate() + 1);
        }
        
        // Aggiungi tutte le occorrenze settimanali per l'intero periodo
        while (data <= dataFinale) {
            // Include date passate nel range esteso (per mese corrente e precedente)
            if (data >= dataPartenza && data <= dataFinale) {
                date.push(new Date(data));
            }
            data.setDate(data.getDate() + 7);
        }
        
        Logger.debug(`📅 Date settimanali generate: ${date.length} per il periodo`);
        return date;
    },
    
    // Genera date mensili (1°, 2°, 3°, ultimo) - MIGLIORATA
    generaDateMensili(ordinale, giornoSettimana, dataInizio, dataFine) {
        const date = [];
        
        // Itera su ogni mese nel periodo
        let data = new Date(dataInizio.getFullYear(), dataInizio.getMonth(), 1);
        const fineData = new Date(dataFine.getFullYear(), dataFine.getMonth(), 1);
        
        Logger.debug(`📅 Generazione mensile: ${ordinale === -1 ? 'ultimo' : ordinale + '°'} ${['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'][giornoSettimana]}`);
        
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
            
            // Aggiungi solo se è nel range (include anche date passate per mese corrente e precedente)
            if (giornoTarget >= dataInizio && giornoTarget <= dataFine) {
                date.push(new Date(giornoTarget));
            }
            
            // Prossimo mese
            data.setMonth(data.getMonth() + 1);
        }
        
        Logger.debug(`📅 Date mensili generate: ${date.length} per il periodo`);
        return date;
    },
    
    // Genera date per mercatini con RANGE FORZATO di 3 mesi (precedente + corrente + successivo)
    generaDateMercatinoRangeEsteso(dati, annoCorrente, meseCorrente) {
        const { dataInizio, dataFine, giornoRicorrente, comune } = dati;
        
        // Cache key per evitare ricalcoli
        const cacheKey = `${comune}_${giornoRicorrente}_${dataInizio}_${dataFine}_range_esteso_${annoCorrente}_${meseCorrente}`;
        if (this._dateCache.has(cacheKey)) {
            return this._dateCache.get(cacheKey);
        }
        
        // Verifica che abbiamo il giorno ricorrente
        if (!giornoRicorrente) {
            Logger.debug('⚠️ Nessun giorno ricorrente specificato');
            return [];
        }
        
        // FORZA RANGE ESTESO: 3 mesi (precedente + corrente + successivo)
        const dataPartenza = new Date(annoCorrente, meseCorrente - 1, 1);  // 1 mese prima
        const dataLimite = new Date(annoCorrente, meseCorrente + 2, 0);     // 1 mese dopo
        
        Logger.debug(`📅 RANGE FORZATO per ${comune}: da ${dataPartenza.toLocaleDateString()} a ${dataLimite.toLocaleDateString()}`);
        Logger.debug(`📅 Tipo ricorrenza: "${giornoRicorrente}" per ${comune}`);
        
        // CLASSIFICAZIONE INTELLIGENTE del tipo di ricorrenza
        const dateGenerate = this.classificaERisolveRicorrenza(giornoRicorrente, dataPartenza, dataLimite, comune);
        
        Logger.debug(`📊 Generate ${dateGenerate.length} date per ${comune}:`, 
            dateGenerate.length > 5 ? 
                [...dateGenerate.slice(0, 3).map(d => d.toLocaleDateString()), '...', ...dateGenerate.slice(-2).map(d => d.toLocaleDateString())] : 
                dateGenerate.map(d => d.toLocaleDateString())
        );
        
        // Fix timezone: usa formato locale invece di UTC
        const risultato = dateGenerate.map(d => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        });
        
        // Salva in cache per riuso
        this._dateCache.set(cacheKey, risultato);
        return risultato;
    },
    
    // Genera data per fiere (con supporto per range di date)
    generaDataFiera(dataInizio, dataFine, anno) {
        if (!dataInizio) return null;
        
        // Pulisci i dati
        const dataInizioPulita = dataInizio.toString().trim().replace(/\r/g, '');
        const dataFinePulita = dataFine ? dataFine.toString().trim().replace(/\r/g, '') : null;
        
        const risultati = [];
        
        // Gestisci formato DD/MM
        if (dataInizioPulita.includes('/')) {
            const parti = dataInizioPulita.split('/');
            if (parti.length >= 2) {
                const [giorno, mese] = parti;
                if (!isNaN(giorno) && !isNaN(mese)) {
                    const dataStart = new Date(anno, parseInt(mese) - 1, parseInt(giorno));
                    
                    // Se c'è una data fine, genera tutte le date nel range
                    if (dataFinePulita && dataFinePulita.includes('/')) {
                        const partiFine = dataFinePulita.split('/');
                        if (partiFine.length >= 2) {
                            const [giornoFine, meseFine] = partiFine;
                            if (!isNaN(giornoFine) && !isNaN(meseFine)) {
                                const dataEnd = new Date(anno, parseInt(meseFine) - 1, parseInt(giornoFine));
                                
                                // Genera tutte le date nel range (include anche date passate)
                                let currentDate = new Date(dataStart);
                                while (currentDate <= dataEnd) {
                                    const year = currentDate.getFullYear();
                                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                                    const day = String(currentDate.getDate()).padStart(2, '0');
                                    risultati.push(`${year}-${month}-${day}`);
                                    currentDate.setDate(currentDate.getDate() + 1);
                                }
                                return risultati;
                            }
                        }
                    }
                    
                    // Singola data (include anche date passate)
                    const year = dataStart.getFullYear();
                    const month = String(dataStart.getMonth() + 1).padStart(2, '0');
                    const day = String(dataStart.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }
        }
        
        // Gestisci formato DD.MM.YYYY
        if (dataInizioPulita.includes('.')) {
            const parti = dataInizioPulita.split('.');
            if (parti.length >= 3) {
                const [giorno, mese, annoData] = parti;
                if (!isNaN(giorno) && !isNaN(mese)) {
                    const annoUsato = annoData && !isNaN(annoData) ? parseInt(annoData) : anno;
                    const data = new Date(annoUsato, parseInt(mese) - 1, parseInt(giorno));
                    const year = data.getFullYear();
                    const month = String(data.getMonth() + 1).padStart(2, '0');
                    const day = String(data.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }
        }
        
        // Gestisci formato solo mese
        const mesi = {
            'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
            'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
        };
        
        for (let [meseNome, meseNum] of Object.entries(mesi)) {
            if (dataInizioPulita.toLowerCase().includes(meseNome)) {
                const data = new Date(anno, meseNum, 1);
                return Utils.dateToLocalISOString(data);
            }
        }
        
        return null;
    },
    
    // Pulisci e valida i dati - OTTIMIZZATO con cache
    validaDati(item) {
        // Cache per validazione
        const itemKey = JSON.stringify(item);
        if (this._validationCache.has(itemKey)) {
            return this._validationCache.get(itemKey);
        }
        
        // Mappatura colonne per la nuova struttura
        const colonne = Object.keys(item);
        console.log('📋 Colonne disponibili:', colonne);
        
        // CASO SPECIALE: Colonne concatenate nel Google Sheet
        // Rileva se la prima colonna contiene tutti i comuni
        if (colonne.length <= 10 && colonne[0] && colonne[0].includes('Bajardo')) {
            console.log('🚨 Rilevate colonne concatenate, usando mapping per indice');
            
            // Mappiamo per posizione invece che per nome
            const valori = Object.values(item);
            
            const dati = {
                comune: valori[0] || null,      // Prima colonna = comune
                evento: valori[1] || null,      // Seconda colonna = evento
                tipologia: valori[2] || null,   // Terza colonna = tipologia
                luogo: valori[3] || null,       // Quarta colonna = luogo
                dataInizio: valori[4] || null,  // Quinta colonna = data inizio
                dataFine: valori[5] || null,    // Sesta colonna = data fine
                giornoRicorrente: valori[6] || null, // Settima colonna = giorno ricorrente
                orario: valori[7] || null,      // Ottava colonna = orario
                organizzatore: valori[8] || null, // Nona colonna = organizzatore
                
                // Manteniamo compatibilità
                giorno: valori[6] || null,      // Alias per giornoRicorrente
                mese: null,
                settori: null
            };
            
            // Salva in cache
            this._validationCache.set(itemKey, dati);
            return dati;
        }
        
        // CASO NORMALE: Colonne separate correttamente
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
        
        // Salva in cache
        this._validationCache.set(itemKey, dati);
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

    // Converte Date in formato YYYY-MM-DD senza problemi di timezone
    dateToLocalISOString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
    currentRange: null, // Range attuale della vista
    
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
            firstDay: 1, // Lunedì come primo giorno della settimana
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
            dayMaxEvents: 3, // Ridotto per evitare sovrapposizioni
            moreLinkClick: function(info) {
                // Previeni COMPLETAMENTE il popover/dropdown
                if (info.jsEvent) {
                    info.jsEvent.preventDefault();
                    info.jsEvent.stopImmediatePropagation();
                    info.jsEvent.stopPropagation();
                }
                
                // Rimuovi eventuali popover esistenti
                const popovers = document.querySelectorAll('.fc-popover');
                popovers.forEach(p => p.remove());
                
                const infoDate = info.date;
                const year = infoDate.getFullYear();
                const month = String(infoDate.getMonth() + 1).padStart(2, '0');
                const day = String(infoDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                // Apri immediatamente il modal personalizzato
                setTimeout(() => {
                    EventManager.mostraEventiGiorno(dateStr);
                }, 0);
                
                return 'prevent'; // Forza prevenzione del popover FullCalendar
            },
            moreLinkText: function(num) {
                return `+${num} eventi`;
            },
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
            },
            
            // CALLBACK per cambio vista/date (SEMPLIFICATO)
            datesSet: (info) => {
                Logger.info(`📅 Vista cambiata: ${info.view.type}`);
                this.currentRange = {
                    start: info.start,
                    end: info.end,
                    view: info.view.type
                };
                // Non ricaricare automaticamente - sarà gestito dal caricamento normale
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
    
    // Nota: loadEventsForCurrentRange rimossa - ora usiamo caricamento diretto e completo
    
    // Aggiunge un evento con controllo duplicati
    addEvent(evento) {
        if (this.calendar) {
            try {
                // Controlla se l'evento esiste già
                const eventiEsistenti = this.calendar.getEvents();
                const eventoDuplicato = eventiEsistenti.find(e => 
                    e.title === evento.title && 
                    e.startStr === evento.start
                );
                
                if (eventoDuplicato) {
                    Logger.debug(`⚠️ Evento duplicato ignorato: ${evento.title} ${evento.start}`);
                    return false;
                }
                
                this.calendar.addEvent(evento);
                return true;
            } catch (error) {
                Logger.error(`Errore aggiunta evento: ${error.message}`);
                return false;
            }
        }
        return false;
    },
    
    // Aggiunge più eventi con DEDUPLICAZIONE
    addEvents(eventi) {
        if (this.calendar && eventi.length > 0) {
            // DEDUPLICAZIONE: Rimuovi eventi duplicati
            const eventiUnici = [];
            const eventiVisti = new Set();
            
            eventi.forEach(evento => {
                // Crea una chiave unica basata su titolo + data
                const chiaveUnica = `${evento.title}_${evento.start}`;
                if (!eventiVisti.has(chiaveUnica)) {
                    eventiVisti.add(chiaveUnica);
                    eventiUnici.push(evento);
                }
            });
            
            Logger.info(`🔄 Deduplicazione: ${eventi.length} → ${eventiUnici.length} eventi unici`);
            
            let successi = 0;
            eventiUnici.forEach(evento => {
                if (this.addEvent(evento)) {
                    successi++;
                }
            });
            Logger.success(`${successi}/${eventiUnici.length} eventi aggiunti con successo`);
            
            // Render immediato per performance
            this.calendar.render();
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
    
    // Funzione JSONP per bypassare CORS
    async caricaDatiConJSONP() {
        return new Promise((resolve, reject) => {
            // URL per JSONP
            const jsonpUrl = 'https://docs.google.com/spreadsheets/d/1BCCgGLKYZOz3SdWZx199kbp1PV387N_qzM3oTuRVESU/gviz/tq?tqx=out:json&sheet=Foglio1';
            
            const script = document.createElement('script');
            const callbackName = 'jsonpCallback_' + Date.now();
            
            // Crea callback globale
            window[callbackName] = function(data) {
                // Pulisci
                document.head.removeChild(script);
                delete window[callbackName];
                
                try {
                    // Estrai i dati dalla risposta Google
                    const rows = data.table.rows;
                    const cols = data.table.cols;
                    
                    // Converti in formato CSV-like
                    const csvData = [];
                    
                    // Header
                    const header = cols.map(col => col.label || col.id);
                    csvData.push(header);
                    
                    // Righe dati
                    rows.forEach(row => {
                        const rowData = row.c.map(cell => {
                            if (!cell || cell.v === null || cell.v === undefined) return '';
                            return String(cell.v);
                        });
                        csvData.push(rowData);
                    });
                    
                    Logger.success(`✅ Dati caricati via JSONP: ${csvData.length} righe`);
                    resolve(csvData);
                    
                } catch (error) {
                    Logger.error('Errore parsing JSONP:', error);
                    reject(error);
                }
            };
            
            // Gestisci errore
            script.onerror = function() {
                document.head.removeChild(script);
                delete window[callbackName];
                reject(new Error('Errore caricamento JSONP'));
            };
            
            // Aggiungi script
            script.src = jsonpUrl + '&tqx=out:json;responseHandler:' + callbackName;
            document.head.appendChild(script);
        });
    },
    
    // Carica tutti i dati
    async caricaDati() {
        Logger.info('🚀 Avvio caricamento dati...');
        
        try {
            // Usa il nuovo metodo semplificato
            await this.caricaMercatiniSemplice();
            
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
    
    // Metodo semplificato per caricare dati (funziona su localhost e Netlify)
    async caricaMercatiniSemplice() {
        Logger.info('Caricamento eventi da Google Sheet (metodo semplificato)...');
        
        const urls = [CONFIG.GOOGLE_SHEETS_URL, CONFIG.GOOGLE_SHEETS_FALLBACK];
        

        
        for (const url of urls) {
            try {
                // Aggiungi timestamp per forzare bypass cache
                const urlWithTimestamp = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
                Logger.info(`📡 Tentativo con URL: ${urlWithTimestamp}`);
                
                // TIMEOUT ULTRA-CORTO
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondi MAX
                
                const response = await fetch(urlWithTimestamp, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal,
                    headers: {
                        'Accept': 'text/csv'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.text();
                Logger.info(`📊 Dati ricevuti: ${data.length} caratteri`);
                
                if (data.length < 50) {
                    throw new Error('Dati troppo piccoli, probabilmente errore');
                }
                
                // Parse con PapaParse
                return new Promise((resolve, reject) => {
                    Papa.parse(data, {
                        header: true,
                        delimiter: ',',
                        skipEmptyLines: true,
                        complete: (results) => {
                            Logger.success(`✅ Parsing completato: ${results.data.length} righe`);
                            this.processResults(results);
                            resolve();
                        },
                        error: (error) => {
                            Logger.error('Errore parsing CSV:', error);
                            reject(error);
                        }
                    });
                });
                
            } catch (error) {
                Logger.info(`⚠️ Fallito con ${url}: ${error.message}`);
                if (url === urls[urls.length - 1]) {
                    // È l'ultimo URL, rilancia l'errore
                    throw new Error(`Impossibile caricare dati da Google Sheets: ${error.message}`);
                }
                // Altrimenti continua con il prossimo URL
            }
        }
    },
    
    // Carica dati usando JSONP (evita problemi CORS)
    async caricaMercatiniConJSONP() {
        Logger.info('Caricamento eventi da Google Sheet via JSONP...');
        
        try {
            const csvData = await this.caricaDatiConJSONP();
            
            // Simula il formato Papa Parse
            const results = {
                data: []
            };
            
            // Converte da array a oggetti con header come chiavi
            if (csvData.length > 1) {
                const headers = csvData[0];
                for (let i = 1; i < csvData.length; i++) {
                    const row = csvData[i];
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    results.data.push(obj);
                }
            }
            
            Logger.success(`✅ Parsing eventi completato via JSONP: ${results.data.length} righe`);
            this.processResults(results);
            
        } catch (error) {
            Logger.error(`Errore caricamento mercatini via JSONP: ${error.message}`);
            throw error;
        }
    },
    
    // Carica tutti gli eventi da Google Sheets (mercatini e fiere)
    async caricaMercatini() {
        Logger.info('Caricamento eventi da Google Sheet...');
        
        try {
            // Prova prima con export URL semplice
            let urlConCache = CONFIG.GOOGLE_SHEETS_URL;
            
            Logger.info(`📡 Richiesta dati: ${urlConCache}`);
            
            let response;
            try {
                response = await fetch(urlConCache, {
                    method: 'GET',
                    mode: 'cors'
                });
            } catch (corsError) {
                Logger.info('❌ Errore CORS con export URL, provo con gviz/tq...');
                // Fallback al vecchio URL
                urlConCache = 'https://docs.google.com/spreadsheets/d/1BCCgGLKYZOz3SdWZx199kbp1PV387N_qzM3oTuRVESU/gviz/tq?tqx=out:csv&sheet=Foglio1';
                response = await fetch(urlConCache, {
                    method: 'GET',
                    mode: 'no-cors'
                });
            }
            
            if (!response.ok && response.status !== 0) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.text();
            const timeReceived = new Date().toLocaleTimeString();
            Logger.info(`📊 Dati eventi ricevuti alle ${timeReceived}: ${data.length} caratteri`);
            
            // Mostra hash dei primi caratteri per verificare che i dati siano diversi
            const dataHash = data.substring(0, 200);
            console.log(`🔍 Hash dati (primi 200 char): ${dataHash}`);
            
            // Debug dettagliato per capire se i dati sono aggiornati
            console.log(`🕒 Timestamp richiesta: ${timestamp}`);
            console.log(`📡 URL finale: ${urlConCache}`);
            console.log(`📊 Lunghezza dati: ${data.length} caratteri`);
            console.log(`🔢 Response headers:`, Object.fromEntries(response.headers.entries()));
            
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
                        resolve();
                    },
                    error: (error) => {
                        Logger.error('Errore parsing CSV:', error);
                        reject(error);
                    }
                });
            });
            
        } catch (error) {
            Logger.error(`Errore caricamento mercatini: ${error.message}`);
            throw error;
        }
    },
    
    // Processa i risultati del parsing (CARICAMENTO PROGRESSIVO)
    processResults(results) {
        // Filtra e processa TUTTI gli eventi
        this.mercatini = results.data.filter((item, index) => {
            const dati = Utils.validaDati(item);
            
            // Verifica che abbia almeno comune e qualche informazione temporale
            const hasRequiredFields = dati.comune && 
                (dati.tipologia || dati.giornoRicorrente || dati.dataInizio || dati.dataFine);
            
            return hasRequiredFields;
        });
        
        Logger.success(`Eventi validi: ${this.mercatini.length}`);
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
    
    // Aggiorna calendario con TUTTI gli eventi (SEMPLIFICATO E OTTIMIZZATO)
    aggiornaCalendario() {
        Logger.info('🛒 Aggiornamento calendario con tutti gli eventi...');
        
        // Rimuovi eventi esistenti
        CalendarManager.clearEvents();
        
        // Pulisci cache solo se necessario
        Utils.clearCache(false);
        
        const oggi = new Date();
        const anno = oggi.getFullYear();
        
        // CARICAMENTO DIRETTO: Genera TUTTI gli eventi necessari in una volta
        const tuttijEventi = [];
        let eventiAggiunti = 0;
        
        // Processa TUTTI i mercatini con range esteso (6 mesi avanti)
        this.mercatini.forEach((mercatino) => {
            this.processaSingoloEventoEsteso(mercatino, tuttijEventi, anno);
        });
        
        // BATCH ADD: Aggiungi tutti gli eventi in una volta
        if (tuttijEventi.length > 0) {
            CalendarManager.addEvents(tuttijEventi);
            eventiAggiunti = tuttijEventi.length;
        }
        
        Logger.success(`✅ ${eventiAggiunti} eventi caricati! Database: ${this.mercatini.length} mercatini`);
    },
    
    // Processa un singolo evento con range ESTESO (SENZA DUPLICATI)
    processaSingoloEventoEsteso(mercatino, eventiArray, anno) {
        const dati = Utils.validaDati(mercatino);
        
        // Debug per eventi problematici
        if (dati.comune && dati.comune.toLowerCase().includes('camporosso')) {
            Logger.info(`🔍 Camporosso: "${dati.evento || 'Mercatino'}" | Date: ${dati.dataInizio || 'vuote'} | Ricorrenza: "${dati.giornoRicorrente || 'nessuna'}"`);
        }
        
        let date = null;
        
        // PRIORITÀ: Se ha date specifiche, USA SEMPRE quelle (anche se ha giorno ricorrente)
        if (dati.dataInizio) {
            date = Utils.generaDataFiera(dati.dataInizio, dati.dataFine, anno);
            if (date && !Array.isArray(date)) {
                date = [date];
            }
            
            // Se ha ANCHE un giorno ricorrente e le date sono un range, filtra solo per quel giorno
            if (date && date.length > 1 && dati.giornoRicorrente && dati.giornoRicorrente.toLowerCase() !== 'ricorrente') {
                const giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
                const giornoSettimana = giorni.indexOf(dati.giornoRicorrente.toLowerCase().trim());
                
                if (giornoSettimana !== -1) {
                    // Filtra solo le date che cadono nel giorno specificato
                    date = date.filter(d => {
                        const dataEvento = new Date(d);
                        return dataEvento.getDay() === giornoSettimana;
                    });
                }
            }
        }
        // SOLO se NON ha date specifiche, analizza il tipo di ricorrenza
        else if (dati.giornoRicorrente && dati.giornoRicorrente.toLowerCase() !== 'ricorrente') {
            // FORZA RANGE ESTESO: 3 mesi (precedente + corrente + successivo)
            const oggi = new Date();
            const annoCorrente = oggi.getFullYear();
            const meseCorrente = oggi.getMonth();
            
            // Genera date per il range esteso
            date = Utils.generaDateMercatinoRangeEsteso(dati, annoCorrente, meseCorrente);
        }
        // CASO SPECIALE: Eventi "ricorrenti" generici
        else if (dati.giornoRicorrente && dati.giornoRicorrente.toLowerCase() === 'ricorrente' && dati.dataInizio) {
            date = Utils.generaDataFiera(dati.dataInizio, dati.dataFine, anno);
            if (date && !Array.isArray(date)) {
                date = [date];
            }
        }
        
        // Debug per vedere le date generate
        if (dati.comune && dati.comune.toLowerCase().includes('camporosso')) {
            Logger.info(`📅 Camporosso "${dati.evento || 'Mercatino'}" → ${date ? date.length : 0} date generate`);
            if (date && date.length > 0) {
                Logger.info(`📋 Prime 3 date: ${date.slice(0, 3).join(', ')}`);
            }
        }
        
        // Genera eventi FullCalendar
        if (date && date.length > 0) {
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
            
            eventiArray.push(...eventi);
        }
    },
    
    // Nota: processaSingoloEventoPerRange rimossa - ora usiamo processaSingoloEventoEsteso
    
    // Processa un singolo evento (funzione originale mantenuta per compatibilità)
    processaSingoloEvento(mercatino, eventiArray, anno) {
            const dati = Utils.validaDati(mercatino);
            
            let date = null;
            
            // Usa la nuova logica basata su giornoRicorrente
            if (dati.giornoRicorrente) {
                date = Utils.generaDateMercatino(dati, anno, CONFIG.CALENDAR.MONTHS_TO_GENERATE);
            }
            
            // Se non funziona, prova con Data inizio/fine per fiere
            if (!date && dati.dataInizio) {
                date = Utils.generaDataFiera(dati.dataInizio, dati.dataFine, anno);
                if (date && !Array.isArray(date)) {
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
                
                // Aggiungi al singolo array passato
                eventiArray.push(...eventi);
            }
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
        
        // Pulisci cache solo se necessario (non sempre)
        Utils.clearCache(false); // Non forzare, solo se vecchia
        
        console.log('🧹 Cache controllata');
        
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
                    start: (() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const day = String(now.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    })(),
                    extendedProps: Utils.validaDati(evento)
                };
                this.mostraDettagliEvento(fakeEvent);
            }
        }
    },
    
    // Mostra dettagli evento
    mostraDettagliEvento(evento) {
        const modal = new bootstrap.Modal(document.getElementById('eventModal'), {
            backdrop: true,
            keyboard: true
        });
        const title = document.getElementById('eventModalTitle');
        const body = document.getElementById('eventModalBody');
        
        // Assicura che questo modal sia sopra agli altri
        const modalEl = document.getElementById('eventModal');
        modalEl.style.zIndex = '2060'; // Più alto del modal giornaliero (1055)
        
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
        const modal = new bootstrap.Modal(document.getElementById('dailyModal'), {
            backdrop: true,
            keyboard: true
        });
        const title = document.getElementById('dailyModalTitle');
        const body = document.getElementById('dailyModalBody');
        
        const dataObj = new Date(data);
        const giornoSettimana = dataObj.toLocaleDateString('it-IT', { weekday: 'long' });
        title.textContent = `Eventi di ${giornoSettimana} ${Utils.formattaData(data)}`;
        
        // Otteniamo gli eventi dal calendario FullCalendar
        const eventiCalendario = CalendarManager.calendar ? CalendarManager.calendar.getEvents() : [];
        const eventiGiorno = eventiCalendario.filter(evento => {
            const eventoStart = evento.start;
            const year = eventoStart.getFullYear();
            const month = String(eventoStart.getMonth() + 1).padStart(2, '0');
            const day = String(eventoStart.getDate()).padStart(2, '0');
            const eventoData = `${year}-${month}-${day}`;
            return eventoData === data;
        });
        
        console.log(`🔍 DEBUG mostraEventiGiorno:`, {
            data,
            eventiCalendarioTotali: eventiCalendario.length,
            eventiGiornoFiltrati: eventiGiorno.length,
            eventiGiorno: eventiGiorno.map(e => ({ title: e.title, start: e.start.toISOString() }))
        });
        
        if (eventiGiorno.length === 0) {
            body.innerHTML = '<p class="text-muted">Nessun evento per questo giorno</p>';
        } else {
            // Aggiungiamo header con conteggio eventi
            let html = `
                <div class="alert alert-info mb-3">
                    <strong>📊 Trovati ${eventiGiorno.length} eventi per questo giorno</strong>
                </div>
                <div class="events-container" style="max-height: 400px; overflow-y: auto;">
            `;
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
            
            // Chiudi il container scrollabile
            html += '</div>';
            body.innerHTML = html;
        }
        
        modal.show();
    },
    
    // Aggiorna eventi vicini
    aggiornaEventiVicini() {
        const container = document.getElementById('eventiVicini');
        const eventi = CalendarManager.getEvents().slice(0, 5); // Include tutti gli eventi (anche passati)
        
        if (eventi.length === 0) {
            container.innerHTML = '<p class="text-muted">Nessun evento trovato</p>';
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

