"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { MoreHorizontal, ArrowUpDown, Receipt } from "lucide-react";
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
      {/* Mobile-first responsive container */}
      <div className="relative">
        <div className="overflow-auto h-[280px] sm:h-[400px] lg:h-[450px] w-full">
          <Table className="min-w-[580px] sm:min-w-[700px] w-full">
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow>
                <TableHead className="w-[100px] sm:w-[120px] min-w-[90px] bg-background p-2 sm:p-4">
                  <SortableHeader tKey="date" label="Date" />
                </TableHead>
                <TableHead className="w-[160px] sm:w-[200px] min-w-[140px] bg-background p-2 sm:p-4">Description</TableHead>
                <TableHead className="w-[110px] sm:w-[140px] min-w-[100px] bg-background p-2 sm:p-4">
                  <SortableHeader tKey="category" label="Category" />
                </TableHead>
                <TableHead className="w-[100px] sm:w-[120px] min-w-[90px] text-right bg-background p-2 sm:p-4">
                  <SortableHeader tKey="amount" label="Amount" className="justify-end w-full -mr-2 sm:-mr-4" />
                </TableHead>
                <TableHead className="w-[50px] sm:w-[60px] min-w-[45px] bg-background text-center p-1 sm:p-4">
                  <span className="sr-only sm:not-sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-teal-50/30">
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap p-2 sm:p-4">
                      <div className="flex flex-col">
                        <span>{format(new Date(transaction.date), "MMM d")}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {format(new Date(transaction.date), "yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 p-2 sm:p-4">
                      <div className="max-w-[140px] sm:max-w-[180px]">
                        <p
                          className="font-medium text-xs sm:text-sm text-teal-700 truncate cursor-help leading-tight"
                          title={transaction.description}
                        >
                          {transaction.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="p-1 sm:p-4">
                      <div className="max-w-[90px] sm:max-w-[120px]">
                        <Badge
                          variant="secondary"
                          className="bg-teal-100 text-teal-700 border-teal-200 truncate w-full justify-center cursor-help text-xs px-1 sm:px-2 py-0.5"
                          title={transaction.category}
                        >
                          {transaction.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap text-xs sm:text-sm p-2 sm:p-4">
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(
                            Number(transaction.amount),
                            transaction.currency ? getCurrencyByCode(transaction.currency) : getCurrencyByCode(currentCurrency.code)
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-1 sm:p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-teal-50">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onUpdateTransaction && (
                            <DropdownMenuItem
                              onClick={() => setEditTransaction(transaction)}
                              className="hover:bg-teal-50 text-xs sm:text-sm"
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(transaction.id ?? "", transaction.profile)}
                            className="text-rose-600 focus:text-rose-600 hover:bg-rose-50 text-xs sm:text-sm"
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
                  <TableCell colSpan={5} className="h-16 sm:h-24 text-center text-muted-foreground p-4">
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-teal-300" />
                      <p className="text-xs sm:text-sm">No transactions found. Add one to get started!</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile scroll indicators */}
        {transactions.length > 0 && (
          <div className="sm:hidden absolute bottom-1 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              ← Scroll →
            </div>
          </div>
        )}
      </div>

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
