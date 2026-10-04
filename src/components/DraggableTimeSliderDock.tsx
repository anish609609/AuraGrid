import React, { useState, useRef, useEffect } from 'react';
import { GripHorizontal, RotateCcw } from 'lucide-react';
import { TimeSlider } from './TimeSlider';
import { EnvironmentState } from '../types/city';

interface DraggableTimeSliderDockProps {
  currentHour: number;
  environment: EnvironmentState;
  onChangeHour: (hour: number) => void;
}

export const DraggableTimeSliderDock: React.FC<DraggableTimeSliderDockProps> = ({
  currentHour,
  environment,
  onChangeHour,
}) => {
  const dockRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with left mouse button / single touch
    if (e.button !== 0) return;
    if (!dockRef.current) return;

    const rect = dockRef.current.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: rect.left,
      startY: rect.top,
    };

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dockRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const rect = dockRef.current.getBoundingClientRect();
    const dockWidth = rect.width;
    const dockHeight = rect.height;

    // Viewport boundaries clamping
    const isMobile = window.innerWidth < 768;
    const minX = 8;
    const maxX = window.innerWidth - dockWidth - 8;
    const minY = isMobile ? 60 : 72; // below top header
    const maxY = window.innerHeight - dockHeight - (isMobile ? 76 : 16); // above mobile bottom bar

    const nextX = Math.max(minX, Math.min(maxX, dragStartRef.current.startX + deltaX));
    const nextY = Math.max(minY, Math.min(maxY, dragStartRef.current.startY + deltaY));

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // pointer capture already released
      }
    }
  };

  const handleResetToBottom = () => {
    setPosition(null);
  };

  // Adjust on window resize to ensure dock doesn't fall off screen
  useEffect(() => {
    const handleResize = () => {
      if (position && dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        const minX = 8;
        const maxX = window.innerWidth - rect.width - 8;
        const minY = isMobile ? 60 : 72;
        const maxY = window.innerHeight - rect.height - (isMobile ? 76 : 16);

        setPosition((prev) => {
          if (!prev) return null;
          return {
            x: Math.max(minX, Math.min(maxX, prev.x)),
            y: Math.max(minY, Math.min(maxY, prev.y)),
          };
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none',
      }
    : {
        position: 'fixed',
        bottom: isMobile ? '72px' : '24px',
        left: '50%',
        transform: 'translateX(-50%)',
      };

  return (
    <div
      ref={dockRef}
      style={style}
      className={`z-30 select-none transition-shadow max-w-[calc(100vw-16px)] ${
        isDragging ? 'shadow-2xl shadow-cyan-500/20 cursor-grabbing ring-1 ring-cyan-400/50' : ''
      }`}
    >
      <div className="flex items-center bg-slate-950/95 border border-slate-800/90 rounded-2xl backdrop-blur-xl shadow-2xl p-1 gap-1">
        {/* Drag Handle with Grip Icon */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex flex-col items-center justify-center px-1 sm:px-1.5 py-2.5 sm:py-3 rounded-xl transition-colors touch-none ${
            isDragging
              ? 'bg-cyan-500/20 text-cyan-300 cursor-grabbing'
              : 'hover:bg-slate-800/80 text-slate-500 hover:text-slate-300 cursor-grab active:bg-slate-800'
          }`}
          title="Drag to position timeline dock anywhere"
        >
          <GripHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>

        {/* Time Slider Component */}
        <TimeSlider
          currentHour={currentHour}
          environment={environment}
          onChangeHour={onChangeHour}
        />

        {/* Snap to Bottom Button (only visible when user has moved dock) */}
        {position !== null && (
          <button
            onClick={handleResetToBottom}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-colors ml-0.5"
            title="Snap dock back to bottom center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
