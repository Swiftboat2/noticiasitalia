'use server';
/**
 * @fileOverview Adjusts the aspect ratio of an image to fit a 9:16 screen ratio using AI.
 *
 * - adjustImageAspectRatio - A function that adjusts the aspect ratio of an image.
 * - AdjustImageAspectRatioInput - The input type for the adjustImageAspectRatio function.
 * - AdjustImageAspectRatioOutput - The return type for the adjustImageAspectRatio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustImageAspectRatioInputSchema = z.object({
  imageUri: z
    .string()
    .describe(
      "The image to adjust, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AdjustImageAspectRatioInput = z.infer<typeof AdjustImageAspectRatioInputSchema>;

const AdjustImageAspectRatioOutputSchema = z.object({
  adjustedImageUri: z
    .string()
    .describe('The adjusted image, as a data URI with MIME type and Base64 encoding.'),
});
export type AdjustImageAspectRatioOutput = z.infer<typeof AdjustImageAspectRatioOutputSchema>;

export async function adjustImageAspectRatio(input: AdjustImageAspectRatioInput): Promise<AdjustImageAspectRatioOutput> {
  return adjustImageAspectRatioFlow(input);
}

const adjustImageAspectRatioFlow = ai.defineFlow(
  {
    name: 'adjustImageAspectRatioFlow',
    inputSchema: AdjustImageAspectRatioInputSchema,
    outputSchema: AdjustImageAspectRatioOutputSchema,
  },
  async input => {
    // Extract content type and base64 data from the data URI
    const match = input.imageUri.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid image data URI format.");
    }
    const [, contentType] = match;

    const {media} = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            {
                media: {
                    contentType: contentType,
                    url: input.imageUri
                }
            },
            {
                text: 'Adjust the image to fit a 9:16 aspect ratio without distortion, adding black bars if necessary. Return the adjusted image as a data URI.'
            }
        ],
        config: {
            responseModalities: ['TEXT', 'IMAGE']
        }
    });

    if (!media?.url) {
      throw new Error("The API did not return an adjusted image.");
    }
    
    return {adjustedImageUri: media.url};
  }
);
