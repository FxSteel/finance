"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Tags, Trash2 } from "lucide-react";
import type { Category } from "@/types/database";

const COLORS = [
  "#2D8659", "#5B5DEF", "#C4A876", "#B83A3A", "#C8841A",
  "#888780", "#3D3D42", "#0A0A0B", "#D3D1C7", "#FAFAFA",
];

export default function CategoriesPage() {
  const { user } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);

  const loadCategories = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories((data as Category[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async () => {
    if (!user || !formName) return;
    setSubmitting(true);

    const supabase = createClient();
    await supabase.from("categories").insert({
      name: formName,
      color: formColor,
      user_id: user.id,
    });

    setDialogOpen(false);
    setFormName("");
    setFormColor(COLORS[0]);
    setSubmitting(false);
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", id);
    loadCategories();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-paper">Categorias</h1>
          <p className="text-steel text-sm mt-1">Personaliza tus categorias de gasto</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button className="bg-indigo hover:bg-indigo/90 text-paper cursor-pointer" />}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva categoria
          </DialogTrigger>
          <DialogContent className="bg-charcoal border-[rgba(250,250,250,0.08)] text-paper max-w-sm">
            <DialogHeader>
              <DialogTitle>Nueva categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-steel">Nombre</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Alimentacion, Transporte..."
                  className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                />
              </div>
              <div>
                <Label className="text-steel">Color</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        formColor === c
                          ? "border-paper scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formName}
                className="w-full bg-indigo hover:bg-indigo/90 text-paper cursor-pointer"
              >
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card className="border-[rgba(250,250,250,0.08)] bg-charcoal">
          <CardContent className="py-12 text-center">
            <Tags className="w-12 h-12 text-graphite mx-auto mb-4" />
            <p className="text-steel">No tienes categorias creadas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="border-[rgba(250,250,250,0.08)] bg-charcoal group relative"
            >
              <CardContent className="pt-6 flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-paper font-medium text-sm flex-1">{cat.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(cat.id)}
                  className="text-graphite hover:text-expense opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
