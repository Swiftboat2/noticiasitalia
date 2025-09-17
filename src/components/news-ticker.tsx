"use client";

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { TickerMessage } from '@/types';

export function NewsTicker() {
  const [items, setItems] = useState<TickerMessage[]>([]);

  useEffect(() => {
    const q = query(collection(db, "tickerMessages"), orderBy("createdAt", "desc")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const urgentItems = snapshot.docs.map(doc => {
          if (doc) {
            return { id: doc.id, ...doc.data() } as TickerMessage;
          }
          return null;
      }).filter((item): item is TickerMessage => item !== null);
      
      setItems(urgentItems);
    });
    
    return () => unsubscribe();
  }, []);

  if (items.length === 0) {
    return null;
  }
  
  const tickerContent = items.map(item => `🚨 ${item.text}`).join(" ••• ");

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-lg overflow-hidden whitespace-nowrap z-10">
      <div className="ticker-container py-1">
        <div className="ticker-content">
          <span className="ticker-item">{tickerContent}</span>
        </div>
      </div>
      
      <style jsx>{`
        .ticker-container {
          width: 100%;
          position: relative;
        }
        
        .ticker-content {
          animation: scroll-left 25s linear infinite;
        }
        
        .ticker-item {
          display: inline-block;
          white-space: nowrap;
          padding-left: 100%;
        }
        
        @keyframes scroll-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        /* Pausar animación en hover para mejor UX */
        .ticker-container:hover .ticker-content {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
