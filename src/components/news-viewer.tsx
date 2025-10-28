
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase/config';
import type { NewsArticle } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from './ui/skeleton';
import { NewsTicker } from './news-ticker';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
    
    // For non-YouTube URLs, return null or the original URL if you want to handle it differently
    return null; 
};

export default function NewsViewer() {
  const [api, setApi] = useState<CarouselApi>();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
      const cachedNews = localStorage.getItem(NEWS_CACHE_KEY);
      if (cachedNews) setNews(JSON.parse(cachedNews));
      setLoading(false);
      return;
    }

    const newsQuery = query(collection(db, "news_articles"), where("isActive", "==", true), orderBy("createdAt", "desc"));
    const newsUnsubscribe = onSnapshot(newsQuery, (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as NewsArticle);
      setNews(newsData);
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(newsData));
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: 'news_articles',
            operation: 'list'
        });
        errorEmitter.emit('permission-error', permissionError);
      }
      const cachedNews = localStorage.getItem(NEWS_CACHE_KEY);
      if (cachedNews) setNews(JSON.parse(cachedNews));
      setLoading(false);
    });

    return () => {
      newsUnsubscribe();
    };
  }, [isOffline]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!api || news.length === 0) return;

    clearTimer();

    const selectedIndex = api.selectedScrollSnap();
    const currentItem = news[selectedIndex];
    
    if (!currentItem) return;
    
    // Placeholder for duration - you might want to add this to your NewsArticle model
    const duration = 10; // Default 10 seconds

    timerRef.current = setTimeout(() => {
      api.scrollNext();
    }, duration * 1000);
  }, [api, news, clearTimer]);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const newIndex = api.selectedScrollSnap();
      setCurrentSlide(newIndex);
      startTimer();
    };

    const onPointerDown = () => {
      clearTimer();
    };
    
    const onPointerUp = () => {
       setTimeout(() => {
        startTimer();
      }, 100);
    }

    api.on("select", onSelect);
    api.on("pointerDown", onPointerDown);
    api.on("pointerUp", onPointerUp);
    
    startTimer(); // Initial start

    return () => {
      clearTimer();
      api.off("select", onSelect);
      api.off("pointerDown", onPointerDown);
      api.off("pointerUp", onPointerUp);
    };
  }, [api, news, startTimer, clearTimer]);
  
  const renderContent = (item: NewsArticle, index: number) => {
    const isActive = index === currentSlide;

    if (item.imageUrl) {
        return <Image src={item.imageUrl} alt={item.title} fill sizes="100vw" className="object-cover" priority quality={100}/>;
    }

    if (item.videoUrl) {
        const embedUrl = getYouTubeEmbedUrl(item.videoUrl);
        return isActive && embedUrl ? <iframe src={embedUrl} title={item.title} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms"></iframe> : null;
    }

    // Fallback for text content or other types
    return (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center p-8">
            <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-4">{item.title}</h2>
                <p className="text-lg">{item.content}</p>
            </div>
        </div>
    );
  };

  return (
    <div className="flex justify-center items-center h-full w-full bg-black">
      <div className="relative w-full h-full">
        {loading ? (
           <Skeleton className="w-full h-full bg-gray-800" />
        ) : news.length === 0 ? (
          <div className="flex items-center justify-center h-full w-full bg-gray-900">
            <p className="text-white text-2xl font-headline">No hay noticias activas.</p>
          </div>
        ) : (
          <Carousel className="w-full h-full" setApi={setApi} opts={{ loop: true }}>
            <CarouselContent className="h-full">
              {news.map((item, index) => (
                <CarouselItem key={item.id} className="h-full">
                  <Card className="w-full h-full border-0 bg-black rounded-none">
                    <CardContent className="relative flex h-full items-center justify-center p-0">
                      {renderContent(item, index)}
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
