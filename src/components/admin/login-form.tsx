"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  username: z.string().min(1, { message: "El nombre de usuario es obligatorio." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    if (values.username === 'colegioadmin' && values.password === 'cole1046') {
      localStorage.setItem('isAuthenticated', 'true');
      toast({
        title: "Éxito",
        description: "Has iniciado sesión correctamente.",
      });
      router.push("/admin/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Inicio de Sesión Fallido",
        description: "Credenciales inválidas. Por favor, inténtalo de nuevo.",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <LogIn /> Iniciar Sesión de Administrador
        </CardTitle>
        <CardDescription>
            Introduce tus credenciales para acceder al panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="colegioadmin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
