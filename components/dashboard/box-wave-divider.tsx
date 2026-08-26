export default function BoxWaveDivider() {
  return (
    <div className="box-wave-section" aria-hidden="true">
      <div className="box-wave">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className="box-wave-item" />
        ))}
      </div>
    </div>
  );
}
