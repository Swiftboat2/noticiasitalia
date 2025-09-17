import NewsViewer from "@/components/news-viewer";
import { NewsTicker } from "@/components/news-ticker";

export default function Home() {
  return (
    <main className="bg-black flex h-screen w-screen overflow-hidden">
      <div className="flex-grow h-full w-full">
        <NewsViewer />
      </div>
      <NewsTicker />
    </main>
  );
}
