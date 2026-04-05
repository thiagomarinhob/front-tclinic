import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction, formatCurrency } from "@/data/mockFinancialData";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface FinancialChartsProps {
  transactions: Transaction[];
}

const COLORS = [
  "hsl(173, 58%, 39%)", "hsl(210, 80%, 55%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(152, 60%, 42%)", "hsl(270, 50%, 55%)",
  "hsl(200, 60%, 45%)", "hsl(330, 60%, 50%)", "hsl(60, 70%, 45%)",
  "hsl(140, 40%, 50%)",
];

type ChartPeriod = "mensal" | "trimestral" | "anual";

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function getQuarterLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `T${q}/${d.getFullYear().toString().slice(2)}`;
}

function getYearLabel(dateStr: string) {
  return new Date(dateStr + "T00:00:00").getFullYear().toString();
}

export function FinancialCharts({ transactions }: FinancialChartsProps) {
  const [period, setPeriod] = useState<ChartPeriod>("mensal");
  const [chartType, setChartType] = useState<"evolucao" | "categorias">("evolucao");

  const timeSeriesData = useMemo(() => {
    const grouped: Record<string, { receita: number; despesa: number }> = {};
    const keyFn = (d: string) => {
      if (period === "mensal") return d.slice(0, 7);
      if (period === "trimestral") return getQuarterLabel(d);
      return d.slice(0, 4);
    };

    transactions.forEach((t) => {
      const key = keyFn(t.date);
      if (!grouped[key]) grouped[key] = { receita: 0, despesa: 0 };
      if (t.type === "receita") grouped[key].receita += t.amount;
      else grouped[key].despesa += t.amount;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        periodo: period === "mensal" ? getMonthLabel(key + "-01") : key,
        Receitas: Math.round(val.receita),
        Despesas: Math.round(val.despesa),
        Saldo: Math.round(val.receita - val.despesa),
      }));
  }, [transactions, period]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    transactions.forEach((t) => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const expenseCategoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "despesa")
      .forEach((t) => {
        grouped[t.category] = (grouped[t.category] || 0) + t.amount;
      });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const pieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-sm text-primary">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={chartType} onValueChange={(v) => setChartType(v as any)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="evolucao">Evolução Financeira</SelectItem>
            <SelectItem value="categorias">Por Categorias</SelectItem>
          </SelectContent>
        </Select>
        {chartType === "evolucao" && (
          <Select value={period} onValueChange={(v) => setPeriod(v as ChartPeriod)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {chartType === "evolucao" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Receitas vs Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={customTooltip} />
                  <Legend />
                  <Bar dataKey="Receitas" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Evolução do Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={customTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="Saldo" stroke="hsl(173, 58%, 39%)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Receitas" stroke="hsl(152, 60%, 42%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="Despesas" stroke="hsl(0, 72%, 51%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Distribuição por Categoria (Geral)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={pieTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip content={pieTooltip} />
                  <Bar dataKey="value" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
