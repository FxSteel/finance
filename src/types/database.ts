export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          icon: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          icon?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          icon?: string | null;
        };
        Relationships: [];
      };
      credit_cards: {
        Row: {
          id: string;
          name: string;
          last_four_digits: string;
          type: "credit" | "debit";
          payment_day: number;
          closing_day: number;
          credit_limit: number | null;
          credit_limit_usd: number | null;
          currency: "CLP" | "USD" | "both";
          color: string;
          owner_id: string;
          paid_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          last_four_digits: string;
          type?: "credit" | "debit";
          payment_day: number;
          closing_day: number;
          credit_limit?: number | null;
          credit_limit_usd?: number | null;
          currency?: "CLP" | "USD" | "both";
          color?: string;
          owner_id: string;
          paid_until?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          last_four_digits?: string;
          type?: "credit" | "debit";
          payment_day?: number;
          closing_day?: number;
          credit_limit?: number | null;
          credit_limit_usd?: number | null;
          currency?: "CLP" | "USD" | "both";
          color?: string;
          paid_until?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          type: "income" | "expense";
          amount: number;
          currency: "CLP" | "USD";
          description: string;
          category_id: string | null;
          payment_method: "debit" | "credit" | "transfer";
          credit_card_id: string | null;
          installments: number;
          owner_id: string;
          notes: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "income" | "expense";
          amount: number;
          currency?: "CLP" | "USD";
          description: string;
          category_id?: string | null;
          payment_method?: "debit" | "credit" | "transfer";
          credit_card_id?: string | null;
          installments?: number;
          owner_id: string;
          notes?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          type?: "income" | "expense";
          amount?: number;
          currency?: "CLP" | "USD";
          description?: string;
          category_id?: string | null;
          payment_method?: "debit" | "credit" | "transfer";
          credit_card_id?: string | null;
          installments?: number;
          notes?: string | null;
          date?: string;
        };
        Relationships: [];
      };
      installment_payments: {
        Row: {
          id: string;
          transaction_id: string;
          installment_number: number;
          amount: number;
          due_date: string;
          is_paid: boolean;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          installment_number: number;
          amount: number;
          due_date: string;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          is_paid?: boolean;
          paid_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type InstallmentPayment = Database["public"]["Tables"]["installment_payments"]["Row"];
