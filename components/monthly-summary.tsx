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
        const amount = Number(transaction.amount); // Ensure it's a number
        if (transaction.type === "income") {
          acc.totalIncome += amount;
        } else {
          acc.totalExpenses += amount;
        }
        acc.netBalance = acc.totalIncome - acc.totalExpenses;
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
    );
  }, [transactions]);

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
      <Card className="border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700">Income</CardTitle>
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
        </CardHeader>
        <CardContent>
          {isLoaded ? (
            <div className="text-xl sm:text-2xl font-bold text-emerald-700">{formatCurrency(totalIncome, currentCurrency)}</div>
          ) : (
            <Skeleton className="h-6 sm:h-8 w-3/4" />
          )}
        </CardContent>
      </Card>

      <Card className="border-rose-200/50 bg-gradient-to-br from-rose-50 to-rose-100/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-rose-700">Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
        </CardHeader>
        <CardContent>
          {isLoaded ? (
            <div className="text-xl sm:text-2xl font-bold text-rose-700">{formatCurrency(totalExpenses, currentCurrency)}</div>
          ) : (
            <Skeleton className="h-6 sm:h-8 w-3/4" />
          )}
        </CardContent>
      </Card>

      <Card className="border-teal-200/50 bg-gradient-to-br from-teal-50 via-blue-50 to-teal-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-teal-700">Balance</CardTitle>
          <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
        </CardHeader>
        <CardContent>
          {isLoaded ? (
            <div className={`text-xl sm:text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(netBalance, currentCurrency)}
            </div>
          ) : (
            <Skeleton className="h-6 sm:h-8 w-3/4" />
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
        const amount = Number(transaction.amount); // Ensure it's a number
        if (transaction.type === "income") {
          acc.totalIncome += amount;
        } else {
          acc.totalExpenses += amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0 }
    );
  }, [transactions]);

  const chartData = [
    { name: "Income", value: totalIncome, fill: "#10b981" },
    { name: "Expenses", value: totalExpenses, fill: "#f43f5e" },
  ];

  const chartConfig = {
    value: {
      label: "Amount",
    },
    income: {
      label: "Income",
      color: "#10b981",
    },
    expenses: {
      label: "Expenses",
      color: "#f43f5e",
    }
  }

  return (
    <Card className="border-teal-200/50">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg text-teal-700">Income vs. Expenses</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-teal-600/70">
          A visual breakdown of your monthly finances.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {isLoaded ? (
          <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={window.innerWidth < 640 ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${currentCurrency.symbol}${value > 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
                />
                <Tooltip
                  cursor={{ fill: "hsla(var(--teal-200))", radius: 8 }}
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number, currentCurrency)} />}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] sm:h-[250px]">
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
// }
