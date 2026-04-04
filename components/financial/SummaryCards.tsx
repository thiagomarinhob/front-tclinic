import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, Transaction } from "@/data/mockFinancialData";
import { TrendingUp, TrendingDown, DollarSign, Clock } from "lucide-react";

interface SummaryCardsProps {
  transactions: Transaction[];
  /** Quando informado, usa o total do dashboard do backend (apenas transações PAGO no período) */
  totalReceita?: number;
  /** Quando informado, usa o total do dashboard do backend (apenas transações PAGO no período) */
  totalDespesa?: number;
}

export function SummaryCards({ transactions, totalReceita: totalReceitaOverride, totalDespesa: totalDespesaOverride }: SummaryCardsProps) {
  const totalReceita =
    totalReceitaOverride ??
    transactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0);
  const totalDespesa =
    totalDespesaOverride ??
    transactions.filter((t) => t.type === "despesa").reduce((sum, t) => sum + t.amount, 0);
  const saldo = totalReceita - totalDespesa;
  const totalTransacoes = transactions.length;

  const cards = [
    {
      title: "Total Receitas",
      value: formatCurrency(totalReceita),
      icon: TrendingUp,
      colorClass: "text-success",
      bgClass: "bg-success/10",
    },
    {
      title: "Total Despesas",
      value: formatCurrency(totalDespesa),
      icon: TrendingDown,
      colorClass: "text-destructive",
      bgClass: "bg-destructive/10",
    },
    {
      title: "Saldo",
      value: formatCurrency(saldo),
      icon: DollarSign,
      colorClass: saldo >= 0 ? "text-success" : "text-destructive",
      bgClass: saldo >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
    {
      title: "Transações",
      value: totalTransacoes.toString(),
      icon: Clock,
      colorClass: "text-info",
      bgClass: "bg-info/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                <p className={`text-2xl font-bold mt-1 ${card.colorClass}`}>{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgClass}`}>
                <card.icon className={`h-5 w-5 ${card.colorClass}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
