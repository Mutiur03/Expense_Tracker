"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import type { Transaction } from "../lib/types";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "../hooks/use-toast";
import { Badge } from "./ui/badge";
import { formatCurrency, getCurrencyByCode } from "../lib/currency";
import { TransactionDialog } from "./transaction-dialog";
import React from "react";

interface TransactionsTableProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string, profile: string) => void;
  onUpdateTransaction?: (transactionId: string, profile: string, updates: Partial<Omit<Transaction, "id" | "profile">>) => void;
  sortConfig: { key: keyof Transaction; direction: "asc" | "desc" };
  onSort: (key: keyof Transaction) => void;
  currentCurrency: { code: string; symbol: string; name: string };
}

export function TransactionsTable({ transactions, onDeleteTransaction, onUpdateTransaction, sortConfig, onSort, currentCurrency }: TransactionsTableProps) {
  const { toast } = useToast();
  const [editTransaction, setEditTransaction] = React.useState<Transaction | null>(null);

  const handleDelete = (id: string, profile: Transaction['profile']) => {
    onDeleteTransaction(id, profile);
    toast({
      title: "Transaction Deleted",
      description: "The transaction has been successfully deleted.",
      variant: "destructive"
    });
  };

  const SortableHeader = ({ tKey, label, className }: { tKey: keyof Transaction, label: string, className?: string }) => (
    <Button variant="ghost" onClick={() => onSort(tKey)} className={cn("-ml-4 h-8", className)}>
      {label}
      <ArrowUpDown className={cn("ml-2 h-4 w-4", sortConfig.key === tKey ? "text-primary" : "text-muted-foreground/50")} />
    </Button>
  );

  return (
    <div className="border-t">
      <ScrollArea className="h-[450px] w-full">
        <Table>
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-xs z-10">
            <TableRow>
              <TableHead className="w-[120px]">
                <SortableHeader tKey="date" label="Date" />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>
                <SortableHeader tKey="category" label="Category" />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader tKey="amount" label="Amount" className="justify-end w-full -mr-4" />
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium whitespace-nowrap">{format(new Date(transaction.date), "MMM d, yyyy")}</TableCell>
                  <TableCell className="truncate max-w-[200px] sm:max-w-none">{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold whitespace-nowrap",
                    transaction.type === "income" ? "text-chart-2" : "text-chart-5"
                  )}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(
                      transaction.amount,
                      transaction.currency ? getCurrencyByCode(transaction.currency) : getCurrencyByCode(currentCurrency.code)
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onUpdateTransaction && (
                          <DropdownMenuItem
                            onClick={() => setEditTransaction(transaction)}
                          >
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(transaction.id ?? "", transaction.profile)}
                          className="text-red-500 focus:text-red-500"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No transactions found. Add one to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
      {onUpdateTransaction && editTransaction && (
        <TransactionDialog
          open={!!editTransaction}
          onOpenChange={(open) => !open && setEditTransaction(null)}
          onUpdateTransaction={onUpdateTransaction}
          editTransaction={editTransaction}
          currentProfile={editTransaction.profile}
          allTransactions={transactions}
          currentCurrency={currentCurrency.code}
        />
      )}
    </div>
  );
}
