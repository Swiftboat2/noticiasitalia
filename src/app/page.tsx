import NewsViewer from "@/components/news-viewer";

export default function Home() {
  return (
    <main className="bg-black overflow-hidden">
      <div className="h-screen w-screen origin-center rotate-90 scale-[1.77]">
        <NewsViewer />
      </div>
    </main>
  );
}
