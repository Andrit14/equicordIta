# Tutorial: come usare EquicordIta

Questo tutorial spiega come installare, configurare e mantenere il plugin EquicordIta, così da avere l’interfaccia di Equicord in italiano.

## 1. Cos’è EquicordIta

EquicordIta è un plugin per Equicord che:

- traduce i menu e le voci dell’interfaccia in italiano;
- usa un dizionario manuale per correggere le frasi più importanti;
- usa una traduzione automatica come fallback;
- salva le traduzioni in cache per velocizzare la prossima apertura.

## 2. File principali

Nel repository troverai due file principali:

- `index.tsx`: contiene la logica del plugin, il dizionario e la scansione dell’interfaccia.
- `native.ts`: contiene la chiamata a Google Translate nel processo principale di Discord.

## 3. Installazione

### Opzione A — da URL raw GitHub

1. Apri la schermata delle impostazioni di Equicord.
2. Cerca la sezione delle estensioni o dei plugin personalizzati.
3. Se disponibile, scegli “Installa da URL” o “Aggiungi user plugin”.
4. Incolla questo link:

```text
https://raw.githubusercontent.com/Andrit14/equicordIta/main/index.tsx
```

5. Conferma l’installazione.
6. Riavvia Equicord se richiesto.

### Opzione B — clonando il repository

Se preferisci lavorare localmente:

```bash
git clone https://github.com/Andrit14/equicordIta.git
cd equicordIta
```

Poi apri i file e modifica il codice come preferisci.

## 4. Come aggiungere o correggere le traduzioni

Il cuore del plugin è il dizionario `DICT` dentro `index.tsx`.

Esempio:

```ts
const DICT: Record<string, string> = {
    "Plugins": "Plugin",
    "Themes": "Temi",
    "Updater": "Aggiornamenti",
};
```

Se una parola viene tradotta male, basta aggiungere una riga con la coppia:

```ts
"Testo originale": "Traduzione corretta",
```

Questa voce ha priorità su qualsiasi traduzione automatica.

## 5. Come funziona la traduzione

Il plugin verifica se l’utente si trova dentro Equicord e non in altre sezioni di Discord.

La logica è questa:

1. cerca il testo in `DICT`;
2. se non lo trova, controlla la cache locale;
3. se non trova neanche lì, richiede la traduzione al backend;
4. salva il risultato in cache per non rifare la richiesta.

## 6. Come aggiornare il dizionario

Puoi aggiungere nuove coppie di traduzioni senza toccare la logica del plugin.

Esempio di aggiunta utile:

```ts
"Backup & Restore": "Backup e ripristino",
"Patch Helper": "Assistente patch",
"Quick Actions": "Azioni rapide",
```

Più parole aggiungi al dizionario, più l’interfaccia risulterà naturale e coerente.

## 7. Come risolvere problemi

### La traduzione non appare

- controlla che il plugin sia attivo;
- verifica che tu sia nella sezione giusta di Equicord;
- riavvia Equicord;
- controlla che il testo sia davvero nell’interfaccia e non in un campo escluso.

### Una frase è male tradotta

Aggiungila manualmente nel `DICT`.

### La cache non si aggiorna

Puoi svuotare la cache con la funzione globale che è stata esposta dal plugin:

```js
ItaEquicordSvuotaCache()
```

## 8. Diagnosi rapida

Il plugin espone anche una funzione diagnostica:

```js
ItaEquicordDiagnosi()
```

Questa funzione mostra informazioni utili come:

- se sei dentro Equicord;
- quali schede sono attive;
- quante richieste sono in coda;
- quante traduzioni sono in cache.

## 9. Suggerimenti utili

- Mantieni il dizionario ordinato e leggibile.
- Aggiungi le frasi appena si vedono in modo da migliorare la qualità della traduzione.
- Usa una versione stabile del plugin prima di pubblicare una release finale.

## 10. Prossimi passi

Quando vuoi preparare una nuova pubblicazione:

1. verifica che il plugin funzioni correttamente;
2. aggiorna il dizionario con le ultime correzioni;
3. prepara una release GitHub con un tag come `v1.0.0`;
4. inserisci una breve descrizione dell’ultima versione;
5. condividi il link raw del file `index.tsx` per installazione rapida.

## 11. Esempio di descrizione per la release

```text
EquicordIta v1.0.0

- traduzione iniziale dell'interfaccia di Equicord in italiano;
- dizionario manuale con priorità sulle traduzioni automatiche;
- supporto per menu, temi, aggiornamenti e altre sezioni di configurazione;
- cache locale per migliorare prestazioni e ridurre richieste ripetute.
```

## Conclusione

EquicordIta è un plugin semplice, utile e facilmente personalizzabile. Con il dizionario corretto, puoi avere un’interfaccia di Equicord molto più naturale in italiano senza disturbare i contenuti normali di Discord.

Se vuoi, nel prossimo passaggio posso anche prepararti:
- una `CHANGELOG.md`;
- una `LICENSE`;
- una release note pronta da copiare su GitHub;
- oppure un README più “profesionale” con logo, screenshots e badge.
