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


// News Item Actions
export async function addNewsItem(data: unknown) {
  const validatedFields = NewsSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().formErrors.join(', ') };
  }

  try {
    await addDoc(collection(db, "news"), {
      ...validatedFields.data,
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
  try {
    const newsRef = doc(db, "news", id);
    await updateDoc(newsRef, data);
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
    const response = await fetch(url, { headers: { 'User-Agent': 'NoticiasItalia-App/1.0' }});
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
