import { IpcMainInvokeEvent } from "electron";

// Gira nel processo principale di Discord, così non ci sono blocchi di rete (CSP).
export async function traduci(_: IpcMainInvokeEvent, testo: string): Promise<string | null> {
    try {
        const url =
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=it&dt=t&q=" +
            encodeURIComponent(testo);
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return (data[0] as any[]).map(p => p[0]).join("");
    } catch {
        return null;
    }
}
