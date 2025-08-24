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
