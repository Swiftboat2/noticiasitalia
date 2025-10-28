
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
import { useToast } from "@/hooks/use-toast";
import type { NewsArticle } from "@/types";
import { useEffect } from "react";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";


interface NewsFormProps {
  newsArticle?: NewsArticle | null;
  onFinished: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, { message: "El título no puede estar vacío." }),
  content: z.string().min(1, { message: "El contenido no puede estar vacío." }),
  imageUrl: z.string().url({ message: "Por favor, introduce una URL de imagen válida." }).optional().or(z.literal('')),
  videoUrl: z.string().url({ message: "Por favor, introduce una URL de vídeo válida." }).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export function NewsForm({ newsArticle, onFinished }: NewsFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: newsArticle?.title ?? "",
      content: newsArticle?.content ?? "",
      imageUrl: newsArticle?.imageUrl ?? "",
      videoUrl: newsArticle?.videoUrl ?? "",
      isActive: newsArticle?.isActive ?? true,
    },
  });
  
   useEffect(() => {
    // When editing, repopulate the form
    if (newsArticle) {
      form.reset({
        title: newsArticle.title,
        content: newsArticle.content,
        imageUrl: newsArticle.imageUrl,
        videoUrl: newsArticle.videoUrl,
        isActive: newsArticle.isActive,
      });
    } else {
      form.reset({
        title: "",
        content: "",
        imageUrl: "",
        videoUrl: "",
        isActive: true,
      });
    }
  }, [newsArticle, form]);

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    const finalValues = { ...values };

    if (newsArticle) {
      // Update existing item
      const newsRef = doc(firestore, "news_articles", newsArticle.id);
      updateDocumentNonBlocking(newsRef, finalValues);
      toast({ title: "Éxito", description: `Noticia actualizada.` });
    } else {
      // Add new item
      const newsCollectionRef = collection(firestore, "news_articles");
      addDocumentNonBlocking(newsCollectionRef, {
        ...finalValues,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Éxito", description: `Noticia creada.` });
    }
    onFinished();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="El titular de la noticia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido</FormLabel>
              <FormControl>
                <Textarea placeholder="El cuerpo de la noticia..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Imagen (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Video de YouTube (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://youtube.com/watch?v=..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isActive"
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
