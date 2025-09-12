"use client";

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { TickerMessage } from '@/types';

export function NewsTicker() {
  const [items, setItems] = useState<TickerMessage[]>([]);

  useEffect(() => {
    console.log('NewsTicker montado'); // Debug log
    
    const q = query(collection(db, "tickerMessages"), orderBy("createdAt", "desc")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const urgentItems = snapshot.docs.map(doc => {
          if (doc) {
            return { id: doc.id, ...doc.data() } as TickerMessage;
          }
          return null;
      }).filter((item): item is TickerMessage => item !== null);
      
      console.log('Ticker items actualizados:', urgentItems.length); // Debug log
      setItems(urgentItems);
    });
    
    return () => unsubscribe();
  }, []);

  if (items.length === 0) {
    return null;
  }
  
  const tickerContent = items.map(item => `🚨 ${item.text}`).join(" ••• ");

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-xl font-bold overflow-hidden whitespace-nowrap z-10">
      <div className="ticker-container py-2">
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
          display: flex;
          animation: scroll-left 30s linear infinite;
        }
        
        .ticker-item {
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        @keyframes scroll-left {
          0% {
            transform: translate3d(100%, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
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
