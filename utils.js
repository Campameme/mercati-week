// Utility per la gestione delle date e dati
const Utils = {
    // Genera date per mercatini ricorrenti
    generaDateMercatino(giorno, anno, mesi, dataInizio = null, dataFine = null) {
        if (!giorno) return null;
        
        Logger.debug(`Generazione date per mercatino: "${giorno}" - Data inizio: ${dataInizio}, Data fine: ${dataFine}`);
        
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
                    Logger.debug(`Data inizio specifica: ${dataInizioCalcolo.toISOString().split('T')[0]}`);
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
                    Logger.debug(`Data fine specifica: ${dataFineCalcolo.toISOString().split('T')[0]}`);
                }
            } catch (error) {
                Logger.warning(`Errore parsing data fine: ${dataFine}`);
            }
        }
        
        Logger.debug(`Periodo calcolo: da ${dataInizioCalcolo.toISOString().split('T')[0]} a ${dataFineCalcolo.toISOString().split('T')[0]}`);
        
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
        
        Logger.success(`Giorno settimana riconosciuto: ${giornoSettimana} (${['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'][giornoSettimana]})`);
        
        // Trova il primo giorno della settimana a partire dalla data inizio
        let data = new Date(dataInizioCalcolo);
        while (data.getDay() !== giornoSettimana) {
            data.setDate(data.getDate() + 1);
        }
        
        Logger.debug(`Prima data trovata: ${data.toISOString().split('T')[0]}`);
        
        // Genera date per il periodo specificato
        let contatoreDate = 0;
        while (data <= dataFineCalcolo) {
            if (data >= new Date()) {
                date.push(data.toISOString().split('T')[0]);
                contatoreDate++;
            }
            data.setDate(data.getDate() + 7);
        }
        
        Logger.success(`Date generate per ${giornoPulito}: ${date.length} date nel periodo ${dataInizioCalcolo.toISOString().split('T')[0]} - ${dataFineCalcolo.toISOString().split('T')[0]}`);
        if (date.length > 0) {
            Logger.debug(`Prime 5 date: ${date.slice(0, 5).join(', ')}`);
        }
        return date;
    },
    
    // Genera data per fiere
    generaDataFiera(dataInizio, anno) {
        if (!dataInizio) return null;
        
        Logger.debug(`Generazione data per: "${dataInizio}"`);
        
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
                        Logger.success(`Data generata DD/MM: ${data.toISOString().split('T')[0]}`);
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
                        Logger.success(`Data generata DD.MM.YYYY: ${data.toISOString().split('T')[0]}`);
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
                    Logger.success(`Data generata solo mese: ${data.toISOString().split('T')[0]}`);
                    return data.toISOString().split('T')[0];
                }
            }
        }
        
        Logger.warning(`Nessuna data valida generata per: "${dataPulita}"`);
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
