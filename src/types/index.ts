import type { Timestamp } from 'firebase/firestore';

// This type is used for data coming directly from Firestore Server-side
export type NewsItemDB = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'text';
  active: boolean;
  createdAt: Timestamp;
  duration: number;
};


// This type is used for data that has been serialized for Client Components
export type NewsItem = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'text';
  active: boolean;
  createdAt: string; // Changed from Timestamp
  duration: number;
};

// This type is used for data that has been serialized for Client Components
export type TickerMessage = {
  id: string;
  text: string;
  createdAt: string; // Changed from Timestamp
};
