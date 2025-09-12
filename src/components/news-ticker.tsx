"use client";

import { NewsItem } from "@/types";

interface NewsTickerProps {
  items: NewsItem[];
}

export function NewsTicker({ items }: NewsTickerProps) {
  const tickerItems = items.filter(item => item.tickerText && item.tickerText.trim() !== '');

  if (tickerItems.length === 0) {
    return null;
  }

  const tickerText = tickerItems.map(item => item.tickerText).join(" ••• ");

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-primary/90 text-primary-foreground backdrop-blur-sm overflow-hidden z-10">
      <div className="flex items-center h-full">
         <div className="bg-accent text-accent-foreground font-bold text-sm px-4 h-full flex items-center shrink-0">
          URGENTE
        </div>
        <div className="relative flex-1 h-full overflow-hidden">
            <div className="animate-ticker absolute whitespace-nowrap h-full flex items-center">
                <span className="text-lg font-semibold px-8">{tickerText}</span>
                <span className="text-lg font-semibold px-8">{tickerText}</span>
            </div>
        </div>
      </div>
    </div>
  );
}
