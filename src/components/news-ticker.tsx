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
  
  const tickerContent = [...items, ...items].map((item, index) => (
    <span key={`${item.id}-${index}`} className="ticker-item">
      🚨 {item.text}
    </span>
  ));

  return (
    <div className="w-64 h-full bg-gray-900 text-white text-xl font-bold overflow-hidden z-10 flex flex-col justify-center">
      <div className="ticker-container h-full relative">
        <div className="ticker-content absolute inset-0">
          {tickerContent}
        </div>
      </div>
      
      <style jsx>{`
        .ticker-container {
          mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
        }
        
        .ticker-content {
          animation: scroll-up 50s linear infinite;
          display: flex;
          flex-direction: column;
        }

        .ticker-item {
          padding: 1rem 0.5rem;
          text-align: center;
        }
        
        /* Pausar animación en hover para mejor UX */
        .ticker-container:hover .ticker-content {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
