"use client";

import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase/config';
import type { NewsItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from './ui/skeleton';

const CACHE_KEY = 'noticias_italia_cache';

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
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
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
      const cachedNews = localStorage.getItem(CACHE_KEY);
      if (cachedNews) {
        setNews(JSON.parse(cachedNews));
      }
      setLoading(false);
      return;
    }

    console.log("La aplicación está en línea. Obteniendo datos de Firestore.");
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newsData: NewsItem[] = [];
      querySnapshot.forEach((doc) => {
        newsData.push({ id: doc.id, ...doc.data() } as NewsItem);
      });
      // Filter for active news client-side to avoid composite index requirement
      const activeNews = newsData.filter(item => item.active);
      setNews(activeNews);
      localStorage.setItem(CACHE_KEY, JSON.stringify(activeNews));
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener noticias:", error);
      // Fallback to cache on error
      const cachedNews = localStorage.getItem(CACHE_KEY);
      if (cachedNews) {
        setNews(JSON.parse(cachedNews));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOffline]);

  useEffect(() => {
    if (!api || news.length === 0) return;

    const handleSelect = () => {
      const currentSlideIndex = api.selectedScrollSnap();
      const currentItem = news[currentSlideIndex];
      if (currentItem) {
        autoplay.current.options.delay = currentItem.duration * 1000;
        // The reset is needed for the new delay to take effect
        autoplay.current.reset();
      }
    };
    
    api.on("select", handleSelect);
    handleSelect(); // Set initial delay

    return () => {
      api.off("select", handleSelect);
    };

  }, [api, news]);
  
  const renderContent = (item: NewsItem) => {
    switch (item.type) {
      case 'image':
        return (
          <Image
            src={item.url}
            alt="Contenido de la noticia"
            fill
            sizes="100vw"
            className="object-cover"
            priority
            quality={100}
          />
        );
      case 'video':
        return (
           <iframe
            src={getYouTubeEmbedUrl(item.url)}
            title="Video de la noticia"
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms"
          ></iframe>
        );
      case 'text':
         return (
          <iframe
            src={item.url}
            title="Contenido de la noticia"
            className="w-full h-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          ></iframe>
        );
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
          <Carousel
            className="w-full h-full"
            setApi={setApi}
            plugins={[autoplay.current]}
            opts={{ loop: true }}
          >
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
      </div>
    </div>
  );
}
