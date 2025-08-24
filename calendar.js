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
            dayClick: (info) => this.onDayClick(info.dateStr),
            eventClassNames: (arg) => this.getEventClassNames(arg)
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
