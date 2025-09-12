"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Wand2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { adjustImageAspectRatio } from '@/ai/flows/image-aspect-ratio-adjustment';
import { fetchImageAsDataUrl } from '@/lib/actions';

interface AIImageAdjusterProps {
  imageUrl: string;
  onImageAdjusted: (newImageUrl: string) => void;
}

export function AIImageAdjuster({ imageUrl, onImageAdjusted }: AIImageAdjusterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [adjustedUrl, setAdjustedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAdjust = async () => {
    setIsLoading(true);
    setAdjustedUrl(null);
    try {
      const fetchResult = await fetchImageAsDataUrl(imageUrl);
      if (!fetchResult.success || !fetchResult.dataUrl) {
        throw new Error(fetchResult.error || 'Failed to fetch image from URL.');
      }
      
      const result = await adjustImageAspectRatio({ imageUri: fetchResult.dataUrl });
      
      if (result.adjustedImageUri) {
        setAdjustedUrl(result.adjustedImageUri);
        onImageAdjusted(result.adjustedImageUri);
        toast({
          title: 'Image Adjusted',
          description: 'The image has been adjusted to a 9:16 aspect ratio.',
        });
      } else {
        throw new Error('AI adjustment failed to return an image.');
      }

    } catch (error: any) {
      console.error('AI Adjustment Error:', error);
      toast({
        variant: 'destructive',
        title: 'Adjustment Failed',
        description: error.message || 'Could not adjust the image. Check the URL and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset when the source URL changes
  useEffect(() => {
    setAdjustedUrl(null);
  }, [imageUrl]);

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
      <h4 className="font-medium text-center text-sm">Optional: AI Image Adjustment</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
           <p className="text-xs font-medium text-center text-muted-foreground">Original</p>
           <div className="relative aspect-[9/16] w-full bg-muted/50 overflow-hidden rounded-md border">
              <Image src={imageUrl} alt="Original" fill style={{ objectFit: 'contain' }} />
            </div>
        </div>
        <div className="space-y-2">
            <p className="text-xs font-medium text-center text-muted-foreground">Adjusted Preview</p>
            <div className="relative aspect-[9/16] w-full bg-muted/50 overflow-hidden rounded-md border">
              {isLoading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}
              {!isLoading && !adjustedUrl && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">Preview after AI adjustment</div>}
              {adjustedUrl && <Image src={adjustedUrl} alt="Adjusted" fill style={{ objectFit: 'contain' }} />}
            </div>
        </div>
      </div>
       <Button onClick={handleAdjust} disabled={isLoading} className="w-full" variant="secondary">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adjusting...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Adjust with AI to fit 9:16
          </>
        )}
      </Button>
      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-background rounded-md border">
        <AlertTriangle className="h-8 w-8 text-amber-500 mt-0.5 flex-shrink-0" />
        <p>
        The AI adds black bars to fit the 9:16 ratio, ensuring no part of your image gets cropped in the viewer. If you don't use this, the viewer will crop the image to fill the screen.
        </p>
      </div>
    </div>
  );
}
