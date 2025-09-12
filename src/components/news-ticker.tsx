"use client";

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { TickerMessage } from '@/types';

export function NewsTicker() {
  const [items, setItems] = useState<TickerMessage[]>([]);

  useEffect(() => {
    const q = query(collection(db, "tickerMessages")); 
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
    <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-xl font-bold p-2 overflow-hidden whitespace-nowrap z-10">
      <div className="inline-block animate-marquee">
        <span className="mx-10">{tickerContent}</span>
      </div>
       <div className="inline-block animate-marquee" aria-hidden="true">
        <span className="mx-10">{tickerContent}</span>
      </div>
    </div>
  );
}
