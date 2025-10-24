"use client";

import { useRef, useCallback } from 'react';
import NewsViewer from "@/components/news-viewer";
import { Maximize } from 'lucide-react';

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mainRef.current?.requestFullscreen();
    }
  }, []);

  return (
     <main ref={mainRef} className="bg-black overflow-hidden relative h-screen w-screen">
       <button 
        onClick={handleFullscreen}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/30 text-white opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Toggle fullscreen"
      >
        <Maximize className="w-6 h-6" />
      </button>
        <NewsViewer />
    </main>
  );
}
