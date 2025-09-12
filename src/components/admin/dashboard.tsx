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
  addNewsItem,
  deleteNewsItem,
  updateNewsItem,
} from "@/lib/actions";
import { NewsForm } from "./news-form";
import type { NewsItem } from "@/types";
import { format } from "date-fns";
import {
  PlusCircle,
  Edit,
  Trash2,
  LogOut,
  Newspaper,
  Eye,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function Dashboard({ initialNews }: { initialNews: NewsItem[] }) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newsData: NewsItem[] = [];
      querySnapshot.forEach((doc) => {
        newsData.push({ id: doc.id, ...doc.data() } as NewsItem);
      });
      setNews(newsData);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteNewsItem(id);
    if (result.success) {
      toast({ title: "Success", description: "News item deleted." });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  };

  const handleToggleActive = async (item: NewsItem) => {
    const result = await updateNewsItem(item.id, { active: !item.active });
    if (result.success) {
      toast({
        title: "Success",
        description: `News item ${!item.active ? "activated" : "deactivated"}.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  return (
    <div className="container mx-auto py-10">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Newspaper className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-headline">News Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            <Eye className="mr-2 h-4 w-4" /> View Site
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <div className="mb-6 flex justify-end">
        <Dialog
          open={isFormOpen}
          onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setEditingNews(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add News
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingNews ? "Edit News Item" : "Add News Item"}
              </DialogTitle>
              <DialogDescription>
                {editingNews
                  ? "Update the details of the news item."
                  : "Fill in the form to add a new news item."}
              </DialogDescription>
            </DialogHeader>
            <NewsForm
              newsItem={editingNews}
              onSubmit={addNewsItem}
              onUpdate={updateNewsItem}
              onFinished={() => {
                setIsFormOpen(false);
                setEditingNews(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[120px]">Created At</TableHead>
              <TableHead className="w-[100px]">Duration</TableHead>
              <TableHead className="w-[80px]">Active</TableHead>
              <TableHead className="text-right w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                    {item.url}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant={item.type === 'image' ? 'default' : item.type === 'video' ? 'secondary' : 'outline'}>
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.createdAt?.toDate ? format(item.createdAt.toDate(), "PPpp") : '...'}
                </TableCell>
                <TableCell>{item.duration}s</TableCell>
                <TableCell>
                  <Switch
                    checked={item.active}
                    onCheckedChange={() => handleToggleActive(item)}
                    aria-label="Toggle active state"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the news item.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       {news.length === 0 && (
          <div className="text-center p-10 text-muted-foreground">
              No news items found.
          </div>
        )}
    </div>
  );
}
