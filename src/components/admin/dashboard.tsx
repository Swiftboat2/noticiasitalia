"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  deleteNewsItem,
  updateNewsItem,
  deleteTickerMessage,
} from "@/lib/actions";
import { NewsForm } from "./news-form";
import { TickerForm } from "./ticker-form";
import type { NewsItem, TickerMessage } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  PlusCircle,
  Edit,
  Trash2,
  LogOut,
  Newspaper,
  Eye,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardProps {
  initialNews: NewsItem[];
  initialTickerMessages: TickerMessage[];
}

// Helper mejorado para serializar datos de Firestore
const serializeData = (doc: any) => {
  const data = doc.data();
  const id = doc.id;
  const serializedData: { [key: string]: any } = { id };
  
  for (const key in data) {
    if (data[key] && typeof data[key].toDate === 'function') {
      // Convertir Firestore Timestamp a string ISO
      serializedData[key] = data[key].toDate().toISOString();
    } else if (data[key] !== undefined) {
      serializedData[key] = data[key];
    }
  }
  
  // Asegurar que duration existe y es válido para NewsItem
  if ('duration' in serializedData) {
    if (!serializedData.duration || isNaN(serializedData.duration) || serializedData.duration <= 0) {
      serializedData.duration = 10; // valor por defecto
    }
  }
  
  return serializedData;
};

export default function Dashboard({ initialNews, initialTickerMessages }: DashboardProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>(initialTickerMessages);
  
  const [isNewsFormOpen, setIsNewsFormOpen] = useState(false);
  const [isTickerFormOpen, setIsTickerFormOpen] = useState(false);
  
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [editingTicker, setEditingTicker] = useState<TickerMessage | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  
  // Funciones de manejo de errores mejoradas
  const handleFirestoreError = useCallback((error: any, context: string) => {
    console.error(`Error en ${context}:`, error);
    toast({ 
      variant: "destructive", 
      title: "Error de Sincronización", 
      description: `No se pudieron obtener las actualizaciones de ${context}.` 
    });
  }, [toast]);

  useEffect(() => {
    let newsUnsubscribe: () => void;
    let tickerUnsubscribe: () => void;

    try {
      // Suscripción a noticias
      const newsQuery = query(collection(db, "news"), orderBy("createdAt", "desc"));
      newsUnsubscribe = onSnapshot(
        newsQuery, 
        (snapshot) => {
          try {
            const newsData = snapshot.docs.map(serializeData) as NewsItem[];
            console.log('Noticias actualizadas:', newsData.length, 'items');
            
            // Log de duraciones para debug
            newsData.forEach((item, index) => {
              console.log(`Noticia ${index}: duración = ${item.duration}s, tipo = ${item.type}, activa = ${item.active}`);
            });
            
            setNews(newsData);
          } catch (error) {
            console.error('Error al procesar datos de noticias:', error);
            handleFirestoreError(error, 'noticias');
          }
        }, 
        (error) => handleFirestoreError(error, 'noticias')
      );

      // Suscripción a mensajes del ticker
      const tickerQuery = query(collection(db, "tickerMessages"), orderBy("createdAt", "desc"));
      tickerUnsubscribe = onSnapshot(
        tickerQuery, 
        (snapshot) => {
          try {
            const tickerData = snapshot.docs.map(serializeData) as TickerMessage[];
            console.log('Mensajes de ticker actualizados:', tickerData.length, 'items');
            setTickerMessages(tickerData);
          } catch (error) {
            console.error('Error al procesar datos del ticker:', error);
            handleFirestoreError(error, 'ticker');
          }
        }, 
        (error) => handleFirestoreError(error, 'ticker')
      );

    } catch (error) {
      console.error('Error al configurar suscripciones de Firestore:', error);
      toast({ 
        variant: "destructive", 
        title: "Error de Conexión", 
        description: "No se pudo conectar con la base de datos." 
      });
    }

    // Cleanup
    return () => {
      if (newsUnsubscribe) newsUnsubscribe();
      if (tickerUnsubscribe) tickerUnsubscribe();
    };
  }, [handleFirestoreError, toast]);

  const handleEditNews = useCallback((item: NewsItem) => {
    setEditingNews(item);
    setIsNewsFormOpen(true);
  }, []);

  const handleDeleteNews = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const result = await deleteNewsItem(id);
      if (result.success) {
        toast({ title: "Éxito", description: "Noticia eliminada." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Error inesperado al eliminar la noticia." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const handleEditTicker = useCallback((item: TickerMessage) => {
    setEditingTicker(item);
    setIsTickerFormOpen(true);
  }, []);

  const handleDeleteTicker = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const result = await deleteTickerMessage(id);
      if (result.success) {
        toast({ title: "Éxito", description: "Mensaje del ticker eliminado." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Error inesperado al eliminar el mensaje." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleToggleActive = useCallback(async (item: NewsItem) => {
    setIsLoading(true);
    try {
      const result = await updateNewsItem(item.id, { active: !item.active });
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error || "Error al actualizar el estado." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Error inesperado al actualizar." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('isAuthenticated');
    router.push("/admin/login");
  }, [router]);

  const formatDate = useCallback((dateString: string) => {
    try {
      if (!dateString) return 'Fecha no disponible';
      return format(parseISO(dateString), "PPpp", { locale: es });
    } catch (e) {
      console.error('Error al formatear fecha:', dateString, e);
      return 'Fecha inválida';
    }
  }, []);

  // Función para validar duración con indicador visual
  const renderDuration = useCallback((duration: number | undefined) => {
    const validDuration = duration && !isNaN(duration) && duration > 0 ? duration : 10;
    const isDefault = !duration || isNaN(duration) || duration <= 0;
    
    return (
      <div className="flex items-center gap-1">
        <span className={isDefault ? 'text-orange-600' : ''}>{validDuration}s</span>
        {isDefault && (
          <AlertTriangle className="h-3 w-3 text-orange-600" title="Usando duración por defecto" />
        )}
      </div>
    );
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
            {news.length > 0 && (
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
                  newsItem={editingNews}
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
                <TableHead>URL</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Creación</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Activa</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:underline text-primary"
                    >
                      {item.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      item.type === 'image' ? 'default' : 
                      item.type === 'video' ? 'secondary' : 
                      'outline'
                    }>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell>{renderDuration(item.duration)}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={item.active} 
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
              ))}
            </TableBody>
          </Table>
          {news.length === 0 && (
            <div className="text-center p-10 text-muted-foreground">
              No se encontraron noticias.
            </div>
          )}
        </div>
      </section>

      {/* Ticker Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline flex items-center gap-2">
            <MessageSquare className="h-6 w-6"/>
            Gestor del Ticker de Noticias Urgentes
            {tickerMessages.length > 0 && (
              <Badge variant="secondary" className="ml-2">{tickerMessages.length}</Badge>
            )}
          </h2>
          <Dialog
            open={isTickerFormOpen}
            onOpenChange={(isOpen) => {
              setIsTickerFormOpen(isOpen);
              if (!isOpen) setEditingTicker(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="secondary" disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Mensaje Urgente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingTicker ? "Editar Mensaje" : "Añadir Mensaje Urgente"}</DialogTitle>
                <DialogDescription>
                  {editingTicker ? "Actualiza el texto del mensaje." : "Añade un nuevo mensaje a la cinta de noticias urgentes."}
                </DialogDescription>
              </DialogHeader>
              <TickerForm
                tickerMessage={editingTicker}
                onFinished={() => { 
                  setIsTickerFormOpen(false); 
                  setEditingTicker(null); 
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Texto del Mensaje</TableHead>
                <TableHead>Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickerMessages.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.text}</TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditTicker(item)}
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
                            Esta acción eliminará permanentemente el mensaje del ticker.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTicker(item.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {tickerMessages.length === 0 && (
            <div className="text-center p-10 text-muted-foreground">
              No se encontraron mensajes en el ticker.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}