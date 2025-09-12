import Dashboard from "@/components/admin/dashboard";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { NewsItem, TickerMessage } from "@/types";

// Helper to serialize Firestore Timestamps
const serializeData = (doc: any) => {
  const data = doc.data();
  const id = doc.id;
  const serializedData: { [key: string]: any } = { id };
  for (const key in data) {
    if (data[key] && typeof data[key].toDate === 'function') {
      serializedData[key] = data[key].toDate().toISOString();
    } else {
      serializedData[key] = data[key];
    }
  }
  return serializedData;
};


async function getNews() {
  const newsCollection = collection(db, "news");
  const q = query(newsCollection, orderBy("createdAt", "desc"));
  const newsSnapshot = await getDocs(q);
  const newsList = newsSnapshot.docs.map(serializeData) as NewsItem[];
  return newsList;
}

async function getTickerMessages() {
  const tickerCollection = collection(db, "tickerMessages");
  const q = query(tickerCollection, orderBy("createdAt", "desc"));
  const tickerSnapshot = await getDocs(q);
  const tickerList = tickerSnapshot.docs.map(serializeData) as TickerMessage[];
  return tickerList;
}

export default async function DashboardPage() {
  const initialNews = await getNews();
  const initialTickerMessages = await getTickerMessages();
  
  return (
      <Dashboard initialNews={initialNews} initialTickerMessages={initialTickerMessages} />
  );
}

// Enforce dynamic rendering
export const revalidate = 0;
