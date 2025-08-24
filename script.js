document.addEventListener('DOMContentLoaded', function() {
    // Variabili globali
    let mercatini = [];
    let fiere = [];
    let calendar;
    let comuni = new Set();
    let categorie = new Set();
    let preferiti = new Set();
    
    // Carica i preferiti dal localStorage
    function caricaPreferiti() {
        const preferitiSalvati = localStorage.getItem('mercatiniPreferiti');
        if (preferitiSalvati) {
            preferiti = new Set(JSON.parse(preferitiSalvati));
        }
    }
    
    // Salva i preferiti nel localStorage
    function salvaPreferiti() {
        localStorage.setItem('mercatiniPreferiti', JSON.stringify(Array.from(preferiti)));
    }
    
    // Aggiungi/rimuovi dai preferiti
    function togglePreferito(mercatinoId) {
        if (preferiti.has(mercatinoId)) {
            preferiti.delete(mercatinoId);
        } else {
            preferiti.add(mercatinoId);
        }
        salvaPreferiti();
        aggiornaListaPreferiti();
    }
    
    // Verifica se un mercatino è nei preferiti
    function isPreferito(mercatinoId) {
        return preferiti.has(mercatinoId);
    }
    
    // Inizializzazione del calendario
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        events: [],
        eventClick: function(info) {
            mostraDettagliEvento(info.event);
        },
        dateClick: function(info) {
            mostraEventiGiorno(info.dateStr);
        }
    });
    
    calendar.render();
    
    // Carica i preferiti e inizializza
    caricaPreferiti();
    
    // Carica i dati da Google Sheets con priorità alta
    console.log('Avvio caricamento dati da Google Sheets con priorità alta...');
    
    // Carica prima i mercatini (più importanti per la navigazione)
    Promise.all([
        caricaDatiMercatiniGoogleSheets(),
        caricaDatiFiereGoogleSheets()
    ]).then(() => {
        console.log('Tutti i dati caricati, inizializzazione completata');
        // Aggiorna il calendario e i filtri
        aggiornaComuniFiltro();
        aggiornaCategorieFiltro();
        generaEventiCalendario();
        aggiornaListaProssimiEventi();
        aggiornaListaPreferiti();
        // Nascondi lo spinner iniziale
        nascondiSpinnerCaricamento();
    }).catch(error => {
        console.error('Errore nel caricamento dei dati:', error);
        nascondiSpinnerCaricamento();
    });
    
    // Event listeners per i filtri
    document.getElementById('tipoEvento').addEventListener('change', applicaFiltri);
    document.getElementById('comune').addEventListener('change', applicaFiltri);
    document.getElementById('categoriaFilter').addEventListener('change', applicaFiltri);
    
    // Event listener per ricaricare i dati
    document.getElementById('ricaricaDati').addEventListener('click', ricaricaDatiGoogleSheets);
    
    // Event listeners per lo stato online
    window.addEventListener('online', aggiornaStatoOnline);
    window.addEventListener('offline', aggiornaStatoOnline);
    
    // Inizializza lo stato online
    aggiornaStatoOnline();
    
    // Funzione per caricare i dati dei mercatini da Google Sheets
    function caricaDatiMercatiniGoogleSheets() {
        return new Promise((resolve, reject) => {
            console.log('Caricamento dati mercatini da Google Sheets...');
            
            // ID del foglio Google Sheets per i mercatini
            const SHEET_ID = '1dGB3f47TrT_dVz5PsICci4JuoTWRBQAcPuXjDIYSE58';
            const SHEET_NAME = 'Foglio1'; // Nome del foglio (di solito è Foglio1)
            
            // URL per ottenere i dati in formato CSV
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
            
            fetch(url, { 
                priority: 'high',
                cache: 'no-cache'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                console.log('Dati mercatini da Google Sheets caricati, lunghezza:', data.length);
                console.log('Primi 200 caratteri:', data.substring(0, 200));
                
                // Parsing del CSV da Google Sheets
                Papa.parse(data, {
                    header: true,
                    delimiter: ';', // I mercatini usano il punto e virgola
                    skipEmptyLines: true,
                    complete: function(results) {
                        console.log('Parsing mercatini Google Sheets completato, righe trovate:', results.data.length);
                        console.log('Prima riga:', results.data[0]);
                        
                        // Pulisci i dati rimuovendo righe vuote e caratteri problematici
                        mercatini = results.data.filter(item => {
                            return item.Comune && 
                                   item.Comune.trim() !== '' && 
                                   Object.keys(item).some(key => item[key] && item[key].trim() !== '');
                        }).map(item => {
                            // Pulisci ogni campo rimuovendo caratteri problematici
                            const cleanedItem = {};
                            Object.keys(item).forEach(key => {
                                if (item[key]) {
                                    cleanedItem[key] = item[key].trim().replace(/\r/g, '');
                                } else {
                                    cleanedItem[key] = '';
                                }
                            });
                            return cleanedItem;
                        });
                        
                        // Estrai comuni e categorie
                        mercatini.forEach(mercatino => {
                            if (mercatino.Comune) comuni.add(mercatino.Comune.trim());
                            if (mercatino["Settori merceologici"]) {
                                const settori = mercatino["Settori merceologici"].split('/');
                                settori.forEach(settore => {
                                    const settorePulito = settore.trim();
                                    if (settorePulito) categorie.add(settorePulito);
                                });
                            }
                        });
                        
                        console.log('Comuni trovati:', Array.from(comuni));
                        console.log('Categorie trovate:', Array.from(categorie));
                        
                        resolve();
                    },
                    error: function(error) {
                        console.error('Errore nel parsing Google Sheets mercatini:', error);
                        reject(error);
                    }
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei dati dei mercatini da Google Sheets:', error);
                reject(error);
            });
        });
    }
    
    // Funzione per caricare i dati delle fiere da Google Sheets
    function caricaDatiFiereGoogleSheets() {
        return new Promise((resolve, reject) => {
            console.log('Caricamento dati fiere da Google Sheets...');
            
            // ID del foglio Google Sheets per le fiere
            const SHEET_ID = '1oa6pz7U79YyD8hey2lANS-x6nMCHnaKBC2LtEIsMyTQ';
            const SHEET_NAME = 'Foglio1'; // Nome del foglio (di solito è Foglio1)
            
            // URL per ottenere i dati in formato CSV
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
            
            fetch(url, { 
                priority: 'high',
                cache: 'no-cache'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                console.log('Dati fiere da Google Sheets caricati, lunghezza:', data.length);
                console.log('Primi 200 caratteri:', data.substring(0, 200));
                
                // Parsing del CSV da Google Sheets
                Papa.parse(data, {
                    header: true,
                    delimiter: ';', // Le fiere usano il punto e virgola
                    skipEmptyLines: true,
                    complete: function(results) {
                        console.log('Parsing fiere Google Sheets completato, righe trovate:', results.data.length);
                        console.log('Prima riga:', results.data[0]);
                        
                        // Pulisci i dati rimuovendo righe vuote e caratteri problematici
                        fiere = results.data.filter(item => {
                            return item.Comune && 
                                   item.Comune.trim() !== '' && 
                                   Object.keys(item).some(key => item[key] && item[key].trim() !== '');
                        }).map(item => {
                            // Pulisci ogni campo rimuovendo caratteri problematici
                            const cleanedItem = {};
                            Object.keys(item).forEach(key => {
                                if (item[key]) {
                                    cleanedItem[key] = item[key].trim().replace(/\r/g, '');
                                } else {
                                    cleanedItem[key] = '';
                                }
                            });
                            return cleanedItem;
                        });
                        
                        // Estrai comuni e categorie
                        fiere.forEach(fiera => {
                            if (fiera.Comune) comuni.add(fiera.Comune.trim());
                            if (fiera["Settori merceologici"]) {
                                const settori = fiera["Settori merceologici"].split('/');
                                settori.forEach(settore => {
                                    const settorePulito = settore.trim();
                                    if (settorePulito) categorie.add(settorePulito);
                                });
                            }
                        });
                        
                        console.log('Comuni trovati:', Array.from(comuni));
                        console.log('Categorie trovate:', Array.from(categorie));
                        
                        resolve();
                    },
                    error: function(error) {
                        console.error('Errore nel parsing Google Sheets fiere:', error);
                        reject(error);
                    }
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei dati delle fiere da Google Sheets:', error);
                reject(error);
            });
        });
    }
    
    // Funzione per aggiornare le opzioni del filtro comuni
    function aggiornaComuniFiltro() {
        const comuneSelect = document.getElementById('comune');
        comuneSelect.innerHTML = '<option value="tutti">Tutti i comuni</option>';
        
        // Ordina i comuni alfabeticamente
        const comuniOrdinati = Array.from(comuni).sort();
        
        comuniOrdinati.forEach(comune => {
            const option = document.createElement('option');
            option.value = comune;
            option.textContent = comune;
            comuneSelect.appendChild(option);
        });
    }
    
    // Funzione per aggiornare le opzioni del filtro categorie
    function aggiornaCategorieFiltro() {
        const categoriaSelect = document.getElementById('categoriaFilter');
        categoriaSelect.innerHTML = '<option value="tutti">Tutte le categorie</option>';
        
        // Ordina le categorie alfabeticamente
        const categorieOrdinate = Array.from(categorie).sort();
        
        categorieOrdinate.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaSelect.appendChild(option);
        });
    }
    
    // Funzione per generare gli eventi del calendario
    function generaEventiCalendario() {
        // Rimuovi tutti gli eventi esistenti
        calendar.removeAllEvents();
        
        // Filtra gli eventi in base alle selezioni
        const tipoEvento = document.getElementById('tipoEvento').value;
        const comuneSelezionato = document.getElementById('comune').value;
        const categoriaSelezionata = document.getElementById('categoriaFilter').value;
        
        // Aggiungi i mercatini
        if (tipoEvento === 'tutti' || tipoEvento === 'mercatini') {
            aggiungiMercatiniAlCalendario(comuneSelezionato, categoriaSelezionata);
        }
        
        // Aggiungi le fiere
        if (tipoEvento === 'tutti' || tipoEvento === 'fiere') {
            aggiungiFiereAlCalendario(comuneSelezionato, categoriaSelezionata);
        }
    }
    
    // Funzione per aggiungere i mercatini al calendario
    function aggiungiMercatiniAlCalendario(comuneSelezionato, categoriaSelezionata) {
        mercatini.forEach(mercatino => {
            // Applica i filtri
            if (comuneSelezionato !== 'tutti' && mercatino.Comune !== comuneSelezionato) return;
            if (categoriaSelezionata !== 'tutti' && !mercatino["Settori merceologici"]?.includes(categoriaSelezionata)) return;
            
            // Crea eventi in base al giorno della settimana o alla cadenza
            const eventi = creaDataMercatino(mercatino);
            
            // Aggiungi ogni evento al calendario
            eventi.forEach(data => {
                calendar.addEvent({
                    title: `Mercatino a ${mercatino.Comune}`,
                    start: data,
                    allDay: true,
                    extendedProps: {
                        tipo: 'mercatino',
                        dettagli: mercatino
                    },
                    className: 'evento-mercatino'
                });
            });
        });
    }
    
    // Funzione per aggiungere le fiere al calendario
    function aggiungiFiereAlCalendario(comuneSelezionato, categoriaSelezionata) {
        fiere.forEach(fiera => {
            // Applica i filtri
            if (comuneSelezionato !== 'tutti' && fiera.Comune !== comuneSelezionato) return;
            if (categoriaSelezionata !== 'tutti' && !fiera["Settori merceologici"]?.includes(categoriaSelezionata)) return;
            
            // Crea eventi in base alle date di inizio e fine
            const eventi = creaDataFiera(fiera);
            
            // Aggiungi ogni evento al calendario
            eventi.forEach(intervallo => {
                calendar.addEvent({
                    title: fiera.Denominazione || `Fiera a ${fiera.Comune}`,
                    start: intervallo.start,
                    end: intervallo.end,
                    allDay: true,
                    extendedProps: {
                        tipo: 'fiera',
                        dettagli: fiera
                    },
                    className: 'evento-fiera'
                });
            });
        });
    }
    
        // Funzione per creare le date dei mercatini
    function creaDataMercatino(mercatino) {
        const oggi = new Date();
        const eventi = [];
        const annoCorrente = oggi.getFullYear();
        
        // Gestisci diversi formati di giorno
        if (mercatino.Giorno) {
            const giorno = mercatino.Giorno.toLowerCase();
            
            // Gestisci giorni settimanali specifici
            if (giorno.includes('lunedì')) {
                eventi.push(...trovaGiorniSettimanali(annoCorrente, 1)); // 1 = lunedì
            } else if (giorno.includes('martedì')) {
                eventi.push(...trovaGiorniSettimanali(annoCorrente, 2)); // 2 = martedì
            } else if (giorno.includes('mercoledì')) {
                eventi.push(...trovaGiorniSettimanali(annoCorrente, 3)); // 3 = mercoledì
            } else if (giorno.includes('giovedì')) {
                eventi.push(...trovaGiorniSettimanali(annoCorrente, 4)); // 4 = giovedì
            } else if (giorno.includes('venerdì')) {
                eventi.push(...trovaGiorniSettimanali(annoCorrente, 5)); // 5 = venerdì
            } else if (giorno.includes('sabato')) {
                eventi.push(...trovaGiorniSettimanali(annoCorrente, 6)); // 6 = sabato
            } else if (giorno.includes('domenica')) {
                // Gestisci formati tipo "1^ domenica del mese"
                if (mercatino.Giorno.includes("1^") || mercatino.Giorno.includes("1°")) {
                    eventi.push(...trovaGiorniSpecificiDelMese(annoCorrente, 0, 1)); // 0 = domenica, 1 = prima
                } else if (mercatino.Giorno.includes("2^") || mercatino.Giorno.includes("2°")) {
                    eventi.push(...trovaGiorniSpecificiDelMese(annoCorrente, 0, 2)); // 0 = domenica, 2 = seconda
                } else if (mercatino.Giorno.includes("3^") || mercatino.Giorno.includes("3°")) {
                    eventi.push(...trovaGiorniSpecificiDelMese(annoCorrente, 0, 3)); // 0 = domenica, 3 = terza
                            } else if (mercatino.Giorno.includes("4^") || mercatino.Giorno.includes("4°")) {
                eventi.push(...trovaGiorniSpecificiDelMese(annoCorrente, 0, 4)); // 0 = domenica, 4 = quarta
            } else if (mercatino.Giorno.toLowerCase().includes("ultima")) {
                eventi.push(...trovaUltimoGiornoDelMese(annoCorrente, 0)); // 0 = domenica
            } else if (mercatino.Giorno.includes("1°") && mercatino.Giorno.includes("domenica")) {
                // Gestisci "1° sabato e domenica del mese"
                eventi.push(...trovaGiorniSpecificiDelMese(annoCorrente, 6, 1)); // 6 = sabato, 1 = primo
                eventi.push(...trovaGiorniSpecificiDelMese(annoCorrente, 0, 1)); // 0 = domenica, 1 = prima
            } else if (mercatino.Giorno.toLowerCase().includes("tutte le prime")) {
                // Gestisci "tutte le prime domeniche di ogni mese"
                eventi.push(...trovaGiorniSpecificiDelMese(annoCorrente, 0, 1)); // 0 = domenica, 1 = prima
            } else {
                // Ogni domenica
                eventi.push(...trovaGiorniSettimanali(annoCorrente, 0));
            }
            } else {
                // Gestisci formati specifici come "ogni terzo sabato del mese"
                const patternSabato = /ogni\s+(\w+)\s+sabato\s+del\s+mese/i;
                const matchSabato = mercatino.Giorno.match(patternSabato);
                
                if (matchSabato) {
                    const numero = convertiNumeroOrdinale(matchSabato[1]);
                    if (numero > 0) {
                        eventi.push(...trovaGiorniSpecificiDelMese(annoCorrente, 6, numero)); // 6 = sabato
                    }
                } else {
                    // Gestisci altri formati specifici
                    const patternGenerico = /ogni\s+(\w+)\s+(\w+)\s+del\s+mese/i;
                    const matchGenerico = mercatino.Giorno.match(patternGenerico);
                    
                    if (matchGenerico) {
                        const numero = convertiNumeroOrdinale(matchGenerico[1]);
                        const giorno = matchGenerico[2].toLowerCase();
                        const giornoNum = convertiGiornoSettimana(giorno);
                        
                        if (numero > 0 && giornoNum >= 0) {
                            eventi.push(...trovaGiorniSpecificiDelMese(annoCorrente, giornoNum, numero));
                        }
                    } else {
                        // Se il formato non è riconosciuto, aggiungi una data generica (oggi)
                        eventi.push(new Date().toISOString().split('T')[0]);
                    }
                }
            }
        } else {
            // Gestisci casi speciali come "dal 1.1.2025 al 30.04.2025"
            const patternDateRange = /dal\s+(\d{1,2})\.(\d{1,2})\.(\d{4})\s+al\s+(\d{1,2})\.(\d{1,2})\.(\d{4})/i;
            const matchDateRange = mercatino.Giorno.match(patternDateRange);
            
            if (matchDateRange) {
                const [, giornoInizio, meseInizio, annoInizio, giornoFine, meseFine, annoFine] = matchDateRange;
                const dataInizio = new Date(parseInt(annoInizio), parseInt(meseInizio) - 1, parseInt(giornoInizio));
                const dataFine = new Date(parseInt(annoFine), parseInt(meseFine) - 1, parseInt(giornoFine));
                
                // Aggiungi tutte le domeniche nel range di date
                let dataCorrente = new Date(dataInizio);
                while (dataCorrente <= dataFine) {
                    if (dataCorrente.getDay() === 0) { // 0 = domenica
                        eventi.push(dataCorrente.toISOString().split('T')[0]);
                    }
                    dataCorrente.setDate(dataCorrente.getDate() + 1);
                }
            } else {
                // Gestisci altri formati di range come "dal 21/06 al 7/09"
                const patternRangeBreve = /dal\s+(\d{1,2})\/(\d{1,2})\s+al\s+(\d{1,2})\/(\d{1,2})/i;
                const matchRangeBreve = mercatino.Giorno.match(patternRangeBreve);
                
                if (matchRangeBreve) {
                    const [, giornoInizio, meseInizio, giornoFine, meseFine] = matchRangeBreve;
                    const dataInizio = new Date(annoCorrente, parseInt(meseInizio) - 1, parseInt(giornoInizio));
                    const dataFine = new Date(annoCorrente, parseInt(meseFine) - 1, parseInt(giornoFine));
                    
                    // Aggiungi tutte le domeniche nel range di date
                    let dataCorrente = new Date(dataInizio);
                    while (dataCorrente <= dataFine) {
                        if (dataCorrente.getDay() === 0) { // 0 = domenica
                            eventi.push(dataCorrente.toISOString().split('T')[0]);
                        }
                        dataCorrente.setDate(dataCorrente.getDate() + 1);
                    }
                } else {
                    // Gestisci altri formati di range come "dal 31/05 al 7/09"
                    const patternRangeSlash = /dal\s+(\d{1,2})\/(\d{1,2})\s+al\s+(\d{1,2})\/(\d{1,2})/i;
                    const matchRangeSlash = mercatino.Giorno.match(patternRangeSlash);
                    
                    if (matchRangeSlash) {
                        const [, giornoInizio, meseInizio, giornoFine, meseFine] = matchRangeSlash;
                        const dataInizio = new Date(annoCorrente, parseInt(meseInizio) - 1, parseInt(giornoInizio));
                        const dataFine = new Date(annoCorrente, parseInt(meseFine) - 1, parseInt(giornoFine));
                        
                        // Aggiungi tutte le domeniche nel range di date
                        let dataCorrente = new Date(dataInizio);
                        while (dataCorrente <= dataFine) {
                            if (dataCorrente.getDay() === 0) { // 0 = domenica
                                eventi.push(dataCorrente.toISOString().split('T')[0]);
                            }
                            dataCorrente.setDate(dataCorrente.getDate() + 1);
                        }
                    } else {
                        // Gestisci casi come "tutti i martedì di luglio, agosto e 2 settembre"
                        const patternMesiSpecifici = /tutti\s+i\s+(\w+)\s+di\s+(\w+),\s+(\w+)\s+e\s+(\d{1,2})\s+(\w+)/i;
                        const matchMesiSpecifici = mercatino.Giorno.match(patternMesiSpecifici);
                        
                        if (matchMesiSpecifici) {
                            const [, giorno, mese1, mese2, giornoFine, meseFine] = matchMesiSpecifici;
                            const giornoNum = convertiGiornoSettimana(giorno);
                            const mese1Num = convertiMese(mese1);
                            const mese2Num = convertiMese(mese2);
                            const meseFineNum = convertiMese(meseFine);
                            
                            if (giornoNum >= 0 && mese1Num >= 0 && mese2Num >= 0 && meseFineNum >= 0) {
                                // Aggiungi tutti i giorni della settimana richiesti nei mesi specificati
                                for (let mese = mese1Num; mese <= mese2Num; mese++) {
                                    eventi.push(...trovaGiorniSettimanali(annoCorrente, giornoNum, mese));
                                }
                                
                                // Aggiungi il giorno specifico del mese finale
                                const dataSpecifica = new Date(annoCorrente, meseFineNum, parseInt(giornoFine));
                                if (dataSpecifica.getDay() === giornoNum) {
                                    eventi.push(dataSpecifica.toISOString().split('T')[0]);
                                }
                            }
                        } else {
                            // Se non c'è informazione sul giorno, usa la data odierna
                            eventi.push(new Date().toISOString().split('T')[0]);
                        }
                    }
                }
            }
        }
        
        // Rimuovi duplicati e ordina le date
        const eventiUnici = [...new Set(eventi)].sort();
        return eventiUnici;
    }
    
    // Funzione per trovare tutti i giorni settimanali di un anno
    function trovaGiorniSettimanali(anno, giornoSettimana, meseSpecifico = null) {
        const eventi = [];
        
        if (meseSpecifico !== null) {
            // Solo per il mese specificato
            const dataInizio = new Date(anno, meseSpecifico, 1);
            let data = new Date(dataInizio);
            
            // Trova il primo giorno della settimana richiesto
            while (data.getDay() !== giornoSettimana) {
                data.setDate(data.getDate() + 1);
            }
            
            // Aggiungi tutti i giorni della settimana richiesti per il mese
            while (data.getMonth() === meseSpecifico) {
                eventi.push(data.toISOString().split('T')[0]);
                data.setDate(data.getDate() + 7);
            }
        } else {
            // Per tutto l'anno (comportamento originale)
            const dataInizio = new Date(anno, 0, 1);
            let data = new Date(dataInizio);
            
            // Trova il primo giorno della settimana richiesto
            while (data.getDay() !== giornoSettimana) {
                data.setDate(data.getDate() + 1);
            }
            
            // Aggiungi tutti i giorni della settimana richiesti per l'anno
            while (data.getFullYear() === anno) {
                eventi.push(data.toISOString().split('T')[0]);
                data.setDate(data.getDate() + 7);
            }
        }
        
        return eventi;
    }
    
    // Funzione per trovare il giorno specifico del mese (es. terzo sabato)
    function trovaGiorniSpecificiDelMese(anno, giornoSettimana, numero) {
        const eventi = [];
        
        for (let mese = 0; mese < 12; mese++) {
            const data = new Date(anno, mese, 1);
            
            // Trova il primo giorno della settimana richiesto
            while (data.getDay() !== giornoSettimana) {
                data.setDate(data.getDate() + 1);
            }
            
            // Aggiungi il numero di settimane richiesto
            if (numero > 1) {
                data.setDate(data.getDate() + (numero - 1) * 7);
            }
            
            // Verifica che la data sia ancora nel mese corrente
            if (data.getMonth() === mese) {
                eventi.push(data.toISOString().split('T')[0]);
            }
        }
        
        return eventi;
    }
    
    // Funzione per trovare l'ultimo giorno della settimana del mese
    function trovaUltimoGiornoDelMese(anno, giornoSettimana) {
        const eventi = [];
        
        for (let mese = 0; mese < 12; mese++) {
            const dataUltimoGiorno = new Date(anno, mese + 1, 0);
            const data = new Date(dataUltimoGiorno);
            
            // Torna indietro fino al giorno della settimana richiesto
            while (data.getDay() !== giornoSettimana) {
                data.setDate(data.getDate() - 1);
            }
            
            eventi.push(data.toISOString().split('T')[0]);
        }
        
        return eventi;
    }
    
    // Funzione per convertire numeri ordinali in numeri cardinali
    function convertiNumeroOrdinale(ordinale) {
        const mappa = {
            'primo': 1, 'prima': 1, '1°': 1, '1^': 1,
            'secondo': 2, 'seconda': 2, '2°': 2, '2^': 2,
            'terzo': 3, 'terza': 3, '3°': 3, '3^': 3,
            'quarto': 4, 'quarta': 4, '4°': 4, '4^': 4,
            'quinto': 5, 'quinta': 5, '5°': 5, '5^': 5
        };
        
        return mappa[ordinale.toLowerCase()] || 0;
    }
    
    // Funzione per convertire nomi dei giorni della settimana in numeri
    function convertiGiornoSettimana(giorno) {
        const mappa = {
            'lunedì': 1, 'lunedi': 1, 'lunedì': 1,
            'martedì': 2, 'martedi': 2, 'martedì': 2,
            'mercoledì': 3, 'mercoledi': 3, 'mercoledì': 3,
            'giovedì': 4, 'giovedi': 4, 'giovedì': 4,
            'venerdì': 5, 'venerdi': 5, 'venerdì': 5,
            'sabato': 6, 'sabato': 6,
            'domenica': 0, 'domenica': 0
        };
        
        return mappa[giorno.toLowerCase()] || -1;
    }
    
    // Funzione per convertire nomi dei mesi in numeri
    function convertiMese(mese) {
        const mappa = {
            'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
            'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
        };
        
        return mappa[mese.toLowerCase()] || -1;
    }
    
    // Funzione per trovare i giorni settimanali in mesi specifici
    function trovaGiorniSettimanali(anno, giornoSettimana, meseSpecifico = null) {
        const eventi = [];
        
        if (meseSpecifico !== null) {
            // Solo per il mese specificato
            const dataInizio = new Date(anno, meseSpecifico, 1);
            let data = new Date(dataInizio);
            
            // Trova il primo giorno della settimana richiesto
            while (data.getDay() !== giornoSettimana) {
                data.setDate(data.getDate() + 1);
            }
            
            // Aggiungi tutti i giorni della settimana richiesti per il mese
            while (data.getMonth() === meseSpecifico) {
                eventi.push(data.toISOString().split('T')[0]);
                data.setDate(data.getDate() + 7);
            }
        } else {
            // Per tutto l'anno (comportamento originale)
            const dataInizio = new Date(anno, 0, 1);
            let data = new Date(dataInizio);
            
            // Trova il primo giorno della settimana richiesto
            while (data.getDay() !== giornoSettimana) {
                data.setDate(data.getDate() + 1);
            }
            
            // Aggiungi tutti i giorni della settimana richiesti per l'anno
            while (data.getFullYear() === anno) {
                eventi.push(data.toISOString().split('T')[0]);
                data.setDate(data.getDate() + 7);
            }
        }
        
        return eventi;
    }
    
    // Funzione per creare le date delle fiere
    function creaDataFiera(fiera) {
        const eventi = [];
        const annoCorrente = new Date().getFullYear();
        
        // Gestisci il caso in cui ci siano più date separate da newline
        if (fiera["Data inizio"] && fiera["Data fine"]) {
            // Prendi solo la prima data (prima riga) e rimuovi caratteri problematici
            const dataInizio = fiera["Data inizio"].split("\n")[0].trim().replace(/\r/g, '');
            const dataFine = fiera["Data fine"].split("\n")[0].trim().replace(/\r/g, '');
            
            if (dataInizio && dataFine) {
                // Estrai giorno e mese dalle date in formato "DD/MM"
                const [giornoInizio, meseInizio] = dataInizio.split('/').map(num => parseInt(num));
                const [giornoFine, meseFine] = dataFine.split('/').map(num => parseInt(num));
                
                if (giornoInizio && meseInizio && giornoFine && meseFine) {
                    // Crea le date con l'anno corrente
                    eventi.push({
                        start: `${annoCorrente}-${meseInizio.toString().padStart(2, '0')}-${giornoInizio.toString().padStart(2, '0')}`,
                        end: `${annoCorrente}-${meseFine.toString().padStart(2, '0')}-${giornoFine.toString().padStart(2, '0')}`
                    });
                }
            }
        } else if (fiera.Mese) {
            // Se non ci sono date specifiche ma c'è il mese, usa il primo giorno del mese
            const mesi = {
                'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
                'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
            };
            
            const meseNum = mesi[fiera.Mese.toLowerCase()];
            if (meseNum !== undefined) {
                const dataInizio = new Date(annoCorrente, meseNum, 1);
                const dataFine = new Date(annoCorrente, meseNum, 15); // Usa metà mese come default
                
                eventi.push({
                    start: dataInizio.toISOString().split('T')[0],
                    end: dataFine.toISOString().split('T')[0]
                });
            }
        }
        
        return eventi;
    }
    
    // Funzione per nascondere lo spinner di caricamento
    function nascondiSpinnerCaricamento() {
        const statusEl = document.getElementById('statusCaricamento');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
        
        // Aggiorna l'indicatore di stato online
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator) {
            statusIndicator.className = 'spinner-border spinner-border-sm me-1 text-success';
        }
    }
    
    // Funzione per gestire lo stato online
    function aggiornaStatoOnline() {
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator) {
            if (navigator.onLine) {
                statusIndicator.className = 'spinner-border spinner-border-sm me-1 text-success';
            } else {
                statusIndicator.className = 'spinner-border spinner-border-sm me-1 text-danger';
            }
        }
    }
    
    // Funzione per ricaricare i dati da Google Sheets
    function ricaricaDatiGoogleSheets() {
        const button = document.getElementById('ricaricaDati');
        const statusEl = document.getElementById('statusCaricamento');
        
        // Disabilita il pulsante e mostra lo spinner
        button.disabled = true;
        button.innerHTML = '🔄 Ricaricamento...';
        statusEl.style.display = 'block';
        statusEl.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Ricarica...</span>
            </div>
            Ricaricamento dati da Google Sheets in corso...
        `;
        
        // Pulisci i dati esistenti
        mercatini = [];
        fiere = [];
        comuni.clear();
        categorie.clear();
        
        // Ricarica i dati
        Promise.all([
            caricaDatiMercatiniGoogleSheets(),
            caricaDatiFiereGoogleSheets()
        ]).then(() => {
            console.log('Dati ricaricati con successo');
            
            // Aggiorna tutto
            aggiornaComuniFiltro();
            aggiornaCategorieFiltro();
            generaEventiCalendario();
            aggiornaListaProssimiEventi();
            aggiornaListaPreferiti();
            
            // Nascondi lo spinner e riabilita il pulsante
            statusEl.style.display = 'none';
            button.disabled = false;
            button.innerHTML = '🔄 Ricarica dati da Google Sheets';
            
            // Mostra messaggio di successo
            const successAlert = document.createElement('div');
            successAlert.className = 'alert alert-success alert-dismissible fade show mt-2';
            successAlert.innerHTML = `
                ✅ Dati aggiornati con successo da Google Sheets
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            button.parentNode.appendChild(successAlert);
            
            // Rimuovi l'alert dopo 3 secondi
            setTimeout(() => {
                if (successAlert.parentNode) {
                    successAlert.remove();
                }
            }, 3000);
            
        }).catch(error => {
            console.error('Errore nel ricaricamento dei dati:', error);
            
            // Mostra errore e riabilita il pulsante
            statusEl.style.display = 'none';
            button.disabled = false;
            button.innerHTML = '🔄 Ricarica dati da Google Sheets';
            
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger alert-dismissible fade show mt-2';
            errorAlert.innerHTML = `
                ❌ Errore nel ricaricamento: ${error.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            button.parentNode.appendChild(errorAlert);
        });
    }
    
    // Funzione per applicare i filtri
    function applicaFiltri() {
        generaEventiCalendario();
        aggiornaListaProssimiEventi();
    }
    
    // Funzione per aggiornare la lista dei prossimi eventi
    function aggiornaListaProssimiEventi() {
        const prossimiEventiEl = document.getElementById('prossimiEventi');
        prossimiEventiEl.innerHTML = '';
        
        const oggi = new Date();
        const eventiOrdinati = [];
        
        // Ottieni tutti gli eventi dal calendario e ordina per data
        const eventiCalendario = calendar.getEvents();
        eventiCalendario.forEach(evento => {
            const dataEvento = new Date(evento.start);
            if (dataEvento >= oggi) {
                eventiOrdinati.push({
                    data: dataEvento,
                    evento: evento
                });
            }
        });
        
        // Ordina gli eventi per data
        eventiOrdinati.sort((a, b) => a.data - b.data);
        
        // Mostra solo i primi 5 eventi
        const eventiDaMostrare = eventiOrdinati.slice(0, 5);
        
        if (eventiDaMostrare.length === 0) {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.textContent = 'Nessun evento in programma';
            prossimiEventiEl.appendChild(listItem);
        } else {
            eventiDaMostrare.forEach(item => {
                const listItem = document.createElement('li');
                listItem.className = `list-group-item ${item.evento.extendedProps.tipo}`;
                
                const dataFormattata = item.data.toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'short'
                });
                
                listItem.innerHTML = `
                    <div class="evento-data">${dataFormattata}</div>
                    <div class="evento-nome">${item.evento.title}</div>
                    <div class="evento-comune">${item.evento.extendedProps.tipo === 'mercatino' ? 'Mercatino' : 'Fiera'}</div>
                `;
                
                listItem.addEventListener('click', () => {
                    mostraDettagliEvento(item.evento);
                });
                
                prossimiEventiEl.appendChild(listItem);
            });
        }
    }
    
    // Funzione per aggiornare la lista dei preferiti
    function aggiornaListaPreferiti() {
        const preferitiEl = document.getElementById('preferiti');
        if (!preferitiEl) return;
        
        preferitiEl.innerHTML = '';
        
        if (preferiti.size === 0) {
            preferitiEl.innerHTML = '<p class="text-muted">Nessun mercatino nei preferiti</p>';
            return;
        }
        
        // Trova i mercatini preferiti
        const mercatiniPreferiti = [];
        mercatini.forEach(mercatino => {
            const mercatinoId = `${mercatino.Comune}-${mercatino.Giorno}`;
            if (preferiti.has(mercatinoId)) {
                mercatiniPreferiti.push(mercatino);
            }
        });
        
        // Mostra i preferiti
        mercatiniPreferiti.forEach(mercatino => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item mercatino';
            
            listItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="evento-nome">${mercatino.Comune}</div>
                        <div class="evento-comune">${mercatino.Giorno}</div>
                        <div class="evento-data">${mercatino.Orario}</div>
                    </div>
                    <button class="btn btn-sm btn-warning" 
                            onclick="togglePreferito('${mercatino.Comune}-${mercatino.Giorno}')">
                        ❤️ Rimosso
                    </button>
                </div>
            `;
            
            preferitiEl.appendChild(listItem);
        });
    }
    
    // Funzione per mostrare tutti gli eventi di un giorno specifico
    function mostraEventiGiorno(data) {
        const dataFormattata = new Date(data).toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Trova tutti gli eventi per quella data
        const eventiGiorno = calendar.getEvents().filter(evento => {
            const eventoData = new Date(evento.start);
            const dataCliccata = new Date(data);
            return eventoData.toDateString() === dataCliccata.toDateString();
        });
        
        const modalTitolo = document.getElementById('eventoModalLabel');
        const modalBody = document.getElementById('eventoModalBody');
        
        modalTitolo.textContent = `Eventi del ${dataFormattata}`;
        
        if (eventiGiorno.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">Nessun evento in programma per questa data.</p>';
        } else {
            let html = `<div class="mb-3"><strong>${eventiGiorno.length} evento${eventiGiorno.length > 1 ? 'i' : ''} trovato${eventiGiorno.length > 1 ? 'i' : ''}:</strong></div>`;
            
            eventiGiorno.forEach((evento, index) => {
                const dettagli = evento.extendedProps.dettagli;
                const tipo = evento.extendedProps.tipo;
                const isPref = tipo === 'mercatino' ? isPreferito(`${dettagli.Comune}-${dettagli.Giorno}`) : false;
                
                html += `
                    <div class="card mb-3 ${tipo === 'mercatino' ? 'border-success' : 'border-primary'}">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span class="badge ${tipo === 'mercatino' ? 'bg-success' : 'bg-primary'}">${tipo === 'mercatino' ? 'Mercatino' : 'Fiera'}</span>
                            ${tipo === 'mercatino' ? `
                                <button class="btn btn-sm ${isPref ? 'btn-warning' : 'btn-outline-warning'}" 
                                        onclick="togglePreferito('${dettagli.Comune}-${dettagli.Giorno}')">
                                    ${isPref ? '❤️ Rimosso' : '🤍 Aggiungi'}
                                </button>
                            ` : ''}
                        </div>
                        <div class="card-body">
                            <h6 class="card-title">${evento.title}</h6>
                            ${tipo === 'mercatino' ? `
                                <p><strong>Giorno:</strong> ${dettagli.Giorno || 'Non specificato'}</p>
                                <p><strong>Orario:</strong> ${dettagli.Orario || 'Non specificato'}</p>
                                <p><strong>Settori:</strong> ${dettagli["Settori merceologici"] || 'Non specificati'}</p>
                                <p><strong>Luogo:</strong> ${dettagli["Luogo di svolgimento"] || 'Non specificato'}</p>
                            ` : `
                                <p><strong>Periodo:</strong> ${dettagli["Data inizio"] || ''} - ${dettagli["Data fine"] || ''}</p>
                                <p><strong>Tipologia:</strong> ${dettagli.Tipologia || 'Non specificata'}</p>
                                <p><strong>Settori:</strong> ${dettagli["Settori merceologici"] || 'Non specificati'}</p>
                                <p><strong>Luogo:</strong> ${dettagli["Luogo di svolgimento"] || 'Non specificato'}</p>
                            `}
                        </div>
                    </div>
                `;
            });
            
            modalBody.innerHTML = html;
        }
        
        // Mostra il modal
        const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
        modal.show();
    }
    
    // Funzione per mostrare i dettagli dell'evento in un modal
    function mostraDettagliEvento(evento) {
        const dettagli = evento.extendedProps.dettagli;
        const tipo = evento.extendedProps.tipo;
        
        const modalTitolo = document.getElementById('eventoModalLabel');
        const modalBody = document.getElementById('eventoModalBody');
        
        if (tipo === 'mercatino') {
            const isPref = isPreferito(`${dettagli.Comune}-${dettagli.Giorno}`);
            modalTitolo.textContent = `Mercatino a ${dettagli.Comune}`;
            modalBody.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6>Mercatino a ${dettagli.Comune}</h6>
                    <button class="btn ${isPref ? 'btn-warning' : 'btn-outline-warning'}" 
                            onclick="togglePreferito('${dettagli.Comune}-${dettagli.Giorno}')">
                        ${isPref ? '❤️ Rimosso dai preferiti' : '🤍 Aggiungi ai preferiti'}
                    </button>
                </div>
                <p><strong>Comune:</strong> ${dettagli.Comune || 'Non specificato'}</p>
                <p><strong>Giorno:</strong> ${dettagli.Giorno || 'Non specificato'}</p>
                <p><strong>Orario:</strong> ${dettagli.Orario || 'Non specificato'}</p>
                <p><strong>Settori merceologici:</strong> ${dettagli["Settori merceologici"] || 'Non specificati'}</p>
                <p><strong>Luogo di svolgimento:</strong> ${dettagli["Luogo di svolgimento"] || 'Non specificato'}</p>
                <p><strong>Organizzatore:</strong> ${dettagli["Soggetto organizzatore"] || 'Non specificato'}</p>
            `;
        } else if (tipo === 'fiera') {
            modalTitolo.textContent = dettagli.Denominazione || `Fiera a ${dettagli.Comune}`;
            modalBody.innerHTML = `
                <p><strong>Comune:</strong> ${dettagli.Comune || 'Non specificato'}</p>
                <p><strong>Periodo:</strong> ${dettagli["Data inizio"] || ''} - ${dettagli["Data fine"] || ''}</p>
                <p><strong>Tipologia:</strong> ${dettagli.Tipologia || 'Non specificata'}</p>
                <p><strong>Settori merceologici:</strong> ${dettagli["Settori merceologici"] || 'Non specificati'}</p>
                <p><strong>Luogo di svolgimento:</strong> ${dettagli["Luogo di svolgimento"] || 'Non specificato'}</p>
                <p><strong>Organizzatore:</strong> ${dettagli["Soggetto organizzatore"] || 'Non specificato'}</p>
            `;
        }
        
        // Mostra il modal
        const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
        modal.show();
    }
});
