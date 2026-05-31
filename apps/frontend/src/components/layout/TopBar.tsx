type TopBarProps = {
  clockLabel: string;
  connectionStatus: string;
};

export function TopBar({ clockLabel, connectionStatus }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">티마</div>
      <div className="clock">{clockLabel}</div>
      <div className={`status-pill status-${connectionStatus}`}>{connectionStatus}</div>
    </header>
  );
}
