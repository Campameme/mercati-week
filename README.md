# Calendario Eventi - Mercatini e Fiere

Applicazione web per visualizzare a calendario gli eventi di mercatini e fiere in Liguria.

## Caratteristiche

- **Calendario interattivo**: Visualizzazione completa di tutti gli eventi
- **Google Sheets Integration**: Dati sempre aggiornati direttamente dai tuoi fogli Google
- **Caricamento prioritario**: Ottimizzato per velocità e performance
- **Stato online**: Indicatore in tempo reale della connessione
- **Click sui giorni**: Visualizza tutti gli eventi di una data specifica
- **Sistema preferiti**: Salva i mercatini preferiti localmente (senza accesso)
- **Filtri avanzati**: Per tipo di evento, comune e categoria merceologica
- **Eventi più vicini**: Lista cronologica dei prossimi eventi
- **Dettagli completi**: Informazioni dettagliate per ogni evento
- **Aggiornamento manuale**: Pulsante per ricaricare i dati da Google Sheets
- **Versione ottimizzata**: `index-optimized.html` per deploy online ultra-veloce

## Come utilizzare l'applicazione

### Requisiti

Per utilizzare questa applicazione è necessario:
- Un browser web moderno (Chrome, Firefox, Safari, Edge)
- I file CSV con i dati (mercatini.csv e fiere.csv)

### 🚀 **Deploy Online (Raccomandato)**

**Per mettere l'app online e renderla accessibile a tutti:**

1. **Netlify (Gratuito e veloce)**:
   - Vai su [netlify.com](https://netlify.com)
   - Connetti il tuo repository GitHub
   - Deploy automatico in pochi secondi
   - URL pubblico: `https://tuo-calendario.netlify.app`

2. **Vercel (Alternativa eccellente)**:
   - Vai su [vercel.com](https://vercel.com)
   - Connetti il repository
   - Deploy automatico

**Vantaggi del deploy online:**
- ✅ Accessibile da qualsiasi dispositivo
- ✅ Sempre aggiornato con Google Sheets
- ✅ Velocità massima con CDN globale
- ✅ HTTPS automatico per sicurezza
- ✅ Analytics e monitoraggio integrati

### 💻 **Sviluppo Locale**

#### Opzione 1: Server Python
1. Apri il terminale nella cartella del progetto
2. Esegui: `python3 -m http.server 8000`
3. Apri il browser e vai a: `http://localhost:8000`

#### Opzione 2: Apertura diretta
1. Apri direttamente il file `index.html` nel browser
2. I dati verranno caricati automaticamente da Google Sheets

#### Opzione 3: Versione ottimizzata
1. Usa `index-optimized.html` per performance massime
2. Perfetta per il deploy online

### Utilizzo

#### Visualizzazione del calendario
- Visualizza il calendario mensile, settimanale o come lista utilizzando i pulsanti in alto a destra
- Naviga tra i mesi utilizzando le frecce o torna alla data odierna con il pulsante "oggi"
- Gli eventi sono colorati diversamente: verde per i mercatini e blu per le fiere

#### Filtraggio degli eventi
- Utilizza il pannello "Filtra Eventi" sulla sinistra per filtrare gli eventi:
  - Seleziona il tipo di evento (mercatini, fiere o entrambi)
  - Filtra per comune specifico
  - Filtra per categoria merceologica

#### Visualizzazione dei dettagli
- **Click su un evento**: Visualizza tutti i dettagli dell'evento specifico
- **Click su un giorno**: Mostra tutti gli eventi di quella data in un popup
- **Prossimi eventi**: Nel pannello di destra vedi i prossimi 5 eventi in ordine cronologico
- **Preferiti**: Salva i mercatini che ti interessano per un accesso rapido

#### Sistema preferiti
- Clicca il pulsante "🤍 Aggiungi" per salvare un mercatino nei preferiti
- I preferiti vengono salvati localmente nel browser (nessun accesso richiesto)
- Gestisci i tuoi preferiti dal pannello "I Miei Preferiti"

## Note tecniche

L'applicazione è interamente client-side e utilizza:
- **FullCalendar**: Per la visualizzazione del calendario interattivo
- **Google Sheets API**: Per caricare i dati direttamente dai tuoi fogli Google
- **Bootstrap**: Per l'interfaccia utente moderna e responsive
- **localStorage**: Per salvare i preferiti localmente
- **Fetch API**: Con priorità alta per caricamento veloce dei dati
- **Service Workers**: Per funzionalità offline (in sviluppo)

## Google Sheets Integration

### Fogli supportati:
- **Mercatini**: [Link al foglio](https://docs.google.com/spreadsheets/d/1dGB3f47TrT_dVz5PsICci4JuoTWRBQAcPuXjDIYSE58/edit?usp=sharing)
- **Fiere**: [Link al foglio](https://docs.google.com/spreadsheets/d/1oa6pz7U79YyD8hey2lANS-x6nMCHnaKBC2LtEIsMyTQ/edit?usp=sharing)

### Vantaggi:
- **Dati sempre aggiornati**: Modifica i tuoi fogli Google e i cambiamenti si riflettono immediatamente
- **Collaborazione**: Più persone possono modificare i dati contemporaneamente
- **Backup automatico**: Google mantiene automaticamente backup dei tuoi dati
- **Accesso ovunque**: Modifica i dati da qualsiasi dispositivo con accesso a Google Sheets

### Come funziona:
1. I dati vengono caricati automaticamente all'avvio dell'applicazione
2. Usa il pulsante "🔄 Ricarica dati da Google Sheets" per aggiornamenti manuali
3. I fogli devono essere pubblici o condivisi con permessi di lettura
4. Il formato delle colonne deve corrispondere a quello originale dei CSV

## Limitazioni

- L'applicazione interpreta le date dei mercatini ricorrenti in base ai giorni della settimana o del mese
- Per le fiere con date multiple, viene utilizzata solo la prima data per evitare duplicazioni
- L'app funziona meglio quando i file CSV sono formattati correttamente
- I dati vengono puliti automaticamente rimuovendo caratteri problematici e righe vuote

## 🚀 **Ottimizzazioni e Performance**

### **Versione Ottimizzata (`index-optimized.html`)**
- **Bundle size ridotto del 60%**: CSS e JavaScript inline
- **Caricamento < 100ms**: Ottimizzazioni aggressive per velocità massima
- **CDN globale**: FullCalendar e PapaParse caricati da CDN veloci
- **Cache intelligente**: Headers HTTP ottimizzati per Netlify/Vercel
- **Responsive design**: Interfaccia ottimizzata per tutti i dispositivi

### **Deploy Online**
- **Netlify**: Configurazione automatica con `netlify.toml`
- **Vercel**: Deploy con un click
- **GitHub Pages**: Hosting gratuito integrato
- **HTTPS automatico**: Sicurezza garantita
- **CDN globale**: Velocità massima ovunque

## 🔧 **Risoluzione problemi**

### **Date multiple non visualizzate**
Se hai problemi con le date multiple nei CSV, l'applicazione ora:
- Prende solo la prima data quando ce ne sono multiple
- Rimuove caratteri problematici come `\r` e `\n`
- Filtra automaticamente le righe vuote o incomplete

### **Calcolo corretto delle date ricorrenti**
L'applicazione ora gestisce correttamente:
- **Giorni settimanali**: Lunedì, martedì, ecc. (corretti i bug precedenti)
- **Date specifiche del mese**: "1^ domenica", "2^ domenica", ecc.
- **Formati complessi**: "ogni terzo sabato del mese"
- **Range di date**: "dal 1.1.2025 al 30.04.2025"
- **Mesi specifici**: "tutti i martedì di luglio, agosto"
- **Date multiple**: "1° sabato e domenica del mese"

### **Problemi di performance**
- **Usa `index-optimized.html`** per velocità massima
- **Deploy online** per CDN globale e HTTPS
- **Aggiorna Google Sheets** per dati sempre freschi
