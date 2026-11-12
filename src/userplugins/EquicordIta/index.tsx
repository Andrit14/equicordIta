import * as DataStore from "@api/DataStore";
import definePlugin, { PluginNative } from "@utils/types";

const Native = VencordNative.pluginHelpers.EquicordIta as PluginNative<typeof import("./native")>;

// Dizionario manuale "inglese -> italiano": ha la precedenza sulla traduzione automatica.
// Chiave = testo inglese identico. Per correggere una traduzione basta aggiungere una riga.
const DICT: Record<string, string> = {
    "Equicord Settings": "Impostazioni di Equicord",
    "Vencord Settings": "Impostazioni di Vencord",
    "Plugins": "Plugin",
    "Themes": "Temi",
    "Updater": "Aggiornamenti",
    "Backup & Restore": "Backup e ripristino",
    "Patch Helper": "Assistente patch",
    "Settings": "Impostazioni",
    "Quick Actions": "Azioni rapide",
    "Quick CSS": "CSS rapido",
    "QuickCSS": "CSS rapido",
    "Open QuickCSS File": "Apri il file CSS rapido",
    "Edit QuickCSS": "Modifica CSS rapido",
    "Notifications": "Notifiche",
    "Notification Settings": "Impostazioni notifiche",
    "Open Settings Folder": "Apri la cartella delle impostazioni",
    "Search for a plugin...": "Cerca un plugin...",
    "Search for a plugin": "Cerca un plugin",
    "Search": "Cerca",
    "Filters": "Filtri",
    "Show All": "Mostra tutti",
    "Show Enabled": "Mostra attivi",
    "Show Disabled": "Mostra disattivati",
    "Show New": "Mostra nuovi",
    "Required": "Obbligatorio",
    "Restart required": "Riavvio necessario",
    "Restart Required": "Riavvio necessario",
    "Needs restart": "Richiede il riavvio",
    "Check for Updates": "Controlla aggiornamenti",
    "Update All": "Aggiorna tutto",
    "Up to date!": "Aggiornato!",
    "Updates Available": "Aggiornamenti disponibili",
    "Enable": "Attiva",
    "Disable": "Disattiva",
    "Enabled": "Attivo",
    "Disabled": "Disattivato",
    "Reset": "Ripristina",
    "Reset to default": "Ripristina predefinito",
    "Restart": "Riavvia",
    "Restart Now": "Riavvia ora",
    "Later": "Più tardi",
    "Cancel": "Annulla",
    "Confirm": "Conferma",
    "Save": "Salva",
    "Save Changes": "Salva modifiche",
    "Apply": "Applica",
    "Close": "Chiudi",
    "Done": "Fatto",
    "Back": "Indietro",
    "Reload": "Ricarica",
    "Yes": "Sì",
    "Open": "Apri",
    "Copy": "Copia",
    "Delete": "Elimina",
    "Remove": "Rimuovi",
    "Import": "Importa",
    "Export": "Esporta",
};

// Pagine di Equicord: la traduzione automatica parte SOLO quando la scheda selezionata
// nel menu laterale è una di queste (così non invia a Google testi di altre impostazioni
// di Discord, come account o profilo). Aggiungi qui eventuali altre schede.
const SCHEDE_EQUICORD = [
    "Equicord", "Plugins", "Plugin", "Themes", "Temi", "Updater", "Aggiornamenti",
    "Changelog", "Cloud", "Backup & Restore", "Backup e ripristino",
    "Patch Helper", "Assistente patch",
];

const CACHE_KEY = "EquicordIta_cache";
const MAX_RICHIESTE = 3;

const DIZ = new Map(Object.entries(DICT));
const TRADOTTI = new Set(Object.values(DICT));
const cache = new Map<string, string>();
const inAttesa = new Map<string, Set<Text>>();
const falliti = new Set<string>();
const coda: string[] = [];
let attivi = 0;
let scope: boolean | null = null;
let observer: MutationObserver | null = null;
let timerRescan: ReturnType<typeof setTimeout> | undefined;
let timerSalva: ReturnType<typeof setTimeout> | undefined;

const SKIP_SELECTOR =
    "input, textarea, code, pre, script, style, [contenteditable='true'], [contenteditable=''], " +
    "[id^='message-content'], [class*='markup'], [class*='messageContent']";
const SETTINGS_SELECTOR =
    "[class*='standardSidebarView'], [class*='sidebarRegion'], [class*='contentRegion'], " +
    "[class*='settings' i], [class*='vc-']";
const ATTRS = ["placeholder", "aria-label", "title"];

const SELETTORE_SELEZIONATO =
    '[aria-selected="true"], [aria-current], [class*="selected" i], [class*="active" i]';

function schedeSelezionate(): string[] {
    const out: string[] = [];
    document.querySelectorAll(SELETTORE_SELEZIONATO).forEach(e => {
        const txt = (e.textContent ?? "").trim();
        if (txt && txt.length < 40) out.push(txt);
    });
    return out;
}

function paginaEquicordAttiva(): boolean {
    if (scope !== null) return scope;
    return (scope = schedeSelezionate().some(t => SCHEDE_EQUICORD.includes(t)));
}

function candidato(s: string) {
    return s.length >= 6 && s.length < 1500 && /\s/.test(s) && /[A-Za-z]{3,}/.test(s) && !/^https?:\/\//.test(s);
}

function applica(n: Text, originale: string, tr: string) {
    if (!n.isConnected) return;
    const v = n.nodeValue ?? "";
    if (v.trim() !== originale) return;
    n.nodeValue = v.replace(originale, tr);
}

function salvaCache() {
    clearTimeout(timerSalva);
    timerSalva = setTimeout(() => {
        DataStore.set(CACHE_KEY, Object.fromEntries(cache)).catch(() => { });
    }, 2000);
}

async function traduciRemoto(testo: string) {
    let tr: string | null = null;
    try { tr = await Native.traduci(testo); } catch { /* ignora */ }

    const nodi = inAttesa.get(testo);
    inAttesa.delete(testo);
    if (!tr || !tr.trim()) { falliti.add(testo); return; }

    cache.set(testo, tr);
    TRADOTTI.add(tr.trim());
    TRADOTTI.add(testo === tr.trim() ? testo : tr.trim());
    salvaCache();
    nodi?.forEach(n => applica(n, testo, tr!));
}

function avanza() {
    while (attivi < MAX_RICHIESTE && coda.length) {
        const testo = coda.shift()!;
        attivi++;
        traduciRemoto(testo).finally(() => { attivi--; avanza(); });
    }
}

function richiedi(testo: string, node: Text) {
    const set = inAttesa.get(testo);
    if (set) { set.add(node); return; }
    inAttesa.set(testo, new Set([node]));
    coda.push(testo);
    avanza();
}

function translateText(node: Text) {
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP_SELECTOR)) return;

    const value = node.nodeValue ?? "";
    const trimmed = value.trim();
    if (!trimmed || TRADOTTI.has(trimmed)) return;

    const dal = DIZ.get(trimmed);
    if (dal) { node.nodeValue = value.replace(trimmed, dal); return; }

    const incache = cache.get(trimmed);
    if (incache !== undefined) { applica(node, trimmed, incache); return; }

    if (!candidato(trimmed) || falliti.has(trimmed)) return;
    if (!parent.closest(SETTINGS_SELECTOR) || !paginaEquicordAttiva()) return;
    richiedi(trimmed, node);
}

function translateAttrs(el: Element) {
    for (const attr of ATTRS) {
        const v = el.getAttribute(attr);
        if (!v) continue;
        const tr = DIZ.get(v.trim());
        if (tr) el.setAttribute(attr, tr);
    }
}

function walk(root: Node) {
    if (root.nodeType === Node.TEXT_NODE) { translateText(root as Text); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const el = root as Element;
    translateAttrs(el);
    el.querySelectorAll("[placeholder], [aria-label], [title]").forEach(translateAttrs);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) translateText(n as Text);
}

function pianificaRescan() {
    clearTimeout(timerRescan);
    timerRescan = setTimeout(() => {
        scope = null;
        falliti.clear();
        walk(document.body);
    }, 150);
}

export default definePlugin({
    name: "EquicordIta",
    description: "Traduce in italiano l'interfaccia di Equicord (dizionario + traduzione automatica).",
    authors: [{ name: "Utente", id: 0n }],

    start() {
        DataStore.get(CACHE_KEY).then((salvata: Record<string, string> | undefined) => {
            if (salvata) for (const [k, v] of Object.entries(salvata)) { cache.set(k, v); TRADOTTI.add(v.trim()); }
        }).catch(() => { }).finally(() => { scope = null; walk(document.body); });

        observer = new MutationObserver(mutations => {
            scope = null;
            for (const m of mutations) {
                if (m.type === "childList") m.addedNodes.forEach(walk);
                else if (m.type === "characterData") walk(m.target);
                else if (m.type === "attributes" && m.target instanceof Element) {
                    if (m.attributeName === "aria-selected") pianificaRescan();
                    else translateAttrs(m.target);
                }
            }
        });
        observer.observe(document.body, {
            childList: true, subtree: true, characterData: true,
            attributes: true, attributeFilter: [...ATTRS, "aria-selected"],
        });

        // Diagnosi dalla console di Discord: ItaEquicordDiagnosi()
        (window as any).ItaEquicordDiagnosi = () => ({
            paginaEquicordAttiva: (scope = null, paginaEquicordAttiva()),
            areaImpostazioniTrovata: !!document.querySelector(SETTINGS_SELECTOR),
            schedeSelezionate: [...new Set(schedeSelezionate())],
            inCoda: coda.length,
            richiesteAttive: attivi,
            fallite: [...falliti].length,
            traduzioniInCache: cache.size,
        });
        (window as any).ItaEquicordSvuotaCache = () => { cache.clear(); DataStore.del(CACHE_KEY); };
    },

    stop() {
        observer?.disconnect();
        observer = null;
        clearTimeout(timerRescan);
        clearTimeout(timerSalva);
        delete (window as any).ItaEquicordDiagnosi;
        delete (window as any).ItaEquicordSvuotaCache;
    },
});
