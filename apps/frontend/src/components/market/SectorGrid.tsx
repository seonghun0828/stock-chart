import type { SectorViewModel } from '../../types';
import { SectorCard } from './SectorCard';

type SectorGridProps = {
  sectors: SectorViewModel[];
};

export function SectorGrid({ sectors }: SectorGridProps) {
  return (
    <section className="sector-grid" aria-label="market sectors">
      {sectors.map((sector) => (
        <SectorCard key={sector.id} sector={sector} />
      ))}
    </section>
  );
}
