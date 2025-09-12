"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardProps {
  initialNews: NewsItem[];
  initialTickerMessages: TickerMessage[];
}

// Helper to serialize Firestore Timestamps for client-side updates
const serializeData = (doc: any) => {
  const data = doc.data();
  const id = doc.id;
  const serializedData: { [key: string]: any } = { id };
  for (const key in data) {
    if (data[key] && typeof data[key].toDate === 'function') {
      serializedData[key] = data[key].toDate().toISOString();
    } else {
      serializedData[key] = data[key];
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

  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    const newsQuery = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const newsUnsubscribe = onSnapshot(newsQuery, (snapshot) => {
      const newsData = snapshot.docs.map(serializeData) as NewsItem[];
      setNews(newsData);
    }, (error) => {
      console.error("Error al obtener noticias en tiempo real:", error);
      toast({ variant: "destructive", title: "Error de Sincronización", description: "No se pudieron obtener las actualizaciones de noticias." });
    });

    const tickerQuery = query(collection(db, "tickerMessages"), orderBy("createdAt", "desc"));
    const tickerUnsubscribe = onSnapshot(tickerQuery, (snapshot) => {
      const tickerData = snapshot.docs.map(serializeData) as TickerMessage[];
      setTickerMessages(tickerData);
    }, (error) => {
      console.error("Error al obtener mensajes del ticker en tiempo real:", error);
      toast({ variant: "destructive", title: "Error de Sincronización", description: "No se pudieron obtener las actualizaciones del ticker." });
    });

    return () => {
      newsUnsubscribe();
      tickerUnsubscribe();
    };
  }, [toast]);

  const handleEditNews = (item: NewsItem) => {
    setEditingNews(item);
    setIsNewsFormOpen(true);
  };

  const handleDeleteNews = async (id: string) => {
    const result = await deleteNewsItem(id);
    if (result.success) {
      toast({ title: "Éxito", description: "Noticia eliminada." });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };
  
  const handleEditTicker = (item: TickerMessage) => {
    setEditingTicker(item);
    setIsTickerFormOpen(true);
  };

  const handleDeleteTicker = async (id: string) => {
    const result = await deleteTickerMessage(id);
    if (result.success) {
      toast({ title: "Éxito", description: "Mensaje del ticker eliminado." });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('isAuthenticated');
    router.push("/admin/login");
  };

  const formatDate = (dateString: string) => {
    try {
        return format(parseISO(dateString), "PPpp", { locale: es });
    } catch (e) {
        return 'Fecha inválida';
    }
  }

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
          <h2 className="text-2xl font-headline flex items-center gap-2"><Newspaper className="h-6 w-6" />Gestor de Noticias</h2>
          <Dialog
            open={isNewsFormOpen}
            onOpenChange={(isOpen) => {
              setIsNewsFormOpen(isOpen);
              if (!isOpen) setEditingNews(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Noticia
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingNews ? "Editar Noticia" : "Añadir Noticia"}</DialogTitle>
                  <DialogDescription>{editingNews ? "Actualiza los detalles." : "Rellena el formulario para añadir una nueva noticia."}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                    <NewsForm
                        newsItem={editingNews}
                        onFinished={() => { setIsNewsFormOpen(false); setEditingNews(null); }}
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
                  <TableCell className="font-medium max-w-xs truncate"><a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">{item.url}</a></TableCell>
                  <TableCell><Badge variant={item.type === 'image' ? 'default' : item.type === 'video' ? 'secondary' : 'outline'}>{item.type}</Badge></TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell>{item.duration}s</TableCell>
                  <TableCell><Switch checked={item.active} onCheckedChange={async () => await updateNewsItem(item.id, { active: !item.active })}/></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditNews(item)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción eliminará permanentemente la noticia.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteNews(item.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {news.length === 0 && <div className="text-center p-10 text-muted-foreground">No se encontraron noticias.</div>}
        </div>
      </section>

      {/* Ticker Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline flex items-center gap-2"><MessageSquare className="h-6 w-6"/>Gestor del Ticker de Noticias</h2>
          <Dialog
            open={isTickerFormOpen}
            onOpenChange={(isOpen) => {
              setIsTickerFormOpen(isOpen);
              if (!isOpen) setEditingTicker(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="secondary">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Mensaje al Ticker
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingTicker ? "Editar Mensaje" : "Añadir Mensaje"}</DialogTitle>
                <DialogDescription>{editingTicker ? "Actualiza el texto del mensaje." : "Añade un nuevo mensaje a la cinta de noticias."}</DialogDescription>
              </DialogHeader>
              <TickerForm
                tickerMessage={editingTicker}
                onFinished={() => { setIsTickerFormOpen(false); setEditingTicker(null); }}
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
                    <Button variant="ghost" size="icon" onClick={() => handleEditTicker(item)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción eliminará permanentemente el mensaje del ticker.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTicker(item.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {tickerMessages.length === 0 && <div className="text-center p-10 text-muted-foreground">No se encontraron mensajes en el ticker.</div>}
        </div>
      </section>
    </div>
  );
}
