# ACR Maria Immacolata — Portale Educatori

Portale interno per gli educatori dell'ACR della parrocchia: firma settimanale
(individuale) delle classi, presenze, tematiche ed elenco ragazzi. Pensato come PWA
(installabile su telefono, gratuita, nessuno store).

## Stack

- **Vite + React** — frontend
- **React Router** — navigazione
- **Supabase** — database e backend
- **vite-plugin-pwa** — installabilità e funzionamento offline di base

## Regole principali

- **Accesso**: nome e cognome + password (colonne `nome` e `password` della tabella
  `educatori`).
- **La firma è individuale**: ogni educatore firma per sé (non un'unica firma condivisa
  per tutta la classe). La gestione (presenze, tematiche, ecc.) si sblocca appena almeno
  un educatore ha firmato quel giorno.
- **Si firma solo sabato e domenica**, tranne i moderatori che possono firmare — e
  modificare tutto — in qualsiasi momento.
- **L'aggiunta di ragazzi** è riservata ai soli moderatori (nella pagina classe non
  compare per un educatore normale; nel pannello "Aggiunta" sì).

## Avvio in locale

```bash
npm install
cp .env.example .env   # poi inserisci URL e anon key del tuo progetto Supabase
npm run dev
```

## Configurare Supabase

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Apri l'editor SQL del progetto ed esegui `supabase/setup.sql`. Lo script:
   - **cancella** le tabelle esistenti (comprese quelle della vecchia versione del
     catechismo) e ricrea `educatori`, `classi`, `classe_educatori`, `ragazzi`, `firme`,
     `presenze_educatori`, `presenze_ragazzi`, `tematiche`;
   - inserisce le 9 classi e i 12 educatori iniziali con le relative assegnazioni.
3. Copia **Project URL** e **anon public key** (Settings → API) dentro `.env`.
4. **Imposta almeno un moderatore**, altrimenti nessuno potrà aggiungere ragazzi o usare
   il pannello "Aggiunta". Nell'editor SQL:

   ```sql
   update educatori set moderatore = true
   where nome in ('Nome Cognome', 'Nome Cognome');
   ```

Nota: le password sono salvate in chiaro nella tabella `educatori`.

## Struttura del progetto

```
src/
  lib/supabase.js              client Supabase
  context/AuthContext.jsx      login (nome e cognome + password), sessione "ricordami"
  pages/
    Login.jsx
    Home.jsx                   classi assegnate (o tutte, se moderatore)
    Classe.jsx                 firma individuale + calendario + gestione
    PresenzeEducatori.jsx
    PresenzeRagazzi.jsx
    Tematiche.jsx              il form si svuota dopo il salvataggio
    Ragazzi.jsx                elenco + aggiunta riservata ai moderatori
    Aggiunta.jsx               pannello moderatore
  components/
    CalendarioComune.jsx       titolo tematica cliccabile per la descrizione
    SectionHeader.jsx
  styles/tokens.css            design system (blu #7CAAC4 + toni)
supabase/
  setup.sql                    reset + schema + dati iniziali
```

## Build e pubblicazione (gratuita)

```bash
npm run build
```

Il risultato in `dist/` può essere pubblicato gratuitamente su **Vercel** o **Netlify**
collegando la repository GitHub del progetto: ricordati di impostare lì le stesse
variabili d'ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
