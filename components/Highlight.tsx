import { tokenizeBash } from "@/lib/bashHighlight";

/** Rendert een bash-regel met gekleurde tokens (voor de terminal-overlay). */
export default function Highlight({ text }: { text: string }) {
  return (
    <>
      {tokenizeBash(text).map((tk, i) => (
        <span key={i} className={`tok-${tk.t}`}>{tk.v}</span>
      ))}
    </>
  );
}
