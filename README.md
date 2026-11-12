# EquicordIta

Plugin per [Equicord](https://github.com/Equicord/Equicord) che traduce in italiano l'interfaccia di Equicord.

## Funzionalità

- Dizionario manuale inglese → italiano (`DICT` in `index.tsx`), sempre prioritario e facile da correggere.
- Traduzione automatica (Google Translate) delle descrizioni dei plugin e delle pagine di Equicord: Plugin, Temi, Aggiornamenti, Changelog, Cloud, Backup e ripristino, Assistente patch.
- Cache locale: dopo la prima apertura le traduzioni sono immediate.
- Non tocca i messaggi di chat né i campi di testo.

## Installazione

Richiede Git, Node.js e pnpm, con il sorgente di Equicord.

1. Copia la cartella `equicordIta` in `src/userplugins/`.
2. Esegui `pnpm build`, poi `pnpm inject`.
3. Riavvia Discord e attiva **EquicordIta** da Impostazioni > Equicord > Plugin.

## Privacy

La traduzione automatica parte solo quando è selezionata una scheda di Equicord. Vengono inviati a Google Translate solo i testi di quelle pagine, mai messaggi o dati dell'account.

## Note

- I nomi dei plugin restano in inglese.
- Dalla console: `ItaEquicordDiagnosi()` per la diagnosi, `ItaEquicordSvuotaCache()` per azzerare la cache.
- Se aggiungi schede personalizzate, inserisci il loro nome in `SCHEDE_EQUICORD`.
