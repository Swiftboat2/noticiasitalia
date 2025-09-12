"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase/config';
import type { NewsItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from './ui/skeleton';
import { NewsTicker } from './news-ticker';

const NEWS_CACHE_KEY = 'noticias_italia_cache';

const getYouTubeEmbedUrl = (url: string) => {
    let videoId;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1).split('?')[0];
        } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            if (urlObj.pathname === '/watch') {
                videoId = urlObj.searchParams.get('v');
            } else if (urlObj.pathname.startsWith('/embed/')) {
                const parts = urlObj.pathname.split('/');
                videoId = parts[2];
            }
        }
    } catch (e) {
      // Not a valid URL object
    }
    
    if (!videoId) {
        const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        videoId = (match && match[2].length === 11) ? match[2] : null;
    }

    if (videoId) {
        const params = new URLSearchParams({
            autoplay: '1',
            mute: '1',
            loop: '1',
            playlist: videoId, // Required for loop to work on single videos
            controls: '0',
            showinfo: '0',
            rel: '0',
            iv_load_policy: '3',
            modestbranding: '1',
        });
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }
    
    // Fallback for non-youtube video URLs or if parsing fails
    return url; 
};


export default function NewsViewer() {
  const [api, setApi] = useState<CarouselApi>();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    handleOnlineStatus();
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isOffline) {
      console.log("La aplicación está desconectada. Cargando desde la caché.");
      const cachedNews = localStorage.getItem(NEWS_CACHE_KEY);
      if (cachedNews) setNews(JSON.parse(cachedNews));
      setLoading(false);
      return;
    }

    console.log("La aplicación está en línea. Obteniendo datos de Firestore.");
    
    const newsQuery = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const newsUnsubscribe = onSnapshot(newsQuery, (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as NewsItem)
                                    .filter(item => item.active);
      setNews(newsData);
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(newsData));
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener noticias:", error);
      const cachedNews = localStorage.getItem(NEWS_CACHE_KEY);
      if (cachedNews) setNews(JSON.parse(cachedNews));
      setLoading(false);
    });

    return () => {
      newsUnsubscribe();
    };
  }, [isOffline]);

  // Logic for custom autoplay
  useEffect(() => {
    if (!api || news.length === 0) return;

    // Clear previous timer
    let timer: NodeJS.Timeout;

    // Function to start the timer for the next slide
    const startTimer = () => {
      const selectedIndex = api.selectedScrollSnap();
      const currentItem = news[selectedIndex];
      
      if (!currentItem) return;
      
      // Get duration, default to 10 seconds if not set
      const duration = (currentItem.duration || 10) * 1000;

      timer = setTimeout(() => {
        api.scrollNext();
      }, duration);
    };

    // Start the first timer
    startTimer();
    
    // Set up event listener for when a slide is selected
    const onSelect = () => {
      clearTimeout(timer); // Clear old timer
      startTimer(); // Start a new timer for the new slide
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    api.on("pointerDown", () => clearTimeout(timer)); // Stop timer on user interaction

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (api) {
        api.off("select", onSelect);
      }
    };
  }, [api, news]);
  
  const renderContent = (item: NewsItem) => {
    switch (item.type) {
      case 'image':
        return <Image src={item.url} alt="Contenido de la noticia" fill sizes="100vw" className="object-cover" priority quality={100}/>;
      case 'video':
        return <iframe src={getYouTubeEmbedUrl(item.url)} title="Video de la noticia" className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms"></iframe>;
      case 'text':
         return <iframe src={item.url} title="Contenido de la noticia" className="w-full h-full bg-white" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>;
      default:
        return <p className="text-white">Tipo de contenido no soportado</p>;
    }
  };

  return (
    <div className="flex justify-center items-center h-screen w-screen bg-black">
      <div className="relative w-full max-w-[calc(100vh*(9/16))] h-full aspect-9/16">
        {loading ? (
           <Skeleton className="w-full h-full bg-gray-800" />
        ) : news.length === 0 ? (
          <div className="flex items-center justify-center h-full w-full bg-gray-900">
            <p className="text-white text-2xl font-headline">No hay noticias activas.</p>
          </div>
        ) : (
          <Carousel className="w-full h-full" setApi={setApi} opts={{ loop: true }}>
            <CarouselContent className="h-full">
              {news.map((item) => (
                <CarouselItem key={item.id} className="h-full">
                  <Card className="w-full h-full border-0 bg-black rounded-none">
                    <CardContent className="relative flex aspect-9/16 h-full items-center justify-center p-0">
                      {renderContent(item)}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
         <NewsTicker />
      </div>
    </div>
  );
}
