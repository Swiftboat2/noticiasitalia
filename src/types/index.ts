import type { Timestamp } from 'firebase/firestore';

export type NewsItem = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'text';
  active: boolean;
  createdAt: Timestamp;
  duration: number;
  tickerText?: string;
};
