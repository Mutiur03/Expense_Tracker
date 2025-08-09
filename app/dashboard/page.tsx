"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import { useTransactions } from "../../hooks/use-transactions";
import { TransactionsTable } from "../../components/transactions-table";
import { TransactionsToolbar } from "../../components/transactions-toolbar";
import { ProfileSelector } from "../../components/profile-selector";
import type { Transaction } from "../../lib/types";
import { Skeleton } from "../../components/ui/skeleton";
import Link from "next/link";
import { CircleDollarSign, ChevronLeft, ChevronRight, User, LogOut, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";
import { subMonths, addMonths, format } from "date-fns";
import { MonthlySummaryCards, MonthlySummaryChart } from "../../components/monthly-summary";
import { CurrencySelector } from "../../components/currency-selector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/context/authContext";
import { CURRENCIES, Currency, DEFAULT_CURRENCY, getCurrencyByCode } from "@/lib/currency";
import { DataService } from "@/lib/data-service";

export default function DashboardPage() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    profiles,
    currentProfile,
    addProfile,
    updateProfile,
    updateProfileCurrency,
    deleteProfile,
    switchProfile,
    isLoaded,
    updateTransaction
  } = useTransactions();

  const [optimisticTransactions, setOptimisticTransactions] = useState<Transaction[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState({
    type: "all",
    searchTerm: "",
  });
  const { setUser } = useAuth();
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(DEFAULT_CURRENCY);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: "asc" | "desc" }>({
    key: "date",
    direction: "desc",
  });
  const router = useRouter();
  const { user, loading } = useAuth();


  const mergedTransactions = useMemo(() => {

    const uploadedIds = new Set(transactions.map(t => t.id));
    const filteredOptimistic = optimisticTransactions.filter(
      t => t.id && t.id.startsWith("temp-") && !uploadedIds.has(t.id)
    );

    return [...transactions, ...filteredOptimistic];
  }, [transactions, optimisticTransactions]);

  const transactionsForMonth = useMemo(() => {
    return mergedTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === currentDate.getFullYear() &&
        transactionDate.getMonth() === currentDate.getMonth();
    });
  }, [mergedTransactions, currentDate]);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactionsForMonth;

    if (filters.type !== "all") {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.searchTerm) {
      const lowercasedTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(lowercasedTerm) ||
          t.category.toLowerCase().includes(lowercasedTerm)
      );
    }

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [transactionsForMonth, filters, sortConfig]);

  const handleSort = (key: keyof Transaction) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      router.push("/");
    }
  };

  const getUserInitials = (email: string | null) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  React.useEffect(() => {
    if (currentProfile && profiles.length > 0) {
      const profile = profiles.find(p => p.id === currentProfile);
      if (profile && profile.currency) {
        setCurrentCurrency(getCurrencyByCode(profile.currency));
      } else {
        setCurrentCurrency(DEFAULT_CURRENCY);
      }
    } else {
      setCurrentCurrency(DEFAULT_CURRENCY);
    }
  }, [currentProfile, profiles]);
  const handleCurrencyChange = async (value: string) => {
    const selectedCurrency = CURRENCIES.find(c => c.code === value);
    if (!selectedCurrency) return;
    setCurrentCurrency(selectedCurrency);
    if (currentProfile) {
      const dataService = DataService.getInstance();
      try {
        await dataService.updateProfile(currentProfile, { currency: selectedCurrency.code });
      } catch (error) {

      }

      const localProfiles = JSON.parse(localStorage.getItem('expense-tracker-profiles') || '[]');
      const profileIndex = localProfiles.findIndex((p: any) => p.id === currentProfile);
      if (profileIndex !== -1) {
        localProfiles[profileIndex].currency = selectedCurrency.code;
        localStorage.setItem('expense-tracker-profiles', JSON.stringify(localProfiles));
      }
    }

  };


  const handleAddTransaction = async (transaction: Transaction) => {
    const tempId = "temp-" + Math.random().toString(36).slice(2);
    const optimisticTx = { ...transaction, id: tempId };
    setOptimisticTransactions(prev => [optimisticTx, ...prev]);
    try {
      await addTransaction(transaction);
    } finally {

      setOptimisticTransactions(prev => prev.filter(t => t.id !== tempId));
    }
  };


  const handleDeleteTransaction = async (id: string, profile: string) => {
    setOptimisticTransactions(prev => prev.filter(t => t.id !== id));
    await deleteTransaction(id, profile);

  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-teal-50/50 to-blue-50/30">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-md shadow-sm px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg group-hover:scale-105 transition-transform">
              <CircleDollarSign className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent hidden sm:block">
              TrackSmart
            </h1>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {!isLoaded ? (
            <>
              <Skeleton className="h-9 w-32" />
              <div className="w-full sm:w-40">
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </>
          ) : (
            <>
              <div className="block">
                <CurrencySelector
                  currentCurrency={currentCurrency}
                  onCurrencyChange={(currencyCode) => {
                    updateProfileCurrency(currentProfile, currencyCode);
                    handleCurrencyChange(currencyCode);
                  }}
                />
              </div>
              <div className="w-32 sm:w-40">
                <ProfileSelector
                  profiles={profiles}
                  currentProfile={currentProfile}
                  onProfileChange={switchProfile}
                  onAddProfile={addProfile}
                  onUpdateProfile={updateProfile}
                  onDeleteProfile={deleteProfile}
                />
              </div>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-teal-100 hover:ring-teal-200 transition-all">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm">
                          {getUserInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2 p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm">
                              {getUserInitials(user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                            <p className="text-xs leading-none text-muted-foreground mt-1">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" asChild className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                    <Link href="/login" prefetch={false}>Login</Link>
                  </Button>
                  <Button asChild className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {!isLoaded ? (
          <div className="space-y-6 animate-pulse">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Skeleton className="h-8 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
            </div>

            <Card className="shadow-lg border-0 bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <Skeleton className="h-10 w-full sm:w-80" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-36" />
                  </div>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Financial Dashboard
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Track and manage your expenses with ease
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="h-8 w-8 rounded-md hover:bg-teal-50 hover:text-teal-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-3 py-1">
                  <span className="text-sm font-semibold text-gray-900 min-w-[100px] text-center block">
                    {format(currentDate, "MMMM yyyy")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextMonth}
                  className="h-8 w-8 rounded-md hover:bg-teal-50 hover:text-teal-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <MonthlySummaryCards transactions={transactionsForMonth} isLoaded={isLoaded} currentCurrency={currentCurrency} />

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <CircleDollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Recent Transactions
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Manage your transactions for {format(currentDate, "MMMM yyyy")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  <div className="p-4 border-b bg-gray-50/50">
                    <TransactionsToolbar
                      filters={filters}
                      setFilters={setFilters}
                      onAddTransaction={handleAddTransaction}
                      onUpdateTransaction={updateTransaction}
                      transactions={mergedTransactions}
                      currentProfile={currentProfile}
                      currentCurrency={currentCurrency.code}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <TransactionsTable
                      transactions={filteredAndSortedTransactions}
                      onDeleteTransaction={handleDeleteTransaction}
                      onUpdateTransaction={updateTransaction}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      currentCurrency={currentCurrency}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <MonthlySummaryChart transactions={transactionsForMonth} isLoaded={isLoaded} currentCurrency={currentCurrency} />
          </div>
        )}
      </main>
    </div>
  );
}

