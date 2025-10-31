"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";
import { useState, useCallback } from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Éxito",
        description: "Has iniciado sesión correctamente.",
      });
      // The AdminLayout will handle the redirect to /admin/dashboard
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      let description = "Credenciales inválidas o error de red. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = "El correo electrónico o la contraseña son incorrectos.";
      } else if (error.code === 'auth/too-many-requests') {
          description = "Demasiados intentos fallidos. Por favor, inténtalo más tarde.";
      }
      
      toast({
        variant: "destructive",
        title: "Inicio de Sesión Fallido",
        description: description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleMakeAdmin = useCallback(async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión primero." });
      return;
    }
    const adminRef = doc(firestore, "roles_admin", user.uid);
    setDocumentNonBlocking(adminRef, { admin: true }, {});
    toast({ title: "Éxito", description: "Te has asignado el rol de administrador. Serás redirigido." });
    // Give a moment for the role to propagate before the layout re-checks
    setTimeout(() => router.push("/admin/dashboard"), 1000);
  }, [user, firestore, toast, router]);


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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@ejemplo.com" {...field} />
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
            <Button type="submit" className="w-full" disabled={isSubmitting || !!user}>
              {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </Form>
      </CardContent>
      {user && (
        <CardFooter className="flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Parece que has iniciado sesión pero no eres administrador.
            </p>
            <Button variant="secondary" className="w-full" onClick={handleMakeAdmin}>
                <UserPlus className="mr-2"/> Hazme Administrador
            </Button>
            <Button variant="outline" className="w-full" onClick={() => signOut(auth)}>
                Cerrar sesión de {user.email}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
