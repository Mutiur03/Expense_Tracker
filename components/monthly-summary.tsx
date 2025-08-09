"use client"

import * as React from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Skeleton } from "./ui/skeleton"
import { TrendingUp, TrendingDown, Scale } from "lucide-react"
import type { Transaction } from "../lib/types"
import { ChartContainer, ChartTooltipContent } from "./ui/chart"
import { Currency, formatCurrency } from "../lib/currency"

interface MonthlySummaryProps {
  transactions: Transaction[];
  isLoaded: boolean;
  currentCurrency: Currency;
}

export function MonthlySummaryCards({ transactions, isLoaded, currentCurrency }: MonthlySummaryProps) {

  const { totalIncome, totalExpenses, netBalance } = React.useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "income") {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpenses += transaction.amount;
        }
        acc.netBalance = acc.totalIncome - acc.totalExpenses;
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
    );
  }, [transactions]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <TrendingUp className="h-5 w-5 text-chart-2" />
        </CardHeader>
        <CardContent>
          {isLoaded ? (
            <div className="text-2xl font-bold">{formatCurrency(totalIncome, currentCurrency)}</div>
          ) : (
            <Skeleton className="h-8 w-3/4" />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <TrendingDown className="h-5 w-5 text-chart-5" />
        </CardHeader>
        <CardContent>
          {isLoaded ? (
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, currentCurrency)}</div>
          ) : (
            <Skeleton className="h-8 w-3/4" />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <Scale className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoaded ? (
            <div className="text-2xl font-bold">{formatCurrency(netBalance, currentCurrency)}</div>
          ) : (
            <Skeleton className="h-8 w-3/4" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function MonthlySummaryChart({ transactions, isLoaded, currentCurrency }: MonthlySummaryProps) {

  const { totalIncome, totalExpenses } = React.useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "income") {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpenses += transaction.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0 }
    );
  }, [transactions]);

  const chartData = [
    { name: "Income", value: totalIncome, fill: "hsl(var(--chart-2))" },
    { name: "Expenses", value: totalExpenses, fill: "hsl(var(--chart-5))" },
  ];

  const chartConfig = {
    value: {
      label: "Amount",
    },
    income: {
      label: "Income",
      color: "hsl(var(--chart-2))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-5))",
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs. Expenses</CardTitle>
        <CardDescription>A visual breakdown of your monthly finances.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoaded ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currentCurrency.symbol}${value}`} />
              <Tooltip
                cursor={{ fill: "hsla(var(--accent))", radius: 8 }}
                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number, currentCurrency)} />}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px]">
            <Skeleton className="w-full h-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// // Keep the original component for backward compatibility
// export function MonthlySummary({ transactions, isLoaded }: MonthlySummaryProps) {
//   return (
//     <div className="grid gap-8">
//       <MonthlySummaryCards transactions={transactions} isLoaded={isLoaded} />
//       <MonthlySummaryChart transactions={transactions} isLoaded={isLoaded} />
//     </div>
//   );
// }
