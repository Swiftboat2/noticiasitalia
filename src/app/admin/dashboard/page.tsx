import Dashboard from "@/components/admin/dashboard";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { NewsItem, TickerMessage } from "@/types";

async function getNews() {
  const newsCollection = collection(db, "news");
  const q = query(newsCollection, orderBy("createdAt", "desc"));
  const newsSnapshot = await getDocs(q);
  const newsList = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsItem[];
  return newsList;
}

async function getTickerMessages() {
  const tickerCollection = collection(db, "tickerMessages");
  const q = query(tickerCollection, orderBy("createdAt", "desc"));
  const tickerSnapshot = await getDocs(q);
  const tickerList = tickerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TickerMessage[];
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
