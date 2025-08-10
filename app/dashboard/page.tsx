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
import { CircleDollarSign, ChevronLeft, ChevronRight, User, LogOut, Sparkles, Plus, TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, Filter, Download, Settings, Home, BarChart3, Wallet, CreditCard, Receipt, X, Menu } from "lucide-react";
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
import { Badge } from "../../components/ui/badge";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/context/authContext";
import { CURRENCIES, Currency, DEFAULT_CURRENCY, formatCurrency, getCurrencyByCode } from "@/lib/currency";
import { Label } from "@/components/ui/label";


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
  const { user } = useAuth();
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: "asc" | "desc" }>({
    key: "date",
    direction: "desc",
  });
  const router = useRouter();


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
    const selectedCurrency = getCurrencyByCode(value);
    if (!selectedCurrency) return;
    setCurrentCurrency(selectedCurrency);
    if (currentProfile) {
      // Delegate currency update to hook/DataService
      try {
        await updateProfileCurrency(currentProfile, selectedCurrency.code);
      } catch {
        // ignore UI errors
      }
    }
  };


  const handleAddTransaction = async (transaction: Transaction) => {
    const tempId = "temp-" + Math.random().toString(36).slice(2);
    const optimisticTx = {
      ...transaction,
      id: tempId,
      amount: Number(transaction.amount) // Ensure it's a number
    };
    setOptimisticTransactions(prev => [optimisticTx, ...prev]);
    try {
      await addTransaction({
        ...transaction,
        amount: Number(transaction.amount) // Ensure it's a number
      });
    } finally {
      setOptimisticTransactions(prev => prev.filter(t => t.id !== tempId));
    }
  };


  const handleDeleteTransaction = async (id: string, profile: string) => {
    setOptimisticTransactions(prev => prev.filter(t => t.id !== id));
    await deleteTransaction(id, profile);

  };

  const quickStats = useMemo(() => {
    const thisMonth = transactionsForMonth;
    const lastMonth = mergedTransactions.filter(t => {
      const date = new Date(t.date);
      const lastMonthDate = subMonths(currentDate, 1);
      return date.getFullYear() === lastMonthDate.getFullYear() &&
        date.getMonth() === lastMonthDate.getMonth();
    });

    const thisMonthIncome = thisMonth.reduce((sum, t) => t.type === 'income' ? sum + Number(t.amount) : sum, 0);
    const thisMonthExpenses = thisMonth.reduce((sum, t) => t.type === 'expense' ? sum + Number(t.amount) : sum, 0);
    const lastMonthIncome = lastMonth.reduce((sum, t) => t.type === 'income' ? sum + Number(t.amount) : sum, 0);
    const lastMonthExpenses = lastMonth.reduce((sum, t) => t.type === 'expense' ? sum + Number(t.amount) : sum, 0);

    return {
      thisMonth: { income: thisMonthIncome, expenses: thisMonthExpenses },
      lastMonth: { income: lastMonthIncome, expenses: lastMonthExpenses },
      incomeChange: lastMonthIncome ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0,
      expenseChange: lastMonthExpenses ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0,
    };
  }, [transactionsForMonth, mergedTransactions, currentDate]);

  const recentTransactions = useMemo(() => {
    return mergedTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [mergedTransactions]);

  const topCategories = useMemo(() => {
    const categoryTotals = transactionsForMonth.reduce((acc, t) => {
      if (t.type === 'expense') {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
  }, [transactionsForMonth]);

  // Load active tab from localStorage on mount
  React.useEffect(() => {
    const savedActiveTab = localStorage.getItem('expense-tracker-active-tab');
    if (savedActiveTab && ['overview', 'transactions', 'analytics', 'budget', 'profile'].includes(savedActiveTab)) {
      setActiveTab(savedActiveTab);
    }
  }, []);

  // Save active tab to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('expense-tracker-active-tab', activeTab);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Save to localStorage immediately
    localStorage.setItem('expense-tracker-active-tab', tabId);
    if (window.innerWidth < 1024) { // Close sidebar on mobile/tablet
      setSidebarOpen(false);
    }
  };

  const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '1year' | 'all'>('6months');

  // Filter transactions by selected period for profile overview
  const filteredTransactionsByPeriod = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case '6months':
        startDate = subMonths(now, 6);
        break;
      case '1year':
        startDate = subMonths(now, 12);
        break;
      case 'all':
      default:
        return mergedTransactions;
    }

    return mergedTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= now;
    });
  }, [mergedTransactions, selectedPeriod]);

  // Calculate profile statistics
  const profileStats = useMemo(() => {
    const totalIncome = filteredTransactionsByPeriod.reduce((sum, t) =>
      t.type === 'income' ? sum + Number(t.amount) : sum, 0
    );
    const totalExpenses = filteredTransactionsByPeriod.reduce((sum, t) =>
      t.type === 'expense' ? sum + Number(t.amount) : sum, 0
    );
    const netBalance = totalIncome - totalExpenses;

    // Category breakdown
    const categoryTotals = filteredTransactionsByPeriod.reduce((acc, t) => {
      if (t.type === 'expense') {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([category, amount]) => ({ category, amount }));

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      transactionCount: filteredTransactionsByPeriod.length,
      topCategories
    };
  }, [filteredTransactionsByPeriod]);

  // Get current profile data
  const currentProfileData = profiles.find(p => p.id === currentProfile);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case '3months': return 'Last 3 Months';
      case '6months': return 'Last 6 Months';
      case '1year': return 'Last Year';
      case 'all': return 'All Time';
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-teal-50/30 to-blue-50/20">
      {/* Mobile-Optimized Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white backdrop-blur-xl border-r border-teal-200/60 shadow-xl transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-4 sm:px-6 border-b border-teal-200/60">
          <Link href='/' className="p-1.5 sm:p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg sm:rounded-xl shadow-lg">
            <CircleDollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base sm:text-lg bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent truncate">
              TrackSmart
            </h1>
            <p className="text-xs text-teal-800 hidden sm:block">Financial Dashboard</p>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-8 w-8 p-0 hover:bg-teal-50"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2">
          <button
            onClick={() => handleTabChange('overview')}
            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${activeTab === 'overview'
              ? 'bg-gradient-to-r from-teal-500/10 to-teal-600/10 text-teal-700 border border-teal-200 shadow-sm'
              : 'text-gray-600 hover:bg-teal-50/60 hover:text-teal-700'
              }`}
          >
            <Home className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Overview</span>
          </button>

          <button
            onClick={() => handleTabChange('transactions')}
            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${activeTab === 'transactions'
              ? 'bg-gradient-to-r from-teal-500/10 to-teal-600/10 text-teal-700 border border-teal-200 shadow-sm'
              : 'text-gray-600 hover:bg-teal-50/60 hover:text-teal-700'
              }`}
          >
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Transactions</span>
          </button>

          <button
            onClick={() => handleTabChange('analytics')}
            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${activeTab === 'analytics'
              ? 'bg-gradient-to-r from-teal-500/10 to-teal-600/10 text-teal-700 border border-teal-200 shadow-sm'
              : 'text-gray-600 hover:bg-teal-50/60 hover:text-teal-700'
              }`}
          >
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Analytics</span>
          </button>

          <button
            onClick={() => handleTabChange('budget')}
            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${activeTab === 'budget'
              ? 'bg-gradient-to-r from-teal-500/10 to-teal-600/10 text-teal-700 border border-teal-200 shadow-sm'
              : 'text-gray-600 hover:bg-teal-50/60 hover:text-teal-700'
              }`}
          >
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Budget</span>
          </button>

          <button
            onClick={() => handleTabChange('profile')}
            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${activeTab === 'profile'
              ? 'bg-gradient-to-r from-teal-500/10 to-teal-600/10 text-teal-700 border border-teal-200 shadow-sm'
              : 'text-gray-600 hover:bg-teal-50/60 hover:text-teal-700'
              }`}
          >
            <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Profile Overview</span>
          </button>
        </nav>

        <div className="p-3 sm:p-4 border-t border-teal-200/60">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-medium text-teal-700">Current Profile</span>
            {/* <Menu className="h-3 w-3 sm:h-4 sm:w-4 text-teal-500" /> */}
          </div>
          <div className="w-full">
            <ProfileSelector
              profiles={profiles}
              currentProfile={currentProfile}
              onProfileChange={switchProfile}
              onAddProfile={addProfile}
              onUpdateProfile={updateProfile}
              onDeleteProfile={deleteProfile}
            />
          </div>
        </div>
      </aside>

      {/* Enhanced Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile-Optimized Header */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white backdrop-blur-xl border-b border-teal-200/60 shadow-sm">
          <div className="flex items-center justify-between h-full px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0 hover:bg-teal-50"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Link href='/' className="p-1.5 sm:p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg sm:rounded-xl shadow-lg">
                <CircleDollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="hidden sm:block min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent truncate">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">
                    {format(currentDate, "MMMM yyyy")}
                  </p>
                </div>

                {/* Compact Month Navigator for Mobile */}
                <div className="flex items-center gap-0 sm:gap-1 bg-white backdrop-blur-sm rounded-lg sm:rounded-xl border border-teal-200/60 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg hover:bg-teal-50 hover:text-teal-700 p-0"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <div className="px-2 sm:px-3 py-1 min-w-[70px] sm:min-w-[100px] text-center">
                    <span className="text-xs sm:text-sm font-semibold text-teal-700">
                      {format(
                        currentDate,
                        typeof window !== "undefined" && window.innerWidth < 640
                          ? "MMM yy"
                          : "MMM yyyy"
                      )}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNextMonth}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg hover:bg-teal-50 hover:text-teal-700 p-0"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              <div className="hidden sm:block">
                <CurrencySelector
                  currentCurrency={currentCurrency}
                  onCurrencyChange={handleCurrencyChange}
                />
              </div>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full ring-2 ring-teal-200 hover:ring-teal-300 transition-all">
                      <Avatar className="h-7 w-7 sm:h-9 sm:w-9">
                        <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-xs sm:text-sm">
                          {getUserInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 sm:w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2 p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                            <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-xs sm:text-sm">
                              {getUserInitials(user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <p className="text-xs sm:text-sm font-medium leading-none truncate">{user.displayName || "User"}</p>
                            <p className="text-xs leading-none text-muted-foreground mt-1 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Show currency selector in mobile dropdown */}
                    <div className="block sm:hidden p-2">
                      <Label className="text-xs font-medium text-gray-600">Currency</Label>
                      <div className="mt-1">
                        <CurrencySelector
                          currentCurrency={currentCurrency}
                          onCurrencyChange={handleCurrencyChange}
                        />
                      </div>
                    </div>
                    <div className="block sm:hidden">
                      <DropdownMenuSeparator />
                    </div>
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
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="outline" asChild size="sm" className="text-xs sm:text-sm h-8 sm:h-9 border-teal-200 text-teal-600 hover:bg-teal-50">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="text-xs sm:text-sm h-8 sm:h-9 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile-Optimized Main Content */}
        <main className="p-3 sm:p-4 lg:p-6">
          {!isLoaded ? (
            // Mobile-Optimized Loading State
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2 sm:pb-3">
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 sm:h-8 w-20 sm:w-24 mb-1 sm:mb-2" />
                      <Skeleton className="h-2 sm:h-3 w-12 sm:w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="lg:col-span-2 animate-pulse">
                  <CardHeader>
                    <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 sm:h-64 w-full" />
                  </CardContent>
                </Card>

                <Card className="animate-pulse">
                  <CardHeader>
                    <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                        <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {activeTab === 'overview' && (
                <>
                  {/* Stats Cards with Emerald/Rose Color Scheme */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md sm:shadow-lg">
                      <CardHeader className="pb-2 sm:pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Income</CardTitle>
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-base sm:text-xl lg:text-2xl font-bold mb-1">
                          {formatCurrency(quickStats.thisMonth.income, currentCurrency)}
                        </div>
                        <div className="flex items-center text-xs opacity-90">
                          {quickStats.incomeChange >= 0 ? (
                            <TrendingUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1" />
                          ) : (
                            <TrendingDown className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1" />
                          )}
                          <span className="truncate">{Math.abs(quickStats.incomeChange).toFixed(0)}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md sm:shadow-lg">
                      <CardHeader className="pb-2 sm:pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Expenses</CardTitle>
                          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-base sm:text-xl lg:text-2xl font-bold mb-1">
                          {formatCurrency(quickStats.thisMonth.expenses, currentCurrency)}
                        </div>
                        <div className="flex items-center text-xs opacity-90">
                          {quickStats.expenseChange >= 0 ? (
                            <TrendingUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1" />
                          ) : (
                            <TrendingDown className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1" />
                          )}
                          <span className="truncate">{Math.abs(quickStats.expenseChange).toFixed(0)}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`relative overflow-hidden border-0 text-white shadow-md sm:shadow-lg ${quickStats.thisMonth.income >= quickStats.thisMonth.expenses
                      ? 'bg-gradient-to-br from-teal-600 to-teal-400'
                      : 'bg-gradient-to-br from-rose-600 to-red-500'
                      }`}>
                      <CardHeader className="pb-2 sm:pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Balance</CardTitle>
                          <Wallet className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-base sm:text-xl lg:text-2xl font-bold mb-1">
                          {formatCurrency(quickStats.thisMonth.income - quickStats.thisMonth.expenses, currentCurrency)}
                        </div>
                        <div className="text-xs opacity-90">
                          {quickStats.thisMonth.income > quickStats.thisMonth.expenses ? 'Surplus' : 'Deficit'}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-sky-600 to-sky-400 text-white shadow-md sm:shadow-lg">
                      <CardHeader className="pb-2 sm:pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Transactions</CardTitle>
                          <Receipt className="h-3 w-3 sm:h-4 sm:w-4 opacity-80" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-base sm:text-xl lg:text-2xl font-bold mb-1">
                          {transactionsForMonth.length}
                        </div>
                        <div className="text-xs opacity-90">
                          {transactionsForMonth.length > 0 ? 'This month' : 'No activity'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mobile-First Content Layout */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Chart - Full Width on Mobile */}
                    <Card className="border-0 bg-white backdrop-blur-sm shadow-md sm:shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-teal-50/90 to-blue-50/90 rounded-t-lg p-4 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-md">
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-sm sm:text-base text-teal-800">Financial Overview</CardTitle>
                            <CardDescription className="text-xs text-slate-600">
                              {format(currentDate, "MMMM yyyy")}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <MonthlySummaryChart
                          transactions={transactionsForMonth}
                          isLoaded={isLoaded}
                          currentCurrency={currentCurrency}
                        />
                      </CardContent>
                    </Card>

                    {/* Mobile-Optimized Grid for Categories and Transactions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Top Categories */}
                      <Card className="border-0 bg-white backdrop-blur-sm shadow-md sm:shadow-lg">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-md">
                              <PieChart className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-sm sm:text-base text-teal-800">Top Categories</CardTitle>
                              <CardDescription className="text-xs text-slate-600">Spending breakdown</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {topCategories.slice(0, 5).map((cat, index) => (
                            <div key={cat.category} className="flex items-center justify-between p-2 rounded-lg bg-teal-50/50">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-1 h-6 rounded-full bg-teal-600 flex-shrink-0"></div>
                                <div className="min-w-0">
                                  <p className="font-medium text-teal-700 text-sm truncate">{cat.category}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className="font-bold text-teal-800 text-sm">
                                  {formatCurrency(cat.amount, currentCurrency)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {topCategories.length === 0 && (
                            <div className="text-center py-6 text-slate-600">
                              <PieChart className="h-8 w-8 mx-auto mb-2 opacity-60" />
                              <p className="text-sm">No expenses recorded</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Recent Transactions */}
                      <Card className="border-0 bg-white backdrop-blur-sm shadow-md sm:shadow-lg">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-md">
                                <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-white " />
                              </div>
                              <div>
                                <CardTitle className="text-sm sm:text-base text-teal-800">Recent Activity</CardTitle>
                                <CardDescription className="text-xs text-slate-600">Latest transactions</CardDescription>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleTabChange('transactions')} className="text-xs h-6 text-teal-600 hover:bg-teal-50">
                              View all
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {recentTransactions.slice(0, 5).map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-teal-50/50">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-1 h-6 rounded-full ${transaction.type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'}`}></div>
                                <div className="min-w-0">
                                  <p className="font-medium text-teal-700 text-sm truncate max-w-[120px]">{transaction.description}</p>
                                  <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700">
                                      {transaction.category}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className={`font-bold text-sm ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {transaction.type === 'income' ? '+' : '-'}
                                  {formatCurrency(transaction.amount, currentCurrency)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {recentTransactions.length === 0 && (
                            <div className="text-center py-6 text-slate-600">
                              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-60" />
                              <p className="text-sm">No transactions yet</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'transactions' && (
                <Card className="border-0 bg-white backdrop-blur-sm shadow-md sm:shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-teal-50/90 to-blue-50/90 rounded-t-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-md">
                        <Receipt className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg text-teal-800">All Transactions</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-slate-600">
                          {format(currentDate, "MMMM yyyy")} • {filteredAndSortedTransactions.length} transactions
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-3 sm:p-6 border-b bg-teal-50">
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
                    <TransactionsTable
                      transactions={filteredAndSortedTransactions}
                      onDeleteTransaction={handleDeleteTransaction}
                      onUpdateTransaction={updateTransaction}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      currentCurrency={currentCurrency}
                    />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-4 sm:space-y-6">
                  <MonthlySummaryChart
                    transactions={transactionsForMonth}
                    isLoaded={isLoaded}
                    currentCurrency={currentCurrency}
                  />
                  <Card className="border-0 bg-white backdrop-blur-sm shadow-md sm:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg text-teal-800">Advanced Analytics</CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-slate-600">Coming soon</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-slate-600">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-60" />
                        <p className="text-sm">Advanced analytics coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'budget' && (
                <Card className="border-0 bg-white backdrop-blur-sm shadow-md sm:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg text-teal-800">Budget Management</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-600">Set and track your spending limits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 sm:py-12 text-slate-600">
                      <Wallet className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-60" />
                      <p className="text-sm">Budget features coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'profile' && (
                <>
                  {/* Profile Info and Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentProfileData && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: currentProfileData.color }}
                        />
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-teal-900">
                          {currentProfileData?.name || 'Current Profile'}
                        </h2>
                        {currentProfileData?.description && (
                          <p className="text-slate-600 text-sm">{currentProfileData.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as any)}
                        className="px-3 py-2 border border-teal-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="1year">Last Year</option>
                        <option value="all">All Time</option>
                      </select>
                    </div>
                  </div>

                  {/* Profile Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium opacity-90">Total Income</CardTitle>
                          <TrendingUp className="h-4 w-4 opacity-80" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold mb-1">
                          {formatCurrency(profileStats.totalIncome, currentCurrency)}
                        </div>
                        <div className="text-xs opacity-90">
                          {getPeriodLabel()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium opacity-90">Total Expenses</CardTitle>
                          <TrendingDown className="h-4 w-4 opacity-80" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold mb-1">
                          {formatCurrency(profileStats.totalExpenses, currentCurrency)}
                        </div>
                        <div className="text-xs opacity-90">
                          {profileStats.topCategories.length} categories
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`relative overflow-hidden border-0 text-white shadow-lg ${profileStats.netBalance >= 0
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                      : 'bg-gradient-to-br from-rose-600 to-orange-500'
                      }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium opacity-90">Net Balance</CardTitle>
                          <Wallet className="h-4 w-4 opacity-80" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold mb-1">
                          {formatCurrency(profileStats.netBalance, currentCurrency)}
                        </div>
                        <div className="text-xs opacity-90">
                          {profileStats.netBalance >= 0 ? 'Surplus' : 'Deficit'}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-teal-600 to-blue-600 text-white shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium opacity-90">Transactions</CardTitle>
                          <BarChart3 className="h-4 w-4 opacity-80" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold mb-1">
                          {profileStats.transactionCount}
                        </div>
                        <div className="text-xs opacity-90">
                          Total recorded
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts and Categories */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Chart */}
                    <Card className="border-0 bg-white backdrop-blur-sm shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-teal-900">Financial Trends</CardTitle>
                        <CardDescription className="text-slate-600">
                          Income vs Expenses • {getPeriodLabel()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <MonthlySummaryChart
                          transactions={filteredTransactionsByPeriod}
                          isLoaded={isLoaded}
                          currentCurrency={currentCurrency}
                        />
                      </CardContent>
                    </Card>

                    {/* Top Categories */}
                    <Card className="border-0 bg-white backdrop-blur-sm shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-teal-900">Top Spending Categories</CardTitle>
                        <CardDescription className="text-slate-600">Your biggest expense categories</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {profileStats.topCategories.map((cat, index) => (
                          <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg bg-teal-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-8 rounded-full bg-teal-600"></div>
                              <div>
                                <p className="font-medium text-teal-700">{cat.category}</p>
                                <p className="text-xs text-slate-600">
                                  {profileStats.totalExpenses > 0
                                    ? `${((cat.amount / profileStats.totalExpenses) * 100).toFixed(1)}% of total`
                                    : 'No expenses'
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-teal-700">
                                {formatCurrency(cat.amount, currentCurrency)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {profileStats.topCategories.length === 0 && (
                          <div className="text-center py-8 text-slate-600">
                            <PieChart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No expense categories found</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* All Transactions for Profile */}
                  <Card className="border-0 bg-white backdrop-blur-sm shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-teal-50/90 to-blue-50/90 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg">
                          <Receipt className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-teal-900">Profile Transactions</CardTitle>
                          <CardDescription className="text-slate-600">
                            {filteredTransactionsByPeriod.length} transactions • {getPeriodLabel()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="p-6 border-b bg-teal-50">
                        <TransactionsToolbar
                          filters={filters}
                          setFilters={setFilters}
                          onAddTransaction={handleAddTransaction}
                          onUpdateTransaction={updateTransaction}
                          transactions={filteredTransactionsByPeriod}
                          currentProfile={currentProfile}
                          currentCurrency={currentCurrency.code}
                        />
                      </div>
                      <TransactionsTable
                        transactions={filteredTransactionsByPeriod.filter(t => {
                          let filtered = [t];
                          if (filters.type !== "all") {
                            filtered = filtered.filter((tx) => tx.type === filters.type);
                          }
                          if (filters.searchTerm) {
                            const lowercasedTerm = filters.searchTerm.toLowerCase();
                            filtered = filtered.filter(
                              (tx) =>
                                tx.description.toLowerCase().includes(lowercasedTerm) ||
                                tx.category.toLowerCase().includes(lowercasedTerm)
                            );
                          }
                          return filtered.length > 0;
                        }).sort((a, b) => {
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
                        })}
                        onDeleteTransaction={handleDeleteTransaction}
                        onUpdateTransaction={updateTransaction}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        currentCurrency={currentCurrency}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
