/** Splitst tekst in regels, een enkele afsluitende newline negerend. */
export function toLines(content: string): string[] {
  const a = content.split("\n");
  if (a.length && a[a.length - 1] === "") a.pop();
  return a;
}
