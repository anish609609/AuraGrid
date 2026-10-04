import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

export interface EducationalTooltipProps {
  term: 'peakDemand' | 'gridUtilization' | 'flexibleLoad' | 'criticalLoad' | 'estimatedCost' | 'hvacSetpoint' | 'demandCharge';
  children?: React.ReactNode;
}

const DEFINITIONS: Record<EducationalTooltipProps['term'], { title: string; explanation: string }> = {
  peakDemand: {
    title: 'Peak Demand (kW / MW)',
    explanation:
      'The highest instantaneous electrical power drawn from the grid during the billing period. Utilities size infrastructure to handle this maximum spike and charge steep demand penalties for it.',
  },
  gridUtilization: {
    title: 'Grid Utilization (%)',
    explanation:
      'The percentage of rated transformer and distribution line capacity currently in active use. Operating above 85% causes thermal stress, voltage drop, and heightened blackout risks.',
  },
  flexibleLoad: {
    title: 'Flexible / Curtailable Load',
    explanation:
      'Electricity consumption that can be deferred, reduced, or shifted without compromising core safety or critical business operations (e.g. pre-cooling, non-essential lighting, EV charging).',
  },
  criticalLoad: {
    title: 'Protected Critical Load',
    explanation:
      'Mission-critical electrical systems that must never be curtailed under any circumstance, such as ICU life support, surgical suites, and server core infrastructure.',
  },
  estimatedCost: {
    title: 'Simulated Electricity Cost',
    explanation:
      'Estimated billing calculated by combining actual energy consumed (kWh × rate) with peak demand penalties (kW × demand charge) over the selected billing period.',
  },
  hvacSetpoint: {
    title: 'HVAC Thermal Setpoint',
    explanation:
      'Target indoor thermostat temperature. Raising the setpoint by 1°C in tropical climates typically delivers a 7% to 9% reduction in daily chiller energy consumption.',
  },
  demandCharge: {
    title: 'Demand Charge (₹ / kW)',
    explanation:
      'A recurring utility fee based on the single highest 15-minute power demand peak recorded in the billing cycle, incentivizing facilities to flatten their load curve.',
  },
};

export const EducationalTooltip: React.FC<EducationalTooltipProps> = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; placeDown: boolean }>({
    left: 0,
    placeDown: false,
  });

  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const def = DEFINITIONS[term];

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const tooltipWidth = 280;

    // Smart vertical placement: if button is near top of viewport (< 180px), open downwards
    const placeDown = rect.top < 180;

    // Clamped horizontal center
    const idealLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const clampedLeft = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, idealLeft));

    if (placeDown) {
      setCoords({
        top: rect.bottom + 8,
        left: clampedLeft,
        placeDown: true,
      });
    } else {
      setCoords({
        bottom: window.innerHeight - rect.top + 8,
        left: clampedLeft,
        placeDown: false,
      });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  // Close on outside click or scroll
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDownOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDownOutside);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('pointerdown', onPointerDownOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <span className="relative inline-flex items-center gap-1 group">
      {children}
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleToggle}
        className="p-0.5 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none rounded hover:bg-slate-800/60"
        aria-label={`Learn about ${def.title}`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          className="fixed w-72 p-3.5 bg-slate-900/98 border border-cyan-500/50 rounded-xl shadow-2xl backdrop-blur-xl z-[9999] text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          style={{
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            left: `${coords.left}px`,
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="text-xs font-bold text-cyan-300 font-sans tracking-wide">
              {def.title}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-200 font-sans">
            {def.explanation}
          </p>
        </div>
      )}
    </span>
  );
};
