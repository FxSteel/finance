"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  ArrowDown,
} from "lucide-react";
import type { Transaction, Category, CreditCard, InstallmentPayment, Profile } from "@/types/database";

function addMonthsToDate(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1 + months, d);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [formPaymentMethod, setFormPaymentMethod] = useState<"debit" | "credit" | "transfer">("debit");
  const [formNotes, setFormNotes] = useState("");
  const [formCreditCard, setFormCreditCard] = useState("");
  const [formInstallments, setFormInstallments] = useState("1");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [detailInstallments, setDetailInstallments] = useState<InstallmentPayment[]>([]);
  const [detailOwner, setDetailOwner] = useState<Profile | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailNotes, setDetailNotes] = useState("");
  const [detailEditing, setDetailEditing] = useState(false);
  const [editPaymentMethod, setEditPaymentMethod] = useState<"debit" | "credit" | "transfer">("debit");
  const [editCategory, setEditCategory] = useState("");
  const [savingDetail, setSavingDetail] = useState(false);
  const [editFirstInstallmentDate, setEditFirstInstallmentDate] = useState("");
  const [installmentsOpen, setInstallmentsOpen] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [txRes, catRes, ccRes] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("credit_cards_secure").select("*").order("name"),
    ]);
    setTransactions((txRes.data as Transaction[]) ?? []);
    setCategories((catRes.data as Category[]) ?? []);
    setCreditCards((ccRes.data as CreditCard[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const detailId = searchParams.get("detail");
    if (!detailId || transactions.length === 0 || detailTx) return;
    const tx = transactions.find((t) => t.id === detailId);
    if (!tx) return;
    openDetail(tx);
    router.replace("/transactions", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, transactions]);

  const resetForm = () => {
    setFormType("expense");
    setFormAmount("");
    setFormDescription("");
    setFormCurrency("CLP");
    setFormCategory("");
    setFormPaymentMethod("debit");
    setFormCreditCard("");
    setFormInstallments("1");
    setFormNotes("");
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
        notes: formNotes || null,
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
    toast.success("Transaccion creada exitosamente");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const supabase = createClient();
    await supabase.from("installment_payments").delete().eq("transaction_id", deleteTarget.id);
    await supabase.from("transactions").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    loadData();
    toast.success("Transaccion eliminada");
  };

  const openDetail = async (tx: Transaction) => {
    setDetailTx(tx);
    setDetailNotes(tx.notes ?? "");
    setDetailEditing(false);
    setEditPaymentMethod(tx.payment_method);
    setEditCategory(tx.category_id ?? "");
    setDetailLoading(true);
    const supabase = createClient();

    const [installRes, ownerRes] = await Promise.all([
      tx.installments > 1
        ? supabase
            .from("installment_payments")
            .select("*")
            .eq("transaction_id", tx.id)
            .order("installment_number")
        : Promise.resolve({ data: [] }),
      supabase
        .from("profiles")
        .select("*")
        .eq("id", tx.owner_id)
        .single(),
    ]);

    const installments = (installRes.data as InstallmentPayment[]) ?? [];
    setDetailInstallments(installments);
    setDetailOwner((ownerRes.data as Profile) ?? null);
    if (installments.length > 0) {
      setEditFirstInstallmentDate(installments[0].due_date.split("T")[0]);
    }
    setDetailLoading(false);
  };

  const hasDetailChanges = detailTx && (
    detailNotes !== (detailTx.notes ?? "") ||
    editPaymentMethod !== detailTx.payment_method ||
    editCategory !== (detailTx.category_id ?? "") ||
    (detailInstallments.length > 0 && editFirstInstallmentDate !== detailInstallments[0].due_date.split("T")[0])
  );

  const handleUpdateDetail = async () => {
    if (!detailTx) return;
    setSavingDetail(true);
    const supabase = createClient();
    const notes = detailNotes.trim() || null;
    const category_id = editCategory || null;
    const updated = { notes, payment_method: editPaymentMethod, category_id };
    await supabase.from("transactions").update(updated).eq("id", detailTx.id);

    // Update installment dates if first date changed
    if (detailInstallments.length > 0 && editFirstInstallmentDate !== detailInstallments[0].due_date.split("T")[0]) {
      const updates = detailInstallments.map((inst, i) => {
        const newDate = addMonthsToDate(editFirstInstallmentDate, i);
        return supabase
          .from("installment_payments")
          .update({ due_date: newDate })
          .eq("id", inst.id);
      });
      await Promise.all(updates);
      setDetailInstallments((prev) =>
        prev.map((inst, i) => ({
          ...inst,
          due_date: addMonthsToDate(editFirstInstallmentDate, i),
        }))
      );
    }

    const newTx = { ...detailTx, ...updated };
    setDetailTx(newTx);
    setTransactions((prev) => prev.map((t) => t.id === detailTx.id ? { ...t, ...updated } : t));
    setDetailEditing(false);
    setSavingDetail(false);
    toast.success("Transaccion actualizada");
  };

  const filtered =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type === filterType);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

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
            onValueChange={(v) => { setFilterType(v as "all" | "income" | "expense"); setPage(1); }}
          >
            <SelectTrigger className="w-40 border-[rgba(250,250,250,0.12)] bg-charcoal text-paper">
              <SelectValue>
                {filterType === "all" ? "Todos" : filterType === "income" ? "Ingresos" : "Egresos"}
              </SelectValue>
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
                    <Label className="text-steel">Tipo <span className="text-expense">*</span></Label>
                    <Select value={formType} onValueChange={(v) => setFormType(v as "income" | "expense")}>
                      <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                        <SelectValue>
                          {formType === "income" ? "Ingreso" : "Egreso"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                        <SelectItem value="income">Ingreso</SelectItem>
                        <SelectItem value="expense">Egreso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-steel">Moneda <span className="text-expense">*</span></Label>
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
                  <Label className="text-steel">Monto <span className="text-expense">*</span></Label>
                  <Input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>

                <div>
                  <Label className="text-steel">Descripcion / Referencia <span className="text-expense">*</span></Label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ej: Supermercado, Sueldo..."
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>

                <div>
                  <Label className="text-steel">Fecha <span className="text-expense">*</span></Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                  />
                </div>

                <div>
                  <Label className="text-steel">Metodo de pago <span className="text-expense">*</span></Label>
                  <Select value={formPaymentMethod} onValueChange={(v) => setFormPaymentMethod(v as "debit" | "credit" | "transfer")}>
                    <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                      <SelectValue>
                        {formPaymentMethod === "credit" ? "Credito" : formPaymentMethod === "transfer" ? "Transferencia" : "Debito"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                      <SelectItem value="debit">Debito</SelectItem>
                      <SelectItem value="credit">Credito</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formPaymentMethod === "credit" && (
                  <>
                    <div>
                      <Label className="text-steel">Tarjeta de credito <span className="text-expense">*</span></Label>
                      <Select value={formCreditCard} onValueChange={(v) => setFormCreditCard(v ?? "")}>
                        <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                          <SelectValue>
                            {formCreditCard
                              ? (() => { const cc = creditCards.find((c) => c.id === formCreditCard); return cc ? `${cc.name} (****${cc.last_four_digits})` : "Seleccionar tarjeta"; })()
                              : "Seleccionar tarjeta"}
                          </SelectValue>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-steel">Cuotas <span className="text-expense">*</span></Label>
                        <Input
                          type="number"
                          min="1"
                          max="48"
                          value={formInstallments}
                          onChange={(e) => setFormInstallments(e.target.value)}
                          className="border-[rgba(250,250,250,0.12)] bg-ink mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-steel">Valor cuota</Label>
                        <Input
                          type="text"
                          readOnly
                          value={
                            formAmount && parseInt(formInstallments) > 0
                              ? formatCurrency(Math.round(parseFloat(formAmount) / parseInt(formInstallments)), formCurrency)
                              : "-"
                          }
                          className="border-[rgba(250,250,250,0.12)] bg-ink mt-1 text-steel"
                        />
                      </div>
                    </div>
                  </>
                )}

                {categories.length > 0 && (
                  <div>
                    <Label className="text-steel">Categoria</Label>
                    <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? "")}>
                      <SelectTrigger className="border-[rgba(250,250,250,0.12)] bg-ink mt-1">
                        <SelectValue>
                          {formCategory
                            ? categories.find((c) => c.id === formCategory)?.name ?? "Sin categoria"
                            : "Sin categoria"}
                        </SelectValue>
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

                <div>
                  <Label className="text-steel">Notas</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Contexto adicional de la transaccion..."
                    rows={2}
                    className="border-[rgba(250,250,250,0.12)] bg-ink mt-1 resize-none"
                  />
                </div>

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
            <div>
              <Table maxHeight="calc(100vh - 16rem)">
                <TableHeader className="sticky top-0 z-10 bg-charcoal">
                  <TableRow className="border-[rgba(250,250,250,0.08)] hover:bg-transparent">
                    <TableHead className="text-steel bg-charcoal pl-4">Tipo</TableHead>
                    <TableHead className="text-steel bg-charcoal">Descripcion</TableHead>
                    <TableHead className="text-steel bg-charcoal">Fecha</TableHead>
                    <TableHead className="text-steel bg-charcoal">Metodo</TableHead>
                    <TableHead className="text-steel bg-charcoal">Cuotas</TableHead>
                    <TableHead className="text-steel bg-charcoal">Moneda</TableHead>
                    <TableHead className="text-steel !text-right bg-charcoal pr-4">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((tx) => (
                    <TableRow key={tx.id} className="border-[rgba(250,250,250,0.08)]">
                      <TableCell className="pl-4">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center ${
                            tx.type === "income" ? "bg-income-soft" : "bg-expense-soft"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <TrendingUp className="w-4 h-4 text-income" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-expense" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => openDetail(tx)}
                          className="text-paper font-medium hover:text-indigo transition-colors cursor-pointer text-left"
                        >
                          {tx.description}
                        </button>
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
                              : tx.payment_method === "transfer"
                              ? "border-indigo/30 text-indigo"
                              : "border-[rgba(250,250,250,0.1)] text-steel"
                          }
                        >
                          {tx.payment_method === "credit" ? "Credito" : tx.payment_method === "transfer" ? "Transferencia" : "Debito"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-steel">
                        {tx.installments > 1 ? `${tx.installments}x` : "-"}
                      </TableCell>
                      <TableCell className="text-steel">{tx.currency}</TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums pr-4 ${
                          tx.type === "income" ? "text-income" : "text-expense"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount, tx.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(250,250,250,0.08)]">
              <div className="flex items-center gap-2">
                <span className="text-steel text-xs md:text-sm">Filas:</span>
                <Select
                  value={String(perPage)}
                  onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}
                >
                  <SelectTrigger className="w-16 md:w-20 h-8 border-[rgba(250,250,250,0.12)] bg-ink text-paper text-xs md:text-sm">
                    <SelectValue>{perPage}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-steel text-xs md:text-sm tabular-nums">
                  {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} de {filtered.length}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 text-steel hover:text-paper cursor-pointer disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 w-8 text-steel hover:text-paper cursor-pointer disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-charcoal border-[rgba(250,250,250,0.08)] text-paper max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar transaccion</DialogTitle>
          </DialogHeader>
          <p className="text-steel text-sm mt-2">
            ¿Estas seguro de eliminar{" "}
            <span className="text-paper font-medium">{deleteTarget?.description}</span>
            {" "}por{" "}
            <span className="text-paper font-medium">
              {deleteTarget && formatCurrency(deleteTarget.amount, deleteTarget.currency)}
            </span>
            ? Esta accion no se puede deshacer.
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

      {/* Detail Drawer */}
      <Sheet open={!!detailTx} onOpenChange={(open) => !open && setDetailTx(null)}>
        <SheetContent
          side="right"
          className="bg-charcoal border-[rgba(250,250,250,0.08)] text-paper sm:!max-w-2xl overflow-y-auto"
        >
          <SheetHeader className="border-b border-[rgba(250,250,250,0.08)] pb-4">
            <SheetTitle className="text-paper">Detalle de transaccion</SheetTitle>
          </SheetHeader>

          {detailTx && (
            <div className="p-4 space-y-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          detailTx.type === "income" ? "bg-income-soft" : "bg-expense-soft"
                        }`}
                      >
                        {detailTx.type === "income" ? (
                          <TrendingUp className="w-5 h-5 text-income" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-expense" />
                        )}
                      </div>
                      <div>
                        <p className="text-paper font-medium text-lg">{detailTx.description}</p>
                        <p className="text-steel text-sm">
                          {detailTx.type === "income" ? "Ingreso" : "Egreso"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDetailEditing(!detailEditing)}
                      className={`cursor-pointer h-9 w-9 ${detailEditing ? "text-indigo bg-indigo/10" : "text-steel hover:text-paper"}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Amount */}
                  <div className="bg-[rgba(250,250,250,0.04)] rounded-lg p-4">
                    <p
                      className={`text-2xl font-medium tabular-nums ${
                        detailTx.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {detailTx.currency} {detailTx.type === "income" ? "+" : "-"}{formatCurrency(detailTx.amount, detailTx.currency)}
                    </p>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-[rgba(250,250,250,0.04)] rounded-lg p-4">
                    <DetailCell label="Fecha" value={formatDate(detailTx.date)} />

                    {detailEditing ? (
                      <div>
                        <span className="text-steel text-xs block mb-1">Metodo de pago</span>
                        <Select value={editPaymentMethod} onValueChange={(v) => setEditPaymentMethod(v as "debit" | "credit" | "transfer")}>
                          <SelectTrigger className="w-full h-8 border-[rgba(250,250,250,0.12)] bg-ink text-paper text-sm">
                            <SelectValue>
                              {editPaymentMethod === "credit" ? "Credito" : editPaymentMethod === "transfer" ? "Transferencia" : "Debito"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                            <SelectItem value="debit">Debito</SelectItem>
                            <SelectItem value="credit">Credito</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <DetailCell
                        label="Metodo de pago"
                        value={
                          detailTx.payment_method === "credit"
                            ? "Tarjeta de credito"
                            : detailTx.payment_method === "transfer"
                            ? "Transferencia"
                            : "Tarjeta de debito"
                        }
                      />
                    )}

                    {detailTx.payment_method === "credit" && detailTx.credit_card_id && (
                      <DetailCell
                        label="Tarjeta"
                        value={
                          (() => {
                            const card = creditCards.find((c) => c.id === detailTx.credit_card_id);
                            return card ? `${card.name} (****${card.last_four_digits})` : "-";
                          })()
                        }
                      />
                    )}

                    {detailEditing ? (
                      <div>
                        <span className="text-steel text-xs block mb-1">Categoria</span>
                        <Select value={editCategory} onValueChange={(v) => setEditCategory(v ?? "")}>
                          <SelectTrigger className="w-full h-8 border-[rgba(250,250,250,0.12)] bg-ink text-paper text-sm">
                            <SelectValue>
                              {editCategory ? categories.find((c) => c.id === editCategory)?.name ?? "Sin categoria" : "Sin categoria"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-ink border-[rgba(250,250,250,0.12)]">
                            <SelectItem value="">Sin categoria</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <DetailCell
                        label="Categoria"
                        value={
                          detailTx.category_id
                            ? categories.find((c) => c.id === detailTx.category_id)?.name ?? "Sin categoria"
                            : "Sin categoria"
                        }
                      />
                    )}

                    <div className="col-span-2">
                      <DetailCell
                        label="Realizada por"
                        value={detailOwner?.full_name ?? detailOwner?.email ?? "-"}
                      />
                    </div>
                  </div>

                  {/* Installments */}
                  {detailTx.installments > 1 && detailInstallments.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setInstallmentsOpen(!installmentsOpen)}
                        className="flex items-center justify-between w-full cursor-pointer"
                      >
                        <p className="text-steel text-xs uppercase tracking-wide">
                          Cuotas ({detailInstallments.filter((i) => i.is_paid).length}/{detailTx.installments} pagadas)
                        </p>
                        <div className="flex items-center gap-2 flex-1 ml-3">
                          <div className="flex-1 h-px bg-[rgba(250,250,250,0.08)]" />
                          <ArrowDown className={`w-4 h-4 text-steel transition-transform duration-200 ${installmentsOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {installmentsOpen && (
                        <div className="space-y-1.5 mt-2">
                          {detailInstallments.map((inst, idx) => {
                            let displayDate = inst.due_date.split("T")[0];
                            if (detailEditing && editFirstInstallmentDate !== detailInstallments[0].due_date.split("T")[0]) {
                              displayDate = addMonthsToDate(editFirstInstallmentDate, idx);
                            }
                            return (
                              <div
                                key={inst.id}
                                className={`flex items-center justify-between p-2.5 rounded-md text-sm ${
                                  inst.is_paid
                                    ? "bg-income-soft/50"
                                    : "bg-[rgba(250,250,250,0.04)]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      inst.is_paid ? "bg-income" : "bg-steel/40"
                                    }`}
                                  />
                                  <span className="text-paper">Cuota {inst.installment_number}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {detailEditing && idx === 0 ? (
                                    <input
                                      type="date"
                                      value={editFirstInstallmentDate}
                                      onChange={(e) => setEditFirstInstallmentDate(e.target.value)}
                                      className="bg-ink border border-[rgba(250,250,250,0.12)] rounded px-2 py-0.5 text-paper text-xs"
                                    />
                                  ) : (
                                    <span className="text-steel text-xs">{formatDate(displayDate)}</span>
                                  )}
                                  <span className="text-paper tabular-nums">
                                    {formatCurrency(inst.amount, detailTx.currency)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <p className="text-steel text-xs uppercase tracking-wide mb-2">Notas</p>
                    <Textarea
                      value={detailNotes}
                      onChange={(e) => setDetailNotes(e.target.value)}
                      placeholder="Agregar notas..."
                      rows={3}
                      className="border-[rgba(250,250,250,0.12)] bg-[rgba(250,250,250,0.04)] text-paper text-sm resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-[rgba(250,250,250,0.08)] space-y-2">
                    <Button
                      onClick={() => { setDeleteTarget(detailTx); setDetailTx(null); }}
                      className="w-full bg-expense/10 hover:bg-expense/20 text-expense cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar transaccion
                    </Button>
                    {hasDetailChanges && (
                      <Button
                        onClick={handleUpdateDetail}
                        disabled={savingDetail}
                        className="w-full bg-indigo hover:bg-indigo/90 text-paper cursor-pointer"
                      >
                        {savingDetail ? "Guardando..." : "Actualizar transaccion"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-steel text-xs block mb-0.5">{label}</span>
      <span className="text-paper text-sm font-medium">{value}</span>
    </div>
  );
}
