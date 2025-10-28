"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { NewsForm } from "./news-form";
import type { NewsArticle } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  PlusCircle,
  Edit,
  Trash2,
  LogOut,
  Newspaper,
  Eye,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  collection,
  orderBy,
  query,
  doc,
} from "firebase/firestore";
import { useCollection, useAuth, useFirestore } from "@/firebase";
import {
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from "@/firebase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const [isNewsFormOpen, setIsNewsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const { data: news, isLoading: isNewsLoading } = useCollection<NewsArticle>(
    query(collection(firestore, "news_articles"), orderBy("createdAt", "desc"))
  );

  const isDataLoading = isNewsLoading;

  const handleEditNews = useCallback((item: NewsArticle) => {
    setEditingNews(item);
    setIsNewsFormOpen(true);
  }, []);

  const handleDeleteNews = useCallback(async (id: string) => {
    setIsLoading(true);
    const newsRef = doc(firestore, "news_articles", id);
    deleteDocumentNonBlocking(newsRef);
    toast({ title: "Éxito", description: "Noticia eliminada." });
    setIsLoading(false);
  }, [firestore, toast]);

  const handleToggleActive = useCallback(async (item: NewsArticle) => {
    setIsLoading(true);
    const newsRef = doc(firestore, "news_articles", item.id);
    updateDocumentNonBlocking(newsRef, { isActive: !item.isActive });
    setIsLoading(false);
  }, [firestore]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    router.push("/admin/login");
  }, [auth, router]);

  const formatDate = useCallback((dateString: string | { toDate: () => Date }) => {
    try {
      if (!dateString) return 'Fecha no disponible';
      const date = typeof dateString === 'string' 
        ? parseISO(dateString) 
        : dateString && typeof (dateString as any).toDate === 'function'
        ? (dateString as any).toDate()
        : new Date(dateString as any);
      return format(date, "PPpp", { locale: es });
    } catch (e) {
      console.error('Error al formatear fecha:', dateString, e);
      return 'Fecha inválida';
    }
  }, []);

  return (
    <div className="container mx-auto py-10 space-y-12">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Newspaper className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-headline">Panel de Control</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            <Eye className="mr-2 h-4 w-4" /> Ver Sitio
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Salir
          </Button>
        </div>
      </header>

      {/* News Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            Gestor de Noticias
            {!isDataLoading && news && news.length > 0 && (
              <Badge variant="secondary" className="ml-2">{news.length}</Badge>
            )}
          </h2>
          <Dialog
            open={isNewsFormOpen}
            onOpenChange={(isOpen) => {
              setIsNewsFormOpen(isOpen);
              if (!isOpen) setEditingNews(null);
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Noticia
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingNews ? "Editar Noticia" : "Añadir Noticia"}</DialogTitle>
                <DialogDescription>
                  {editingNews ? "Actualiza los detalles." : "Rellena el formulario para añadir una nueva noticia."}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-6">
                <NewsForm
                  newsArticle={editingNews}
                  onFinished={() => { 
                    setIsNewsFormOpen(false); 
                    setEditingNews(null); 
                  }}
                />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Contenido</TableHead>
                <TableHead>Creación</TableHead>
                <TableHead>Activa</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataLoading ? (
                 <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      <span>Cargando noticias...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : news && news.length > 0 ? (
                news.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium max-w-xs truncate">{item.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.content}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={item.isActive} 
                        onCheckedChange={() => handleToggleActive(item)}
                        disabled={isLoading}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditNews(item)}
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isLoading}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente la noticia.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteNews(item.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center p-10 text-muted-foreground">
                    No se encontraron noticias.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
