import Dashboard from "@/components/admin/dashboard";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { NewsItem } from "@/types";

async function getNews() {
  const newsCollection = collection(db, "news");
  const q = query(newsCollection, orderBy("createdAt", "desc"));
  const newsSnapshot = await getDocs(q);
  const newsList = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsItem[];
  return newsList;
}

export default async function DashboardPage() {
  const initialNews = await getNews();
  
  return (
      <Dashboard initialNews={initialNews} />
  );
}

// Enforce dynamic rendering
export const revalidate = 0;
