
"use server";

import { revalidatePath } from "next/cache";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/lib/firebase/config";
import type { NewsItem, TickerMessage } from "@/types";

// Schema for News Items
const NewsSchema = z.object({
  url: z.string().min(1, { message: "Por favor, proporciona una URL o un data URI." }),
  type: z.enum(["image", "video", "text"]),
  duration: z.coerce.number().min(1, { message: "La duración debe ser de al menos 1 segundo." }),
  active: z.boolean().default(true),
});

// Schema for Ticker Messages
const TickerSchema = z.object({
  text: z.string().min(1, { message: "El texto del mensaje no puede estar vacío." }).max(200, { message: "El texto no puede superar los 200 caracteres."}),
});


// Helper to check for external image URLs
const isHttpUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};


// News Item Actions
export async function addNewsItem(data: unknown) {
  const validatedFields = NewsSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().formErrors.join(', ') };
  }
  
  const newsData = validatedFields.data;

  // If the item is an image and the URL is external, convert it to a data URI
  if (newsData.type === 'image' && isHttpUrl(newsData.url)) {
      const imageResult = await fetchImageAsDataUrl(newsData.url);
      if (imageResult.success && imageResult.dataUrl) {
          newsData.url = imageResult.dataUrl;
      } else {
          return { error: `No se pudo procesar la URL de la imagen: ${imageResult.error}` };
      }
  }

  try {
    await addDoc(collection(db, "news"), {
      ...newsData,
      createdAt: serverTimestamp(),
    });
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "No se pudo crear la noticia." };
  }
}

export async function updateNewsItem(id: string, data: Partial<Omit<NewsItem, 'id' | 'createdAt'>>) {
  // We can't use the full NewsSchema here because partial updates are allowed.
  // We can validate specific fields if needed, but for now we trust the partial data.
  const updateData = { ...data };

  // If the URL is being updated for an image, convert it to a data URI if it's an http url
  if (updateData.url && (data.type === 'image' || !data.type)) { // Check if type is image or not being changed
      const docSnap = await (await doc(db, 'news', id)).get();
      const currentData = docSnap.data();
      if ((currentData && currentData.type === 'image') || data.type === 'image') {
          if (isHttpUrl(updateData.url)) {
              const imageResult = await fetchImageAsDataUrl(updateData.url);
              if (imageResult.success && imageResult.dataUrl) {
                  updateData.url = imageResult.dataUrl;
              } else {
                  return { error: `No se pudo procesar la URL de la imagen: ${imageResult.error}` };
              }
          }
      }
  }

  try {
    const newsRef = doc(db, "news", id);
    await updateDoc(newsRef, updateData);
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "No se pudo actualizar la noticia." };
  }
}

export async function deleteNewsItem(id: string) {
  try {
    await deleteDoc(doc(db, "news", id));
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "No se pudo eliminar la noticia." };
  }
}


// Ticker Message Actions
export async function addTickerMessage(data: unknown) {
  const validatedFields = TickerSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().formErrors.join(', ') };
  }

  try {
    await addDoc(collection(db, "tickerMessages"), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "No se pudo crear el mensaje del ticker." };
  }
}

export async function updateTickerMessage(id: string, data: Partial<Omit<TickerMessage, 'id' | 'createdAt'>>) {
   const validatedFields = TickerSchema.safeParse(data);
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().formErrors.join(', ') };
    }
  try {
    const tickerRef = doc(db, "tickerMessages", id);
    await updateDoc(tickerRef, validatedFields.data);
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "No se pudo actualizar el mensaje del ticker." };
  }
}

export async function deleteTickerMessage(id: string) {
  try {
    await deleteDoc(doc(db, "tickerMessages", id));
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "No se pudo eliminar el mensaje del ticker." };
  }
}


// Image Fetching Action
export async function fetchImageAsDataUrl(url: string): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  try {
    // Some URLs (like from Instagram) require a specific User-Agent
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }});
    if (!response.ok) {
      throw new Error(`Error al obtener la imagen. El servidor respondió con ${response.status}`);
    }
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) {
        throw new Error('El archivo obtenido no es una imagen.');
    }
    const buffer = Buffer.from(await blob.arrayBuffer());
    const dataUrl = `data:${blob.type};base64,${buffer.toString('base64')}`;
    return { success: true, dataUrl };
  } catch (error: any) {
    console.error('Error al obtener la imagen como data URL:', error);
    return { success: false, error: error.message || 'Ocurrió un error desconocido al obtener la imagen.' };
  }
}
