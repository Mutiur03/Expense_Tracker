"use client";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CustomCalendar } from "./Calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { cn } from "../lib/utils";
import type { Transaction, Profile } from "../lib/types";
import { useToast } from "../hooks/use-toast";

type TransactionFormData = {
  type: "income" | "expense";
  amount: number;
  date: Date;
  description: string;
  category: string;
  profile: Profile;
};

type ValidationErrors = {
  [K in keyof TransactionFormData]?: string;
};

const validateTransaction = (data: any): { isValid: boolean; errors: ValidationErrors } => {
  const errors: ValidationErrors = {};

  if (!data.type || !["income", "expense"].includes(data.type)) {
    errors.type = "Please select a transaction type.";
  }

  const amount = Number(data.amount);
  if (!amount || amount <= 0) {
    errors.amount = "Amount must be positive.";
  }

  if (!data.date || !(data.date instanceof Date)) {
    errors.date = "Please select a date.";
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Description is required.";
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.category = "Category is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

interface TransactionDialogProps {
  children?: React.ReactNode;
  onAddTransaction?: (transaction: Transaction) => void;
  onUpdateTransaction?: (transactionId: string, profile: Profile, updates: Partial<Omit<Transaction, "id" | "profile">>) => void;
  editTransaction?: Transaction | null;
  currentProfile: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Add new prop for all transactions (for category suggestions)
  allTransactions?: Transaction[];
  currentCurrency: string;
}

export function TransactionDialog({
  children,
  onAddTransaction,
  onUpdateTransaction,
  editTransaction,
  currentProfile,
  open: controlledOpen,
  onOpenChange,
  allTransactions = [],
  currentCurrency
}: TransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();

  const isEdit = !!editTransaction;
  const dialogOpen = controlledOpen !== undefined ? controlledOpen : open;
  const setDialogOpen = onOpenChange || setOpen;

  const form = useForm<TransactionFormData>({
    defaultValues: {
      type: editTransaction?.type || "expense",
      amount: editTransaction?.amount || 0,
      date: editTransaction ? new Date(editTransaction.date) : new Date(),
      description: editTransaction?.description || "",
      category: editTransaction?.category || "",
      profile: editTransaction?.profile || currentProfile,
    },
    values: editTransaction
      ? {
        type: editTransaction.type,
        amount: editTransaction.amount,
        date: new Date(editTransaction.date),
        description: editTransaction.description,
        category: editTransaction.category,
        profile: editTransaction.profile,
      }
      : undefined,
  });

  React.useEffect(() => {
    if (editTransaction) {
      form.reset({
        type: editTransaction.type,
        amount: editTransaction.amount,
        date: new Date(editTransaction.date),
        description: editTransaction.description,
        category: editTransaction.category,
        profile: editTransaction.profile,
      });
    } else {
      form.reset({
        type: "expense",
        date: new Date(),
        description: "",
        category: "",
        profile: currentProfile,
      });
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTransaction, currentProfile, form, dialogOpen]);

  const onSubmit = (data: TransactionFormData) => {
    const validation = validateTransaction(data);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    if (isEdit && onUpdateTransaction && editTransaction) {
      if (editTransaction.id) {
        onUpdateTransaction(
          editTransaction.id,
          editTransaction.profile,
          {
            ...data,
            date: data.date.toISOString(),
            currency: currentCurrency,
          }
        );
      } else {
        toast({
          title: "Error",
          description: "Transaction ID is missing.",
        });
        return;
      }
      toast({
        title: "Transaction Updated",
        description: `${data.description} was successfully updated.`,
      });
    } else if (onAddTransaction) {
      onAddTransaction({
        ...data,
        date: data.date.toISOString(),
        currency: currentCurrency,
      });
      toast({
        title: "Transaction Added",
        description: `${data.description} was successfully added.`,
      });
    }
    form.reset();
    setDialogOpen(false);
  };

  // Category suggestion logic
  const [categoryInput, setCategoryInput] = useState(form.getValues("category") || "");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories from previous transactions for the current profile
  const categorySuggestions = React.useMemo(() => {
    const categories = new Set<string>();
    allTransactions
      .filter(t => t.profile === currentProfile)
      .forEach(t => {
        if (t.category) categories.add(t.category);
      });
    return Array.from(categories).filter(cat =>
      cat.toLowerCase().includes(categoryInput.toLowerCase())
    );
  }, [allTransactions, currentProfile, categoryInput]);

  // Keep categoryInput in sync with form
  useEffect(() => {
    setCategoryInput(form.getValues("category") || "");
  }, [form.watch("category")]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {children && !isEdit && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this transaction."
              : <>Fill in the details for your new transaction for the <span className="font-semibold capitalize">{currentProfile}</span> profile.</>
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="income" id="income" className="peer sr-only" />
                  <Label
                    htmlFor="income"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Income
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="expense" id="expense" className="peer sr-only" />
                  <Label
                    htmlFor="expense"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Expense
                  </Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.type && <p className="text-sm font-medium text-destructive">{errors.type}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...form.register("amount")} placeholder="$0.00" />
              {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Controller
                name="date"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CustomCalendar
                        // mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && <p className="text-sm font-medium text-destructive">{errors.date}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...form.register("description")} placeholder="e.g. Groceries, Paycheck" />
            {errors.description && <p className="text-sm font-medium text-destructive">{errors.description}</p>}
          </div>
          <div className="space-y-2 relative">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...form.register("category")}
              ref={categoryInputRef}
              placeholder="e.g. Food, Salary"
              autoComplete="off"
              value={categoryInput}
              onChange={e => {
                setCategoryInput(e.target.value);
                form.setValue("category", e.target.value);
                setShowCategorySuggestions(true);
              }}
              onFocus={() => setShowCategorySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 100)}
            />
            {/* Suggestions dropdown */}
            {showCategorySuggestions && categoryInput && categorySuggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded shadow max-h-40 overflow-auto">
                {categorySuggestions.map((cat, idx) => (
                  <div
                    key={cat + idx}
                    className="px-3 py-2 cursor-pointer hover:bg-teal-50"
                    onMouseDown={e => {
                      e.preventDefault();
                      setCategoryInput(cat);
                      form.setValue("category", cat);
                      setShowCategorySuggestions(false);
                      categoryInputRef.current?.blur();
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
            {errors.category && <p className="text-sm font-medium text-destructive">{errors.category}</p>}
          </div>
          <DialogFooter>
            <Button type="submit">{isEdit ? "Update Transaction" : "Add Transaction"}</Button>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
