# 📅 Calendario Eventi - Mercatini e Fiere

**Versione 3.0.0** - Calendario interattivo per mercatini e fiere della Liguria con integrazione Google Sheets in tempo reale.

## 🚀 Caratteristiche Principali

- **📊 Calendario Interattivo**: Visualizzazione mensile, settimanale e lista eventi
- **🔍 Filtri Avanzati**: Per comune, categoria merceologica e tipo evento
- **⭐ Sistema Preferiti**: Salva i tuoi eventi preferiti localmente
- **📍 Eventi Vicini**: Scopri cosa succede nelle prossime 2 settimane
- **🔄 Dati in Tempo Reale**: Aggiornamento automatico da Google Sheets
- **📱 Design Responsive**: Ottimizzato per tutti i dispositivi
- **🟢 Status Online**: Indicatore di connessione in tempo reale

## 🛠️ Tecnologie Utilizzate

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework**: Bootstrap 5.3.2
- **Calendario**: FullCalendar 6.1.10
- **Parsing CSV**: PapaParse 5.4.1
- **Hosting**: Netlify (deploy automatico)
- **Dati**: Google Sheets (API gviz/tq)

## 📁 Struttura Progetto

```
├── index.html          # Pagina principale ottimizzata
├── style.css           # Stili CSS con variabili CSS e animazioni
├── script.js           # Logica JavaScript completa
├── package.json        # Configurazione progetto
├── netlify.toml        # Configurazione Netlify
├── .gitignore          # File da ignorare
└── README.md           # Documentazione
```

## 🚀 Installazione e Utilizzo

### **Opzione 1: Utilizzo Online (Raccomandato)**
1. **Apri l'app**: [https://mercati-week.netlify.app](https://mercati-week.netlify.app)
2. **Aspetta il caricamento** dei dati da Google Sheets
3. **Usa i filtri** per trovare eventi specifici
4. **Clicca sugli eventi** per vedere i dettagli
5. **Clicca sui giorni** per vedere tutti gli eventi di quel giorno

### **Opzione 2: Sviluppo Locale**
1. **Clona il repository**:
   ```bash
   git clone https://github.com/Campameme/mercati-week.git
   cd mercati-week
   ```

2. **Avvia server locale**:
   ```bash
   python3 -m http.server 8000
   ```

3. **Apri nel browser**: `http://localhost:8000`

## 📊 Fonti Dati

L'app si connette automaticamente a due Google Sheets:

- **🛒 Mercatini**: [Link Google Sheets](https://docs.google.com/spreadsheets/d/1dGB3f47TrT_dVz5PsICci4JuoTWRBQAcPuXjDIYSE58/edit?usp=sharing)
- **🎪 Fiere**: [Link Google Sheets](https://docs.google.com/spreadsheets/d/1oa6pz7U79YyD8hey2lANS-x6nMCHnaKBC2LtEIsMyTQ/edit?usp=sharing)

## 🎯 Funzionalità Principali

### **Calendario Interattivo**
- Navigazione mensile/settimanale
- Eventi colorati per tipo (🛒 Mercatini, 🎪 Fiere)
- Click su eventi per dettagli completi
- Click sui giorni per lista eventi giornaliera

### **Sistema Filtri**
- **🏘️ Comune**: Filtra per località specifica
- **🏷️ Categoria**: Filtra per settore merceologico
- **📋 Tipo**: Filtra per tipo di evento

### **Gestione Preferiti**
- Salva eventi preferiti (senza login)
- Sincronizzazione automatica locale
- Lista dedicata sempre visibile

### **Eventi Vicini**
- Prossimi 5 eventi nelle 2 settimane
- Calcolo automatico giorni rimanenti
- Aggiornamento in tempo reale

## 🔧 Configurazione Avanzata

### **Personalizzazione Google Sheets**
1. **Copia i template** forniti
2. **Aggiorna gli ID** in `script.js`
3. **Rendi pubblici** i fogli di calcolo
4. **Usa formato CSV** per compatibilità

### **Personalizzazione Stili**
- **Variabili CSS**: Modifica colori e dimensioni in `style.css`
- **Temi**: Cambia colori primari e secondari
- **Responsive**: Ottimizzazioni per mobile e tablet

## 🚀 Deploy Online

### **Netlify (Raccomandato)**
1. **Connetti repository** GitHub
2. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.`
3. **Deploy automatico** ad ogni push

### **Vercel**
1. **Importa progetto** da GitHub
2. **Framework preset**: Static
3. **Deploy automatico** configurato

### **GitHub Pages**
1. **Abilita Pages** nelle impostazioni repository
2. **Source**: Branch main
3. **Deploy** automatico

## 📱 Compatibilità

- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Dispositivi**: Desktop, tablet, smartphone
- **Risoluzioni**: 320px - 4K
- **Connessioni**: 3G, 4G, 5G, WiFi

## 🔄 Aggiornamenti

### **Automatici**
- **Dati**: Aggiornamento in tempo reale da Google Sheets
- **Deploy**: Automatico ad ogni commit su GitHub

### **Manuali**
- **Filtri**: Reset con pulsante "Ricarica Dati"
- **Preferiti**: Gestione locale persistente
- **Cache**: Pulizia automatica browser

## 🐛 Risoluzione Problemi

### **Eventi Non Visibili**
1. **Controlla console** browser per errori
2. **Verifica connessione** internet
3. **Ricarica dati** con pulsante dedicato
4. **Controlla filtri** attivi

### **Lentezza Caricamento**
1. **Verifica connessione** Google Sheets
2. **Controlla dimensioni** dataset
3. **Usa filtri** per ridurre eventi
4. **Aggiorna browser** all'ultima versione

## 📈 Performance e Ottimizzazioni

- **Lazy Loading**: Caricamento progressivo eventi
- **Debouncing**: Ottimizzazione filtri in tempo reale
- **Caching**: Memorizzazione locale preferiti
- **Compressione**: CSS e JS ottimizzati
- **CDN**: Librerie esterne da CDN affidabili

## 🤝 Contributi

1. **Fork** il repository
2. **Crea branch** per feature: `git checkout -b feature/nuova-funzionalita`
3. **Commit** modifiche: `git commit -m 'Aggiunta nuova funzionalità'`
4. **Push** al branch: `git push origin feature/nuova-funzionalita`
5. **Crea Pull Request**

## 📄 Licenza

Questo progetto è rilasciato sotto licenza **MIT**. Vedi il file `LICENSE` per dettagli.

## 👨‍💻 Autore

**Emanuele Campanini** - [GitHub](https://github.com/Campameme)

## 🌟 Ringraziamenti

- **Google Sheets** per l'hosting dati
- **FullCalendar** per la libreria calendario
- **Bootstrap** per il framework CSS
- **Netlify** per l'hosting gratuito

---

**⭐ Se ti piace questo progetto, lascia una stella su GitHub!**
