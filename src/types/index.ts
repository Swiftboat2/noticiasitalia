import type { Timestamp } from 'firebase/firestore';

export type NewsItem = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'text';
  active: boolean;
  createdAt: Timestamp;
  duration: number;
};

export type TickerMessage = {
  id: string;
  text: string;
  createdAt: Timestamp;
};
