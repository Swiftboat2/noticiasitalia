
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { TickerMessage } from "@/types";
import { useEffect } from "react";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";

interface TickerFormProps {
  tickerMessage?: TickerMessage | null;
  onFinished: () => void;
}

const formSchema = z.object({
  text: z.string().min(1, { message: "El texto no puede estar vacío." }).max(200, { message: "Máximo 200 caracteres."}),
});

export function TickerForm({ tickerMessage, onFinished }: TickerFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: tickerMessage?.text ?? "",
    },
  });

  useEffect(() => {
    // When editing, repopulate the form
    if (tickerMessage) {
      form.reset({ text: tickerMessage.text });
    } else {
       form.reset({ text: "" });
    }
  }, [tickerMessage, form]);


  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    if (tickerMessage) {
      const tickerRef = doc(firestore, "tickerMessages", tickerMessage.id);
      updateDocumentNonBlocking(tickerRef, values);
      toast({ title: "Éxito", description: "Mensaje del ticker actualizado." });
    } else {
      const tickerCollectionRef = collection(firestore, "tickerMessages");
      addDocumentNonBlocking(tickerCollectionRef, {
        ...values,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Éxito", description: "Mensaje del ticker creado." });
    }
    onFinished();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto del Mensaje</FormLabel>
              <FormControl>
                <Textarea placeholder="Escribe un mensaje corto para la cinta de noticias..." {...field} />
              </FormControl>
              <FormMessage />
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
