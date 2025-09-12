"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { NewsItem } from "@/types";
import { AIImageAdjuster } from "./ai-image-adjuster";
import { useEffect, useState } from "react";

interface NewsFormProps {
  newsItem?: NewsItem | null;
  onSubmit: (formData: FormData) => Promise<any>;
  onUpdate: (id: string, data: Partial<NewsItem>) => Promise<any>;
  onFinished: () => void;
}

const formSchema = z.object({
  url: z.string().min(1, { message: "La URL no puede estar vacía." }),
  type: z.enum(["image", "video", "text"], { required_error: "Por favor, selecciona un tipo." }),
  duration: z.coerce.number().min(1, { message: "La duración debe ser de al menos 1 segundo." }),
  active: z.boolean().default(true),
  tickerText: z.string().optional(),
});

const isHttpUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

export function NewsForm({ newsItem, onSubmit, onUpdate, onFinished }: NewsFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: newsItem?.url ?? "",
      type: newsItem?.type ?? "image",
      duration: newsItem?.duration ?? 10,
      active: newsItem?.active ?? true,
      tickerText: newsItem?.tickerText ?? "",
    },
  });

  const watchedType = form.watch("type");
  const watchedUrl = form.watch("url");
  const [showAiAdjuster, setShowAiAdjuster] = useState(false);

  useEffect(() => {
    // Only show adjuster for http/https URLs, not for data URIs
    if (watchedType === 'image' && isHttpUrl(watchedUrl)) {
      setShowAiAdjuster(true);
    } else {
      setShowAiAdjuster(false);
    }
  }, [watchedType, watchedUrl]);

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    if (newsItem) {
      // Update existing item
      const result = await onUpdate(newsItem.id, values);
      if (result.success) {
        toast({ title: "Éxito", description: "Noticia actualizada." });
        onFinished();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } else {
      // Create new item
      const formData = new FormData();
      formData.append('url', values.url);
      formData.append('type', values.type);
      formData.append('duration', String(values.duration));
      formData.append('active', values.active ? 'on' : 'off');
      if (values.tickerText) {
        formData.append('tickerText', values.tickerText);
      }
      
      const result = await onSubmit(formData);
      if (result.success) {
        toast({ title: "Éxito", description: "Noticia creada." });
        onFinished();
      } else {
         toast({
          variant: "destructive",
          title: "Error al Crear Noticia",
          description: result.error || "Ha ocurrido un error desconocido.",
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de contenido" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="image">Imagen</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Texto/Sitio Web</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showAiAdjuster && (
          <AIImageAdjuster
            imageUrl={watchedUrl}
            onImageAdjusted={(newUrl) => {
              form.setValue('url', newUrl, { shouldValidate: true, shouldDirty: true });
            }}
          />
        )}

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración (segundos)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="tickerText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto del Ticker (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Escribe un texto corto para el ticker de noticias urgentes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
              <div className="space-y-0.5">
                <FormLabel>Activa</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
            {form.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </Form>
  );
}
