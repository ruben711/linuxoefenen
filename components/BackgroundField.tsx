/** Geanimeerde aurora-mesh + film-grain, één keer gemount achter alle content.
 *  Volledig CSS/GPU (transform/opacity) → 60fps, geen JS-kost. */
export default function BackgroundField() {
  return (
    <div className="bg-field" aria-hidden="true">
      <div className="bg-field__blob b1" />
      <div className="bg-field__blob b2" />
      <div className="bg-field__blob b3" />
      <div className="bg-field__grain" />
    </div>
  );
}
