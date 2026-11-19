import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { InputSource } from "./types";

/** Query parameter for each input, kept from the original page so old links still open. */
const params: Record<InputSource, string> = { layout: "l", coordinates: "c", pixelblaze: "p" };

export function createShareLink(source: InputSource, text: string, location: Location = window.location): string {
  return `${location.origin}${location.pathname}?${params[source]}=${compressToEncodedURIComponent(text)}`;
}

/** The input in a shared link, if there is one. */
export function readShareLink(search: string): { source: InputSource; text: string } | undefined {
  const query = new URLSearchParams(search);
  for (const source of Object.keys(params) as InputSource[]) {
    const data = query.get(params[source]);
    if (!data) continue;
    // Links have always been LZ-compressed; an empty result means it was cut off or mangled.
    const text = decompressFromEncodedURIComponent(data);
    if (text) return { source, text };
  }
  return undefined;
}
