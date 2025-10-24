
"use server";

import { revalidatePath } from "next/cache";
import { addDoc, collection, getDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/lib/firebase/config";
import type { NewsItem, TickerMessage } from "@/types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

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
  
  let newsData = validatedFields.data;

  // If the item is an image and the URL is external, convert it to a data URI
  if (newsData.type === 'image' && isHttpUrl(newsData.url)) {
      const imageResult = await fetchImageAsDataUrl(newsData.url);
      if (imageResult.success && imageResult.dataUrl) {
          newsData.url = imageResult.dataUrl;
      } else {
          return { error: `No se pudo procesar la URL de la imagen: ${imageResult.error}` };
      }
  }

  const newsCollectionRef = collection(db, "news");
  
  try {
    await addDoc(newsCollectionRef, {
      ...newsData,
      createdAt: serverTimestamp(),
    }).catch(serverError => {
       const permissionError = new FirestorePermissionError({
        path: newsCollectionRef.path,
        operation: 'create',
        requestResourceData: newsData,
       });
       errorEmitter.emit('permission-error', permissionError);
       throw permissionError; // Re-throw to inform the caller
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    if (error instanceof FirestorePermissionError) {
        return { error: "Permisos insuficientes para crear la noticia." };
    }
    return { error: "No se pudo crear la noticia." };
  }
}

export async function updateNewsItem(id: string, data: Partial<Omit<NewsItem, 'id' | 'createdAt'>>) {
  const newsRef = doc(db, "news", id);
  const updateData = { ...data };

  // If the URL is being updated for an image, convert it to a data URI if it's an http url
  if (updateData.url && (data.type === 'image' || !data.type)) {
    const docSnap = await getDoc(newsRef).catch(serverError => {
        const permissionError = new FirestorePermissionError({ path: newsRef.path, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });

    if(!docSnap.exists()){
        return { error: "La noticia que intentas actualizar no existe." };
    }
    const currentData = docSnap.data();

    // Determine if the item is an image type
    const isImageType = (currentData && currentData.type === 'image') || data.type === 'image';
    
    if (isImageType && isHttpUrl(updateData.url)) {
      const imageResult = await fetchImageAsDataUrl(updateData.url);
      if (imageResult.success && imageResult.dataUrl) {
        updateData.url = imageResult.dataUrl;
      } else {
        return { error: `No se pudo procesar la URL de la imagen: ${imageResult.error}` };
      }
    }
  }

  try {
    await updateDoc(newsRef, updateData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: newsRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
     if (error instanceof FirestorePermissionError) {
        return { error: "Permisos insuficientes para actualizar la noticia." };
    }
    return { error: "No se pudo actualizar la noticia." };
  }
}

export async function deleteNewsItem(id: string) {
  const newsRef = doc(db, "news", id);
  try {
    await deleteDoc(newsRef).catch(serverError => {
        const permissionError = new FirestorePermissionError({ path: newsRef.path, operation: 'delete' });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    if (error instanceof FirestorePermissionError) {
        return { error: "Permisos insuficientes para eliminar la noticia." };
    }
    return { error: "No se pudo eliminar la noticia." };
  }
}


// Ticker Message Actions
export async function addTickerMessage(data: unknown) {
  const validatedFields = TickerSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().formErrors.join(', ') };
  }
  
  const tickerCollectionRef = collection(db, "tickerMessages");

  try {
    await addDoc(tickerCollectionRef, {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    }).catch(serverError => {
       const permissionError = new FirestorePermissionError({
        path: tickerCollectionRef.path,
        operation: 'create',
        requestResourceData: validatedFields.data,
       });
       errorEmitter.emit('permission-error', permissionError);
       throw permissionError;
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
     if (error instanceof FirestorePermissionError) {
        return { error: "Permisos insuficientes para crear el mensaje." };
    }
    return { error: "No se pudo crear el mensaje del ticker." };
  }
}

export async function updateTickerMessage(id: string, data: Partial<Omit<TickerMessage, 'id' | 'createdAt'>>) {
   const validatedFields = TickerSchema.safeParse(data);
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().formErrors.join(', ') };
    }
  
  const tickerRef = doc(db, "tickerMessages", id);
  try {
    await updateDoc(tickerRef, validatedFields.data).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: tickerRef.path,
            operation: 'update',
            requestResourceData: validatedFields.data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    if (error instanceof FirestorePermissionError) {
        return { error: "Permisos insuficientes para actualizar el mensaje." };
    }
    return { error: "No se pudo actualizar el mensaje del ticker." };
  }
}

export async function deleteTickerMessage(id: string) {
  const tickerRef = doc(db, "tickerMessages", id);
  try {
    await deleteDoc(tickerRef).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: tickerRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    if (error instanceof FirestorePermissionError) {
        return { error: "Permisos insuficientes para eliminar el mensaje." };
    }
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
