"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
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
import { Plus, CreditCard, Trash2, Check } from "lucide-react";
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
  const [deleteTarget, setDeleteTarget] = useState<CreditCardType | null>(null);

  const [formName, setFormName] = useState("");
  const [formLastFour, setFormLastFour] = useState("");
  const [formPaymentDay, setFormPaymentDay] = useState("10");
  const [formClosingDay, setFormClosingDay] = useState("1");
  const [formLimit, setFormLimit] = useState("");
  const [formLimitUsd, setFormLimitUsd] = useState("");
  const [formCurrency, setFormCurrency] = useState<"CLP" | "USD" | "both">("CLP");
  const [formType, setFormType] = useState<"credit" | "debit">("credit");
  const [formColor, setFormColor] = useState(CARD_COLORS[0].value);

  const loadCards = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("credit_cards_secure")
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
    setFormLimitUsd("");
    setFormCurrency("CLP");
    setFormType("credit");
    setFormColor(CARD_COLORS[0].value);
  };

  const handleSubmit = async () => {
    if (!user || !formName || !formLastFour) return;
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.from("credit_cards").insert({
      name: formName,
      last_four_digits: formLastFour,
      type: formType,
      payment_day: parseInt(formPaymentDay),
      closing_day: parseInt(formClosingDay),
      credit_limit: formLimit ? parseFloat(formLimit) : null,
      credit_limit_usd: formLimitUsd ? parseFloat(formLimitUsd) : null,
      currency: formCurrency,
      color: formColor,
      owner_id: user.id,
    });

    if (error) {
      console.error("Error al guardar tarjeta:", error);
      setSubmitting(false);
      return;
    }

    setDialogOpen(false);
    resetForm();
    setSubmitting(false);
    loadCards();
    toast.success("Tarjeta creada exitosamente");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const supabase = createClient();
    await supabase.from("credit_cards").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    loadCards();
    toast.success("Tarjeta eliminada");
  };

  const [paidConfirmTarget, setPaidConfirmTarget] = useState<CreditCardType | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const handleMarkPaid = async (card: CreditCardType) => {
    setMarkingPaid(true);
    const { date: nextPayment } = getNextPaymentDate(card.payment_day);
    const paidUntil = `${nextPayment.getFullYear()}-${String(nextPayment.getMonth() + 1).padStart(2, "0")}-${String(nextPayment.getDate()).padStart(2, "0")}`;
    const supabase = createClient();
    await supabase.from("credit_cards").update({ paid_until: paidUntil }).eq("id", card.id);
    await loadCards();
    setMarkingPaid(false);
    setPaidConfirmTarget(null);
    toast.success("Pago marcado exitosamente");
  };

  const handleUnmarkPaid = async (card: CreditCardType) => {
    const supabase = createClient();
    await supabase.from("credit_cards").update({ paid_until: null }).eq("id", card.id);
    loadCards();
    toast.success("Pago desmarcado");
  };

  const isCardPaid = (card: CreditCardType) => {
    if (!card.paid_until) return false;
    const { date: nextPayment } = getNextPaymentDate(card.payment_day);
    const paidDate = new Date(card.paid_until + "T00:00:00");
    return paidDate >= nextPayment;
  };

  const getNextPaymentDate = (paymentDay: number) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), paymentDay);
    const next = thisMonth >= now ? thisMonth : new Date(now.getFullYear(), now.getMonth() + 1, paymentDay);
    const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { date: next, days };
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
          <h1 className="text-xl font-medium text-paper">Tarjetas</h1>
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
              <DialogTitle>Nueva tarjeta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-steel">Nombre de la tarjeta <span className="text-expense">*</span></Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Visa Banco Estado"
                  className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-steel">Tipo de tarjeta <span className="text-expense">*</span></Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v as "credit" | "debit")}>
                    <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                      <SelectValue>
                        {formType === "credit" ? "Credito" : "Debito"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                      <SelectItem value="credit">Credito</SelectItem>
                      <SelectItem value="debit">Debito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-steel">Moneda <span className="text-expense">*</span></Label>
                  <Select value={formCurrency} onValueChange={(v) => setFormCurrency(v as "CLP" | "USD" | "both")}>
                    <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                      <SelectValue>
                        {formCurrency === "both" ? "CLP + USD" : formCurrency}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                      <SelectItem value="CLP">CLP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="both">CLP + USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-steel">Ultimos 4 digitos <span className="text-expense">*</span></Label>
                  <Input
                    value={formLastFour}
                    onChange={(e) => setFormLastFour(e.target.value.slice(0, 4))}
                    placeholder="1234"
                    maxLength={4}
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>
              </div>
              {formType === "credit" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-steel">Dia de cierre <span className="text-expense">*</span></Label>
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
                      <Label className="text-steel">Dia de pago <span className="text-expense">*</span></Label>
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
                  {formCurrency === "both" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-steel">Cupo CLP <span className="text-expense">*</span></Label>
                        <Input
                          type="number"
                          value={formLimit}
                          onChange={(e) => setFormLimit(e.target.value)}
                          placeholder="0"
                          className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-steel">Cupo USD <span className="text-expense">*</span></Label>
                        <Input
                          type="number"
                          value={formLimitUsd}
                          onChange={(e) => setFormLimitUsd(e.target.value)}
                          placeholder="0"
                          className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-steel">Cupo {formCurrency}</Label>
                      <Input
                        type="number"
                        value={formCurrency === "CLP" ? formLimit : formLimitUsd}
                        onChange={(e) => formCurrency === "CLP" ? setFormLimit(e.target.value) : setFormLimitUsd(e.target.value)}
                        placeholder="0"
                        className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                      />
                    </div>
                  )}
                </>
              )}
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
                disabled={submitting || !formName || !formLastFour || (formType === "credit" && formCurrency === "both" && (!formLimit || !formLimitUsd))}
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
            const { date: nextPayment, days: daysUntil } = getNextPaymentDate(card.payment_day);
            return (
              <div key={card.id} className="group relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(card)}
                  className="absolute -top-2 -right-2 z-10 text-graphite hover:text-expense bg-charcoal border border-[rgba(250,250,250,0.08)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div
                  className={`bg-gradient-to-br ${card.color} rounded-xl p-6 h-48 flex flex-col justify-between`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white/50 text-[10px] uppercase tracking-wide">
                        {card.type === "credit" ? "Tarjeta de Credito" : "Tarjeta de Debito"} &middot; {card.currency === "both" ? "CLP / USD" : card.currency}
                      </p>
                      <p className="text-white font-medium text-lg mt-1">{card.name}</p>
                      {card.type === "credit" && (
                        <p className="text-white/40 text-xs mt-1">
                          Fecha de pago: {nextPayment.getDate()}/{nextPayment.getMonth() + 1}/{nextPayment.getFullYear()} -{" "}
                          {isCardPaid(card) ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUnmarkPaid(card); }}
                              className="inline-flex items-center gap-1 text-income cursor-pointer hover:text-income/80 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              Pagada
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPaidConfirmTarget(card); }}
                              className="text-warning cursor-pointer hover:text-warning/80 transition-colors underline underline-offset-2"
                            >
                              {daysUntil === 0 ? "Pago hoy" : `Pago en ${daysUntil} dias`}
                            </button>
                          )}
                        </p>
                      )}
                    </div>
                    <CreditCard className="w-8 h-8 text-white/20" />
                  </div>
                  <div>
                    <p className="text-white/70 text-lg tracking-[0.3em] font-mono tabular-nums">
                      **** **** **** {card.last_four_digits}
                    </p>
                    <div className="flex justify-between items-end mt-3">
                      {card.type === "credit" ? (
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
                      ) : (
                        <div />
                      )}
                      {card.type === "credit" && (card.credit_limit || card.credit_limit_usd) && (
                        <div className="text-left text-white/50 text-xs tabular-nums">
                          {card.credit_limit && (
                            <p>CLP: {formatCurrency(card.credit_limit, "CLP")}</p>
                          )}
                          {card.credit_limit_usd && (
                            <p>USD: {formatCurrency(card.credit_limit_usd, "USD")}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!paidConfirmTarget} onOpenChange={(open) => !open && setPaidConfirmTarget(null)}>
        <DialogContent className="bg-charcoal border-[rgba(250,250,250,0.08)] text-paper max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar como pagada</DialogTitle>
          </DialogHeader>
          <p className="text-steel text-sm mt-2">
            ¿Marcar el pago de{" "}
            <span className="text-paper font-medium">{paidConfirmTarget?.name}</span>
            {" "}como realizado para este periodo?
          </p>
          <div className="flex gap-3 mt-4 justify-end">
            <Button
              variant="ghost"
              onClick={() => setPaidConfirmTarget(null)}
              className="text-steel hover:text-paper cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => paidConfirmTarget && handleMarkPaid(paidConfirmTarget)}
              disabled={markingPaid}
              className="bg-income hover:bg-income/90 text-paper cursor-pointer"
            >
              {markingPaid ? (
                <>
                  <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                "Marcar pagada"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-charcoal border-[rgba(250,250,250,0.08)] text-paper max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar tarjeta</DialogTitle>
          </DialogHeader>
          <p className="text-steel text-sm mt-2">
            ¿Estas seguro de eliminar{" "}
            <span className="text-paper font-medium">{deleteTarget?.name}</span>
            {" "}(****{deleteTarget?.last_four_digits})? Esta accion no se puede deshacer.
          </p>
          <div className="flex gap-3 mt-4 justify-end">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              className="text-steel hover:text-paper cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-expense hover:bg-expense/90 text-paper cursor-pointer"
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
