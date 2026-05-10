"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { formatCurrency, formatDate } from "@/lib/format";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
} from "lucide-react";
import type { Transaction, Category, CreditCard } from "@/types/database";

export default function TransactionsPage() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCurrency, setFormCurrency] = useState<"CLP" | "USD">("CLP");
  const [formCategory, setFormCategory] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState<"debit" | "credit">("debit");
  const [formCreditCard, setFormCreditCard] = useState("");
  const [formInstallments, setFormInstallments] = useState("1");
  const [formPriority, setFormPriority] = useState<"high" | "medium" | "low">("medium");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [txRes, catRes, ccRes] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("credit_cards").select("*").order("name"),
    ]);
    setTransactions((txRes.data as Transaction[]) ?? []);
    setCategories((catRes.data as Category[]) ?? []);
    setCreditCards((ccRes.data as CreditCard[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormType("expense");
    setFormAmount("");
    setFormDescription("");
    setFormCurrency("CLP");
    setFormCategory("");
    setFormPaymentMethod("debit");
    setFormCreditCard("");
    setFormInstallments("1");
    setFormPriority("medium");
    setFormDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async () => {
    if (!user || !formAmount || !formDescription) return;
    setSubmitting(true);

    const supabase = createClient();
    const amount = parseFloat(formAmount);
    const installments = parseInt(formInstallments);

    const { data: tx, error } = await supabase
      .from("transactions")
      .insert({
        type: formType,
        amount,
        currency: formCurrency,
        description: formDescription,
        category_id: formCategory || null,
        payment_method: formPaymentMethod,
        credit_card_id: formPaymentMethod === "credit" ? formCreditCard || null : null,
        installments,
        owner_id: user.id,
        priority: formPriority,
        date: formDate,
      })
      .select()
      .single();

    if (!error && tx && formPaymentMethod === "credit" && installments > 1) {
      const installmentAmount = Math.round((amount / installments) * 100) / 100;
      const card = creditCards.find((c) => c.id === formCreditCard);
      const paymentDay = card?.payment_day ?? 1;

      const installmentRows = Array.from({ length: installments }, (_, i) => {
        const dueDate = new Date(formDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        dueDate.setDate(paymentDay);
        return {
          transaction_id: tx.id,
          installment_number: i + 1,
          amount: installmentAmount,
          due_date: dueDate.toISOString().split("T")[0],
          is_paid: false,
        };
      });

      await supabase.from("installment_payments").insert(installmentRows);
    }

    setDialogOpen(false);
    resetForm();
    setSubmitting(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("installment_payments").delete().eq("transaction_id", id);
    await supabase.from("transactions").delete().eq("id", id);
    loadData();
  };

  const filtered =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type === filterType);

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
          <h1 className="text-xl font-medium text-paper">Transacciones</h1>
          <p className="text-steel text-sm mt-1">Registro de ingresos y egresos</p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={filterType}
            onValueChange={(v) => setFilterType(v as "all" | "income" | "expense")}
          >
            <SelectTrigger className="w-40 border-[rgba(250,250,250,0.12)] bg-charcoal text-paper">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-charcoal border-[rgba(250,250,250,0.12)]">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Ingresos</SelectItem>
              <SelectItem value="expense">Egresos</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={<Button className="bg-indigo hover:bg-indigo/90 text-paper cursor-pointer" onClick={resetForm} />}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </DialogTrigger>
            <DialogContent className="bg-charcoal border-[rgba(250,250,250,0.08)] text-paper max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva transaccion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-steel">Tipo</Label>
                    <Select value={formType} onValueChange={(v) => setFormType(v as "income" | "expense")}>
                      <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                        <SelectItem value="income">Ingreso</SelectItem>
                        <SelectItem value="expense">Egreso</SelectItem>
                      </SelectContent>
                    </Select>
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

                <div>
                  <Label className="text-steel">Monto</Label>
                  <Input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>

                <div>
                  <Label className="text-steel">Descripcion / Referencia</Label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ej: Supermercado, Sueldo..."
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>

                <div>
                  <Label className="text-steel">Fecha</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-steel">Metodo de pago</Label>
                    <Select value={formPaymentMethod} onValueChange={(v) => setFormPaymentMethod(v as "debit" | "credit")}>
                      <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                        <SelectItem value="debit">Debito</SelectItem>
                        <SelectItem value="credit">Credito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-steel">Prioridad</Label>
                    <Select value={formPriority} onValueChange={(v) => setFormPriority(v as "high" | "medium" | "low")}>
                      <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formPaymentMethod === "credit" && (
                  <>
                    <div>
                      <Label className="text-steel">Tarjeta de credito</Label>
                      <Select value={formCreditCard} onValueChange={(v) => setFormCreditCard(v ?? "")}>
                        <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                          <SelectValue placeholder="Seleccionar tarjeta" />
                        </SelectTrigger>
                        <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                          {creditCards.map((cc) => (
                            <SelectItem key={cc.id} value={cc.id}>
                              {cc.name} (****{cc.last_four_digits})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-steel">Cuotas</Label>
                      <Input
                        type="number"
                        min="1"
                        max="48"
                        value={formInstallments}
                        onChange={(e) => setFormInstallments(e.target.value)}
                        className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                      />
                    </div>
                  </>
                )}

                {categories.length > 0 && (
                  <div>
                    <Label className="text-steel">Categoria (opcional)</Label>
                    <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? "")}>
                      <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                        <SelectValue placeholder="Sin categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !formAmount || !formDescription}
                  className="w-full bg-indigo hover:bg-indigo/90 text-paper cursor-pointer"
                >
                  {submitting ? "Guardando..." : "Guardar transaccion"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-[rgba(250,250,250,0.08)] bg-charcoal">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-steel">No hay transacciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[rgba(250,250,250,0.08)] hover:bg-transparent">
                    <TableHead className="text-steel">Tipo</TableHead>
                    <TableHead className="text-steel">Descripcion</TableHead>
                    <TableHead className="text-steel">Fecha</TableHead>
                    <TableHead className="text-steel">Metodo</TableHead>
                    <TableHead className="text-steel">Cuotas</TableHead>
                    <TableHead className="text-steel">Prioridad</TableHead>
                    <TableHead className="text-steel text-right">Monto</TableHead>
                    <TableHead className="text-steel w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tx) => (
                    <TableRow key={tx.id} className="border-[rgba(250,250,250,0.08)]">
                      <TableCell>
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center ${
                            tx.type === "income" ? "bg-income-soft" : "bg-expense-soft"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <ArrowUpRight className="w-4 h-4 text-income" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-expense" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-paper font-medium">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-steel">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tx.payment_method === "credit"
                              ? "border-warning/30 text-warning"
                              : "border-[rgba(250,250,250,0.1)] text-steel"
                          }
                        >
                          {tx.payment_method === "credit" ? "Credito" : "Debito"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-steel">
                        {tx.installments > 1 ? `${tx.installments}x` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tx.priority === "high"
                              ? "border-expense/30 text-expense"
                              : tx.priority === "medium"
                              ? "border-warning/30 text-warning"
                              : "border-[rgba(250,250,250,0.1)] text-steel"
                          }
                        >
                          {tx.priority === "high"
                            ? "Alta"
                            : tx.priority === "medium"
                            ? "Media"
                            : "Baja"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums ${
                          tx.type === "income" ? "text-income" : "text-expense"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount, tx.currency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tx.id)}
                          className="text-graphite hover:text-expense cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
