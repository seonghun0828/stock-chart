type TopBarProps = {
  marketStatusLabel: string;
  connectionStatusLabel: string;
  connectionStatusTone: string;
};

export function TopBar({
  marketStatusLabel,
  connectionStatusLabel,
  connectionStatusTone,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">티마</div>
      <div className="status-group">
        <div className="status-pill status-market">{marketStatusLabel}</div>
        <div className={`status-pill status-${connectionStatusTone}`}>{connectionStatusLabel}</div>
      </div>
    </header>
  );
}
