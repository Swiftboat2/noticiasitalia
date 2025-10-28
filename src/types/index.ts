import type { Timestamp } from 'firebase/firestore';

// This type is used for data that has been serialized for Client Components
export type NewsArticle = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: Timestamp | string; // Can be a Timestamp from server or string after serialization
  isActive: boolean;
};

// Represents a user with a potential admin claim
export type AppUser = {
  uid: string;
  email: string | null;
  isAdmin: boolean;
};
