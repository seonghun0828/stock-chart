type BottomTickerProps = {
  lastUpdatedAt: string;
};

export function BottomTicker({ lastUpdatedAt }: BottomTickerProps) {
  return (
    <footer className="bottom-ticker">
      <div className="ticker-line">
        마지막 갱신 <strong>{lastUpdatedAt}</strong>
      </div>
      <nav className="bottom-tabs" aria-label="sections">
        <span className="bottom-tab bottom-tab-active">마켓중심</span>
        <span className="bottom-tab">NXT</span>
        <span className="bottom-tab">마켓일정</span>
        <span className="bottom-tab">F존</span>
        <span className="bottom-tab">시장종합</span>
      </nav>
    </footer>
  );
}
