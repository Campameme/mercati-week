# 📅 Calendario Eventi - Mercatini e Fiere

Un'applicazione web moderna e interattiva per visualizzare eventi (mercatini e fiere) in un calendario FullCalendar con filtri avanzati e sistema di preferiti.

## 🚀 Caratteristiche

### ✨ Funzionalità Principali
- **Calendario Interattivo**: Visualizzazione mensile, settimanale e a lista degli eventi
- **Filtri Avanzati**: Per comune, categoria e tipo di evento
- **Sistema Preferiti**: Salvataggio locale degli eventi preferiti
- **Eventi Vicini**: Visualizzazione dei prossimi 5 eventi
- **Responsive Design**: Ottimizzato per desktop e mobile

### 🎯 Gestione Eventi
- **Mercatini**: Supporto per ricorrenze settimanali e periodi specifici
- **Fiere**: Gestione di eventi con date specifiche o periodi mensili
- **Logica Ricorrenza**: 
  - "ricorrente" = valido tutto l'anno
  - Date specifiche = valido solo per quel periodo

### 🔧 Tecnologie
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Librerie**: FullCalendar 6.1.10, Bootstrap 5.3.0, PapaParse 5.4.1
- **Dati**: Google Sheets (CSV via gviz/tq)
- **Storage**: localStorage per preferiti

## 📁 Struttura Progetto

```
nuovo progetto dari/
├── index.html          # File principale HTML
├── style.css           # Stili CSS personalizzati
├── config.js           # Configurazione e logging
├── utils.js            # Utility per date e dati
├── calendar.js         # Gestione calendario FullCalendar
├── data-loader.js      # Caricamento e parsing dati
├── app.js              # Logica principale dell'applicazione
├── README.md           # Documentazione
├── package.json        # Metadati progetto
└── netlify.toml        # Configurazione Netlify
```

## 🛠️ Installazione e Utilizzo

### 📋 Prerequisiti
- Browser moderno con supporto ES6+
- Accesso a Google Sheets
- Server web locale o hosting online

### 🚀 Avvio Locale
1. **Clona il repository**:
   ```bash
   git clone <repository-url>
   cd "nuovo progetto dari"
   ```

2. **Avvia server locale**:
   ```bash
   python3 -m http.server 8000
   # oppure
   npx serve .
   ```

3. **Apri nel browser**:
   ```
   http://localhost:8000
   ```

### 🌐 Deploy Online
1. **Netlify** (raccomandato):
   - Collega il repository GitHub
   - Build settings: `publish = "."`
   - Deploy automatico ad ogni push

2. **Vercel**:
   - Importa il repository
   - Deploy automatico

3. **GitHub Pages**:
   - Abilita GitHub Pages nel repository
   - Source: branch main

## 📊 Configurazione Dati

### 🔗 Google Sheets
L'applicazione si connette a Google Sheets tramite l'endpoint `gviz/tq`:

```javascript
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1BCCgGLKYZOz3SdWZx199kbp1PV387N_qzM3oTuRVESU/gviz/tq?tqx=out:csv&sheet=Foglio1';
```

### 📋 Struttura Dati Richiesta
- **Comune**: Nome del comune
- **Evento**: Nome dell'evento
- **Tipologia**: Categoria dell'evento
- **Giorno**: Giorno ricorrente (es: "sabato", "domenica")
- **Data inizio**: "ricorrente" o DD/MM
- **Data fine**: "ricorrente" o DD/MM
- **Mese**: Mese specifico (es: "giugno", "agosto")
- **Orario**: Orario di svolgimento
- **Luogo**: Luogo di svolgimento
- **Organizzatore**: Soggetto organizzatore
- **Settori merceologici**: Settori per mercatini

## 🎨 Personalizzazione

### 🎨 Temi e Colori
Modifica le variabili CSS in `style.css`:

```css
:root {
    --primary-color: #007bff;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --danger-color: #dc3545;
    --info-color: #17a2b8;
}
```

### ⚙️ Configurazione
Modifica le impostazioni in `config.js`:

```javascript
const CONFIG = {
    GOOGLE_SHEETS_URL: 'your-sheets-url',
    CALENDAR: {
        MONTHS_TO_GENERATE: 12,
        INITIAL_VIEW: 'dayGridMonth'
    },
    DEBUG: true
};
```

## 🔍 Debug e Logging

### 📝 Console Logging
L'applicazione include logging dettagliato per il debug:

```javascript
Logger.info('Messaggio informativo');
Logger.success('Operazione completata');
Logger.warning('Attenzione');
Logger.error('Errore');
Logger.debug('Dettagli debug');
```

### 🐛 Risoluzione Problemi

#### Eventi non visibili
1. Controlla la console del browser per errori
2. Verifica la connessione a Google Sheets
3. Controlla la struttura dei dati nel sheets

#### Date non generate
1. Verifica il formato delle date nel sheets
2. Controlla la logica di ricorrenza
3. Verifica i log di generazione date

#### Filtri non funzionanti
1. Controlla che i dati siano caricati correttamente
2. Verifica la popolazione dei dropdown
3. Controlla i log di aggiornamento filtri

## 📱 Responsive Design

L'applicazione è ottimizzata per:
- **Desktop**: Layout a griglia con sidebar
- **Tablet**: Layout adattivo con sidebar sotto
- **Mobile**: Layout verticale ottimizzato

## 🔒 Sicurezza

- **CORS**: Gestito tramite Google Sheets gviz/tq
- **Storage**: Solo localStorage per preferiti
- **Validazione**: Parsing sicuro dei dati CSV
- **Sanitizzazione**: Pulizia dei dati in input

## 🚀 Performance

- **Lazy Loading**: Caricamento asincrono dei dati
- **Batch Processing**: Aggiunta eventi in batch
- **Debouncing**: Ottimizzazione filtri
- **Caching**: Salvataggio preferiti locale

## 🤝 Contributi

1. Fork del repository
2. Crea un branch per la feature
3. Commit delle modifiche
4. Push al branch
5. Crea una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT.

## 📞 Supporto

Per supporto o domande:
- Apri una issue su GitHub
- Controlla la documentazione
- Verifica i log di debug

---

**Versione**: 4.0.0  
**Ultimo aggiornamento**: Dicembre 2024  
**Compatibilità**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
