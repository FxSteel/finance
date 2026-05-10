"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, CreditCard, Trash2, Calendar } from "lucide-react";
import type { CreditCard as CreditCardType } from "@/types/database";

const CARD_COLORS = [
  { name: "Ink", value: "from-[#1F1F23] to-[#0A0A0B]" },
  { name: "Indigo", value: "from-[#5B5DEF] to-[#3538A8]" },
  { name: "Brass", value: "from-[#C4A876] to-[#8A7550]" },
  { name: "Income", value: "from-[#2D8659] to-[#1A5035]" },
  { name: "Expense", value: "from-[#B83A3A] to-[#7A2525]" },
  { name: "Steel", value: "from-[#888780] to-[#3D3D42]" },
  { name: "Pure", value: "from-[#3D3D42] to-[#000000]" },
];

export default function CreditCardsPage() {
  const { user } = useUser();
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formLastFour, setFormLastFour] = useState("");
  const [formPaymentDay, setFormPaymentDay] = useState("10");
  const [formClosingDay, setFormClosingDay] = useState("1");
  const [formLimit, setFormLimit] = useState("");
  const [formCurrency, setFormCurrency] = useState<"CLP" | "USD">("CLP");
  const [formColor, setFormColor] = useState(CARD_COLORS[0].value);

  const loadCards = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("credit_cards")
      .select("*")
      .order("name");
    setCards((data as CreditCardType[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const resetForm = () => {
    setFormName("");
    setFormLastFour("");
    setFormPaymentDay("10");
    setFormClosingDay("1");
    setFormLimit("");
    setFormCurrency("CLP");
    setFormColor(CARD_COLORS[0].value);
  };

  const handleSubmit = async () => {
    if (!user || !formName || !formLastFour) return;
    setSubmitting(true);

    const supabase = createClient();
    await supabase.from("credit_cards").insert({
      name: formName,
      last_four_digits: formLastFour,
      payment_day: parseInt(formPaymentDay),
      closing_day: parseInt(formClosingDay),
      credit_limit: formLimit ? parseFloat(formLimit) : null,
      currency: formCurrency,
      color: formColor,
      owner_id: user.id,
    });

    setDialogOpen(false);
    resetForm();
    setSubmitting(false);
    loadCards();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("credit_cards").delete().eq("id", id);
    loadCards();
  };

  const getDaysUntilPayment = (paymentDay: number) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), paymentDay);
    const next = thisMonth > now ? thisMonth : new Date(now.getFullYear(), now.getMonth() + 1, paymentDay);
    return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
          <h1 className="text-xl font-medium text-paper">Tarjetas de credito</h1>
          <p className="text-steel text-sm mt-1">Administra tus tarjetas</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button className="bg-indigo hover:bg-indigo/90 text-paper cursor-pointer" onClick={resetForm} />}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva tarjeta
          </DialogTrigger>
          <DialogContent className="bg-charcoal border-[rgba(250,250,250,0.08)] text-paper max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva tarjeta de credito</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-steel">Nombre de la tarjeta</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Visa Banco Estado"
                  className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-steel">Ultimos 4 digitos</Label>
                  <Input
                    value={formLastFour}
                    onChange={(e) => setFormLastFour(e.target.value.slice(0, 4))}
                    placeholder="1234"
                    maxLength={4}
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>
                <div>
                  <Label className="text-steel">Moneda</Label>
                  <Select value={formCurrency} onValueChange={(v) => setFormCurrency(v as "CLP" | "USD")}>
                    <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                      <SelectItem value="CLP">CLP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-steel">Dia de cierre</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formClosingDay}
                    onChange={(e) => setFormClosingDay(e.target.value)}
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>
                <div>
                  <Label className="text-steel">Dia de pago</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formPaymentDay}
                    onChange={(e) => setFormPaymentDay(e.target.value)}
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-steel">Limite de credito (opcional)</Label>
                <Input
                  type="number"
                  value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                  placeholder="0"
                  className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                />
              </div>
              <div>
                <Label className="text-steel">Color</Label>
                <div className="flex gap-2 mt-2">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setFormColor(c.value)}
                      className={`w-8 h-8 rounded-md bg-gradient-to-br ${c.value} border-2 transition-all cursor-pointer ${
                        formColor === c.value
                          ? "border-indigo scale-110"
                          : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formName || !formLastFour}
                className="w-full bg-indigo hover:bg-indigo/90 text-paper cursor-pointer"
              >
                {submitting ? "Guardando..." : "Guardar tarjeta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <Card className="border-[rgba(250,250,250,0.08)] bg-charcoal">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-graphite mx-auto mb-4" />
            <p className="text-steel">No tienes tarjetas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const daysUntil = getDaysUntilPayment(card.payment_day);
            return (
              <div key={card.id} className="group relative">
                <div
                  className={`bg-gradient-to-br ${card.color} rounded-xl p-6 h-48 flex flex-col justify-between`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white/50 text-[10px] uppercase tracking-wide">
                        {card.currency}
                      </p>
                      <p className="text-white font-medium text-lg mt-1">{card.name}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-white/20" />
                  </div>
                  <div>
                    <p className="text-white/70 text-lg tracking-[0.3em] font-mono tabular-nums">
                      **** **** **** {card.last_four_digits}
                    </p>
                    <div className="flex justify-between items-end mt-3">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-white/30 text-[10px] uppercase tracking-wide">Cierre</p>
                          <p className="text-white/70 text-sm">Dia {card.closing_day}</p>
                        </div>
                        <div>
                          <p className="text-white/30 text-[10px] uppercase tracking-wide">Pago</p>
                          <p className="text-white/70 text-sm">Dia {card.payment_day}</p>
                        </div>
                      </div>
                      {card.credit_limit && (
                        <p className="text-white/50 text-xs tabular-nums">
                          Limite: {formatCurrency(card.credit_limit, card.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-graphite" />
                    <Badge
                      variant="outline"
                      className={
                        daysUntil <= 5
                          ? "border-expense/30 text-expense"
                          : daysUntil <= 10
                          ? "border-warning/30 text-warning"
                          : "border-[rgba(250,250,250,0.1)] text-steel"
                      }
                    >
                      Pago en {daysUntil} dias
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(card.id)}
                    className="text-graphite hover:text-expense opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
