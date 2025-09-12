"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Wand2, Loader2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { adjustImageAspectRatio } from '@/ai/flows/image-aspect-ratio-adjustment';
import { fetchImageAsDataUrl } from '@/lib/actions';

interface AIImageAdjusterProps {
  imageUrl: string;
  onImageAdjusted: (newImageUrl: string) => void;
}

export function AIImageAdjuster({ imageUrl, onImageAdjusted }: AIImageAdjusterProps) {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [originalUrlData, setOriginalUrlData] = useState<string | null>(null);
  const [adjustedUrl, setAdjustedUrl] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setAdjustedUrl(null);
    setOriginalUrlData(null);
    setFetchError(null);
    
    if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('https'))) {
        const fetchPreview = async () => {
            setIsFetchingPreview(true);
            const result = await fetchImageAsDataUrl(imageUrl);
            if (result.success && result.dataUrl) {
                setOriginalUrlData(result.dataUrl);
            } else {
                setFetchError(result.error || "No se pudo cargar la vista previa.");
            }
            setIsFetchingPreview(false);
        };
        fetchPreview();
    } else if (imageUrl.startsWith('data:image')) {
        // It's already a data URL
        setOriginalUrlData(imageUrl);
    }
  }, [imageUrl]);

  const handleAdjust = async () => {
    if (!originalUrlData) {
        toast({
            variant: 'destructive',
            title: 'No hay imagen para ajustar',
            description: 'La URL de la imagen original no se pudo cargar. Comprueba la URL e inténtalo de nuevo.',
        });
        return;
    }
    setIsAdjusting(true);
    setAdjustedUrl(null);
    try {
      const result = await adjustImageAspectRatio({ imageUri: originalUrlData });
      
      if (result.adjustedImageUri) {
        setAdjustedUrl(result.adjustedImageUri);
        onImageAdjusted(result.adjustedImageUri);
        toast({
          title: 'Imagen Ajustada',
          description: 'La imagen ha sido ajustada a una proporción de 9:16.',
        });
      } else {
        throw new Error('El ajuste con IA no devolvió una imagen.');
      }

    } catch (error: any) {
      console.error('Error en el ajuste con IA:', error);
      toast({
        variant: 'destructive',
        title: 'Ajuste Fallido',
        description: error.message || 'No se pudo ajustar la imagen. Comprueba la URL e inténtalo de nuevo.',
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
      <h4 className="font-medium text-center text-sm">Opcional: Ajuste de imagen con IA</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
           <p className="text-xs font-medium text-center text-muted-foreground">Original</p>
           <div className="relative aspect-[9/16] w-full bg-muted/50 overflow-hidden rounded-md border">
              {isFetchingPreview && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>}
              {!isFetchingPreview && fetchError && <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-destructive p-2 text-center"><AlertTriangle className="h-6 w-6 mb-1" /><p>{fetchError}</p></div>}
              {!isFetchingPreview && originalUrlData && <Image src={originalUrlData} alt="Original" fill style={{ objectFit: 'contain' }} />}
              {!isFetchingPreview && !originalUrlData && !fetchError && <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-muted-foreground p-2 text-center"><ImageIcon className="h-6 w-6 mb-1" /><p>Vista Previa Original</p></div>}
            </div>
        </div>
        <div className="space-y-2">
            <p className="text-xs font-medium text-center text-muted-foreground">Vista Previa Ajustada</p>
            <div className="relative aspect-[9/16] w-full bg-muted/50 overflow-hidden rounded-md border">
              {isAdjusting && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}
              {!isAdjusting && !adjustedUrl && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">Vista previa tras el ajuste con IA</div>}
              {adjustedUrl && <Image src={adjustedUrl} alt="Ajustada" fill style={{ objectFit: 'contain' }} />}
            </div>
        </div>
      </div>
       <Button onClick={handleAdjust} disabled={isAdjusting || isFetchingPreview || !!fetchError || !originalUrlData} className="w-full" variant="secondary">
        {isAdjusting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ajustando...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Ajustar con IA a 9:16
          </>
        )}
      </Button>
      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-background rounded-md border">
        <AlertTriangle className="h-8 w-8 text-amber-500 mt-0.5 flex-shrink-0" />
        <p>
        La IA añade barras negras para ajustarse a la proporción 9:16, asegurando que ninguna parte de tu imagen se recorte en el visor. Si no usas esta opción, el visor recortará la imagen para llenar la pantalla.
        </p>
      </div>
    </div>
  );
}
