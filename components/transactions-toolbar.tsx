"use client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PlusCircle, Download, Search } from "lucide-react";
import { TransactionDialog } from "./transaction-dialog";
import type { Transaction, Profile } from "../lib/types";
import { exportToCSV } from "../lib/utils";
import { useToast } from "../hooks/use-toast";


interface TransactionsToolbarProps {
  filters: { type: string; searchTerm: string };
  setFilters: React.Dispatch<React.SetStateAction<{ type: string; searchTerm: string }>>;
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateTransaction?: (transactionId: string, profile: Profile, updates: Partial<Omit<Transaction, "id" | "profile">>) => void;
  transactions: Transaction[];
  currentProfile: Profile;
  currentCurrency: string
}

export function TransactionsToolbar({ filters, setFilters, onAddTransaction, onUpdateTransaction, transactions, currentProfile, currentCurrency }: TransactionsToolbarProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (transactions.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no transactions in the current view to export.",
      });
      return;
    }
    exportToCSV(transactions, `transactions-${currentProfile}-${new Date().toISOString().split('T')[0]}`);
    toast({
      title: "Export successful",
      description: "Your transactions have been exported to CSV.",
    });
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4">
      <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="pl-8 md:w-64"
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <Button variant="outline" onClick={handleExport} className="w-full md:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <TransactionDialog
          onAddTransaction={onAddTransaction}
          onUpdateTransaction={onUpdateTransaction}
          currentProfile={currentProfile}
          allTransactions={transactions} // Pass for category suggestions
          currentCurrency={currentCurrency}
        >
          <Button className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Button>
        </TransactionDialog>
      </div>
    </div>
  );
}
