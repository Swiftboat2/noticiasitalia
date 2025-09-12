"use server";

import { revalidatePath } from "next/cache";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/lib/firebase/config";
import type { NewsItem } from "@/types";

const NewsSchema = z.object({
  url: z.string().min(1, { message: "Please provide a URL or data URI." }),
  type: z.enum(["image", "video", "text"]),
  duration: z.coerce.number().min(1, { message: "Duration must be at least 1 second." }),
  active: z.boolean().default(true),
});

export async function addNewsItem(formData: FormData) {
  const validatedFields = NewsSchema.safeParse({
    url: formData.get('url'),
    type: formData.get('type'),
    duration: formData.get('duration'),
    active: formData.get('active') === 'on',
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      error: validatedFields.error.flatten().formErrors.join(', ')
    };
  }

  try {
    await addDoc(collection(db, "news"), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create news item." };
  }
}

export async function updateNewsItem(id: string, data: Partial<NewsItem>) {
  try {
    const newsRef = doc(db, "news", id);
    await updateDoc(newsRef, data);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update news item." };
  }
}

export async function deleteNewsItem(id: string) {
  try {
    await deleteDoc(doc(db, "news", id));
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete news item." };
  }
}

export async function fetchImageAsDataUrl(url: string): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'NoticiasItalia-App/1.0' }});
    if (!response.ok) {
      throw new Error(`Failed to fetch image. Server responded with ${response.status}`);
    }
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) {
        throw new Error('The fetched file is not an image.');
    }
    const buffer = Buffer.from(await blob.arrayBuffer());
    const dataUrl = `data:${blob.type};base64,${buffer.toString('base64')}`;
    return { success: true, dataUrl };
  } catch (error: any) {
    console.error('Failed to fetch image as data URL:', error);
    return { success: false, error: error.message || 'An unknown error occurred while fetching the image.' };
  }
}
