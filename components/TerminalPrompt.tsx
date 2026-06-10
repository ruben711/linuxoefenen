/** De bash-prompt: student@bashacademy:~/pad$ — met de juiste kleuren. */
export default function TerminalPrompt({
  user = "student",
  host = "bashacademy",
  path = "~",
  root = false,
}: {
  user?: string;
  host?: string;
  path?: string;
  root?: boolean;
}) {
  return (
    <span className="select-none whitespace-pre">
      <span style={{ color: root ? "rgb(var(--t-err))" : "rgb(var(--t-cmd))" }}>{user}@{host}</span>
      <span style={{ color: "rgb(var(--term-fg) / 0.6)" }}>:</span>
      <span style={{ color: "rgb(var(--t-path))" }}>{path}</span>
      <span style={{ color: "rgb(var(--term-fg) / 0.85)" }}>{root ? "# " : "$ "}</span>
    </span>
  );
}
