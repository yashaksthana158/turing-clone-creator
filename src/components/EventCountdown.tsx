import { useState, useEffect } from "react";

interface EventCountdownProps {
  targetDate: string;
  compact?: boolean;
}

export function EventCountdown({ targetDate, compact = false }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.expired) {
    return <span className="text-xs text-gray-400 italic">Event has started</span>;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-mono">
        <span className="bg-[#9113ff]/20 text-[#9113ff] px-1.5 py-0.5 rounded">{timeLeft.days}d</span>
        <span className="bg-[#9113ff]/20 text-[#9113ff] px-1.5 py-0.5 rounded">{timeLeft.hours}h</span>
        <span className="bg-[#9113ff]/20 text-[#9113ff] px-1.5 py-0.5 rounded">{timeLeft.minutes}m</span>
      </div>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-2">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <span className="bg-[#9113ff]/20 border border-[#9113ff]/30 text-white text-sm font-bold px-2.5 py-1.5 rounded-lg min-w-[40px] text-center font-mono">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
