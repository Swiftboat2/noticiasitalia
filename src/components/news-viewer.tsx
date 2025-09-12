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
                videoId = urlObj.pathname.split('/')[2];
            } else if (urlObj.pathname.startsWith('/shorts/')) {
                videoId = urlObj.pathname.split('/')[2];
            }
        }
    } catch (e) {
      // Not a valid URL object
    }
    
    if (!videoId) {
        const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/);
        videoId = (match && match[2].length === 11) ? match[2] : null;
    }

    if (videoId) {
        const params = new URLSearchParams({
            autoplay: '1',
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // This check is important to avoid SSR errors
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);
        handleOnlineStatus();
        return () => {
          window.removeEventListener('online', handleOnlineStatus);
          window.removeEventListener('offline', handleOnlineStatus);
        };
    }
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

  // Función para limpiar el timer existente
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Función para iniciar un nuevo timer
  const startTimer = useCallback(() => {
    if (!api || news.length === 0) return;

    clearTimer(); // Limpiar timer existente

    const selectedIndex = api.selectedScrollSnap();
    const currentItem = news[selectedIndex];
    
    if (!currentItem) return;
    
    // Obtener duración de la configuración del item, con fallback a 10 segundos
    let duration = 10; // valor por defecto
    
    if (currentItem.duration && typeof currentItem.duration === 'number' && currentItem.duration > 0) {
      duration = currentItem.duration;
    }
    
    console.log(`Timer iniciado para slide ${selectedIndex} con duración: ${duration} segundos`);

    timerRef.current = setTimeout(() => {
      if (api) {
        api.scrollNext();
      }
    }, duration * 1000);
  }, [api, news, clearTimer]);

  // Logic for custom autoplay
  useEffect(() => {
    if (!api || news.length === 0) return;

    // Iniciar el primer timer
    startTimer();
    
    // Event listener para cuando se selecciona un slide
    const onSelect = () => {
      const newIndex = api.selectedScrollSnap();
      console.log(`Slide cambiado a: ${newIndex}`);
      setCurrentSlide(newIndex);
      startTimer(); // Iniciar nuevo timer para el nuevo slide
    };

    // Event listener para detener el timer en interacción del usuario
    const onPointerDown = () => {
      console.log('Usuario interactuó - deteniendo timer');
      clearTimer();
    };

    // Event listener para reanudar el timer después de la interacción
    const onPointerUp = () => {
      console.log('Usuario terminó interacción - reanudando timer');
      // Pequeño delay para permitir que la transición termine
      setTimeout(() => {
        startTimer();
      }, 100);
    };

    api.on("select", onSelect);
    api.on("pointerDown", onPointerDown);
    api.on("pointerUp", onPointerUp);

    // Cleanup
    return () => {
      clearTimer();
      if (api) {
        api.off("select", onSelect);
        api.off("pointerDown", onPointerDown);
        api.off("pointerUp", onPointerUp);
      }
    };
  }, [api, news, startTimer, clearTimer]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);
  
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
