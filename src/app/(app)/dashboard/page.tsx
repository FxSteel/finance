"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
} from "lucide-react";
import type { Transaction, InstallmentPayment } from "@/types/database";

type InstallmentWithTransaction = InstallmentPayment & {
  transactions: Pick<Transaction, "description" | "currency" | "credit_card_id">;
};

export default function DashboardPage() {
  const [monthIncome, setMonthIncome] = useState(0);
  const [monthExpenses, setMonthExpenses] = useState(0);
  const [pendingPayments, setPendingPayments] = useState<InstallmentWithTransaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const supabase = createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const [incomeRes, expenseRes, pendingRes, recentRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("amount")
        .eq("type", "income")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth),
      supabase
        .from("transactions")
        .select("amount")
        .eq("type", "expense")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth),
      supabase
        .from("installment_payments")
        .select("*, transactions(description, currency, credit_card_id)")
        .eq("is_paid", false)
        .gte("due_date", now.toISOString().split("T")[0])
        .order("due_date", { ascending: true })
        .limit(10),
      supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(8),
    ]);

    const totalIncome = (incomeRes.data ?? []).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = (expenseRes.data ?? []).reduce((sum, t) => sum + t.amount, 0);

    setMonthIncome(totalIncome);
    setMonthExpenses(totalExpenses);
    setPendingPayments((pendingRes.data as InstallmentWithTransaction[]) ?? []);
    setRecentTransactions((recentRes.data as Transaction[]) ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const balance = monthIncome - monthExpenses;

  return (
    <div className="space-y-8 pt-12 md:pt-0">
      <div>
        <h1 className="text-xl font-medium text-paper">Dashboard</h1>
        <p className="text-steel text-sm mt-1">Resumen financiero del mes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[rgba(250,250,250,0.08)] bg-charcoal">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-steel uppercase tracking-wide">Ingresos del mes</p>
                <p className="text-2xl font-medium text-income mt-1 tabular-nums tracking-tight">
                  {formatCurrency(monthIncome)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-income-soft flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-income" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[rgba(250,250,250,0.08)] bg-charcoal">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-steel uppercase tracking-wide">Egresos del mes</p>
                <p className="text-2xl font-medium text-expense mt-1 tabular-nums tracking-tight">
                  {formatCurrency(monthExpenses)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-expense-soft flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-expense" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[rgba(250,250,250,0.08)] bg-charcoal">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-steel uppercase tracking-wide">Balance</p>
                <p
                  className={`text-2xl font-medium mt-1 tabular-nums tracking-tight ${
                    balance >= 0 ? "text-brass" : "text-expense"
                  }`}
                >
                  {formatCurrency(balance)}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  balance >= 0 ? "bg-[#2A2518]" : "bg-expense-soft"
                }`}
              >
                <CreditCard
                  className={`w-5 h-5 ${balance >= 0 ? "text-brass" : "text-expense"}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <Card className="border-[rgba(250,250,250,0.08)] bg-charcoal">
          <CardHeader>
            <CardTitle className="text-paper text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Proximos pagos pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <p className="text-steel text-sm py-4 text-center">
                No hay pagos pendientes
              </p>
            ) : (
              <div className="space-y-2">
                {pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[rgba(250,250,250,0.04)]"
                  >
                    <div>
                      <p className="text-sm font-medium text-paper">
                        {payment.transactions.description}
                      </p>
                      <p className="text-xs text-steel mt-0.5">
                        Cuota {payment.installment_number} &middot; Vence{" "}
                        {formatDate(payment.due_date)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-warning tabular-nums">
                      {formatCurrency(
                        payment.amount,
                        payment.transactions.currency as "CLP" | "USD"
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-[rgba(250,250,250,0.08)] bg-charcoal">
          <CardHeader>
            <CardTitle className="text-paper text-base font-medium flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-indigo" />
              Transacciones recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-steel text-sm py-4 text-center">
                No hay transacciones aun
              </p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[rgba(250,250,250,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center ${
                          tx.type === "income"
                            ? "bg-income-soft"
                            : "bg-expense-soft"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpRight className="w-4 h-4 text-income" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-expense" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-paper">
                          {tx.description}
                        </p>
                        <p className="text-xs text-steel mt-0.5">
                          {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium tabular-nums ${
                          tx.type === "income"
                            ? "text-income"
                            : "text-expense"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount, tx.currency)}
                      </p>
                      {tx.payment_method === "credit" && (
                        <Badge variant="outline" className="text-xs border-[rgba(250,250,250,0.1)] text-steel mt-1">
                          Credito
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
