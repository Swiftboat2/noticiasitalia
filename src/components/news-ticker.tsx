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
  
  const tickerContent = items.map(item => `${item.text}`).join(" ••• ");

  return (
    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white overflow-hidden whitespace-nowrap z-10 flex items-center shadow-lg border-t-2 border-red-400/50 border-b-2 border-red-800/50">
      
      {/* Indicador URGENTE fijo */}
      <div className="flex-shrink-0 bg-red-800/80 h-full flex items-center px-3 shadow-md">
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="font-bold text-xs tracking-wider">URGENTE</span>
      </div>

      {/* Ticker animado */}
      <div className="relative flex-grow h-full overflow-hidden">
        <div 
          className="absolute inset-0 text-sm"
          style={{
            animation: `scroll-left ${items.length * 15}s linear infinite`,
          }}
        >
          <span className="inline-block h-full leading-8 px-8 text-shadow-md">
            {tickerContent}
          </span>
        </div>
        
        {/* Efecto de desvanecimiento a la derecha */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-red-600 to-transparent"></div>
        
        {/* Efecto de brillo animado */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full w-24 bg-white/20 -skew-x-12"
            style={{
              filter: 'blur(10px)',
              animation: 'shine 8s linear infinite'
            }}
          ></div>
        </div>

      </div>
      
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(calc(100vw + 100%));
          }
        }

        .text-shadow-md {
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
