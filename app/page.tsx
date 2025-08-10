"use client";

import Link from 'next/link';
import { Button } from '../components/ui/button';
import { ArrowRight, CircleDollarSign, BarChart, Shield, User, LogOut, Loader2, ChevronDown, Plus, Minus, Star, Check, TrendingUp, DollarSign, PieChart, Clock, Smartphone, Globe, Lock, Menu, X, Cloud, HardDrive } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '@/components/context/authContext';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // New: active section + reduced motion
  const [activeSection, setActiveSection] = useState<string>('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionIds = ['features', 'testimonials', 'how-it-works', 'faq'];

  // Measure fixed header height and expose as CSS var
  const headerRef = useRef<HTMLElement | null>(null);
  const updateHeaderHeight = () => {
    const h = headerRef.current?.offsetHeight || 64;
    document.documentElement.style.setProperty('--header-h', `${h}px`);
  };

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    setIsVisible(true);
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    // Recompute height when mobile menu expands/collapses
    updateHeaderHeight();
  }, [mobileMenuOpen]);

  // New: detect reduced motion preference
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReducedMotion(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // New: auto-rotate testimonials unless reduced motion
  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // New: highlight active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // New: close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserInitials = (email: string | null) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Helper: show immediately if reduced motion
  const showNow = isVisible || prefersReducedMotion;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Small Business Owner",
      avatar: "SC",
      rating: 5,
      text: "TrackSmart has completely transformed how I manage my business expenses. The automatic categorization saves me hours each week, and it's completely free!"
    },
    {
      name: "Michael Rodriguez",
      role: "Freelancer",
      avatar: "MR",
      rating: 5,
      text: "I love that I can use TrackSmart completely offline for privacy, but sync across devices when needed. Best of all - it's always free!"
    },
    {
      name: "Emma Thompson",
      role: "Financial Advisor",
      avatar: "ET",
      rating: 5,
      text: "I recommend TrackSmart to all my clients. The visual reports are incredible and there are no hidden fees or premium plans to worry about."
    }
  ];

  const stats = [
    { number: "50K+", label: "Happy Users" },
    { number: "Always", label: "100% Free" },
    { number: "99.9%", label: "Uptime" },
    { number: "4.9★", label: "User Rating" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* New: skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] bg-white text-gray-900 px-3 py-2 rounded-md shadow ring-2 ring-teal-600"
      >
        Skip to content
      </a>

      {/* Background overlay when mobile menu is open */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Responsive Header with Mobile Menu */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={scrollToTop}>
              <Link href='/' aria-label="Go to TrackSmart home" className="p-1.5 sm:p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg sm:rounded-xl shadow-lg">
                <CircleDollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                TrackSmart
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8" aria-label="Primary">
              {[{ Title: 'Features', id: 'features' }, { Title: 'Testimonials', id: 'testimonials' }, { Title: 'How It Works', id: 'how-it-works' }, { Title: 'FAQ', id: 'faq' }].map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  aria-current={activeSection === section.id ? 'page' : undefined}
                  className={`text-gray-700 hover:text-teal-600 transition-colors capitalize relative group text-sm xl:text-base ${activeSection === section.id ? 'text-teal-700' : ''}`}
                >
                  {section.Title}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-teal-600 transition-all ${activeSection === section.id ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </button>
              ))}



              {user ? (
                <>
                  <Button asChild size="sm" className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
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
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="border-teal-500 text-teal-600 hover:bg-teal-50">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all">
                    <Link href="/dashboard">Try Free Now</Link>
                  </Button>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors relative z-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div id="mobile-menu" className="lg:hidden border-t border-gray-100 py-4 bg-white/95 backdrop-blur-lg relative z-50">
              <nav className="flex flex-col space-y-4" aria-label="Mobile primary">
                {['features', 'testimonials', 'how-it-works', 'faq'].map((section) => (
                  <button
                    key={section}
                    onClick={() => {
                      scrollToSection(section);
                      setMobileMenuOpen(false);
                    }}
                    aria-current={activeSection === section ? 'page' : undefined}
                    className={`text-gray-700 hover:text-teal-600 transition-colors capitalize text-left py-2 px-2 ${activeSection === section ? 'text-teal-700' : ''}`}
                  >
                    {section.replace('-', ' ')}
                  </button>
                ))}
                {user ? (
                  <Button asChild size="sm" className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <div className="flex flex-col space-y-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="justify-center border-teal-500 text-teal-600 hover:bg-teal-50">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild size="sm" className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                      <Link href="/dashboard">Try Free Now</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* New: wrap content in a main landmark */}
      <main id="main-content" tabIndex={-1}>
        {/* Enhanced Hero Section */}
        <section
          className="relative min-h-screen flex items-center overflow-hidden pt-[4rem] pb-6 sm:pb-0"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-teal-50"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-teal-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-4 sm:py-0 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              {/* Badge - Responsive */}
              <div className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-50 border border-teal-200 rounded-full text-teal-800 text-xs sm:text-sm mb-4 sm:mb-6 ${prefersReducedMotion ? 'transition-none' : 'animate-fade-in'} sm:mt-2 lg:mt-4`}>
                <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-teal-600" />
                <span className="font-medium">✨ Always 100% Free - No Hidden Costs</span>
              </div>

              {/* Main Headline - Responsive */}
              <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight transition-all duration-1000 ${showNow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                Master Your Money
                <span className="block bg-gradient-to-r from-teal-600 via-teal-500 to-teal-700 bg-clip-text text-transparent">
                  Build Wealth Smart
                </span>
              </h1>

              {/* Subheading - Responsive */}
              <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-300 px-4 sm:px-0 ${showNow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                The only expense tracker that's <strong className="text-teal-600">completely free forever</strong>.
                Track spending, discover insights, and achieve your financial goals with AI-powered intelligence.
              </p>

              {/* Storage Options Banner */}
              <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 transition-all duration-1000 delay-400 ${showNow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="flex items-center px-3 py-2 bg-teal-50 rounded-lg text-teal-700 text-sm">
                  <HardDrive className="h-4 w-4 mr-2" />
                  <span>Use Locally (Private)</span>
                </div>
                <div className="text-gray-400 hidden sm:block">or</div>
                <div className="flex items-center px-3 py-2 bg-teal-50 rounded-lg text-teal-700 text-sm">
                  <Cloud className="h-4 w-4 mr-2" />
                  <span>Sync Across Devices</span>
                </div>
              </div>

              {/* CTAs - Mobile Optimized */}
              <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 transition-all duration-1000 delay-500 px-4 sm:px-0 ${showNow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {user ? (
                  <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
                      <Link href="/dashboard">
                        <HardDrive className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Try Locally - Free Forever
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-2 hover:text-teal-800 border-teal-500 text-teal-600 hover:bg-teal-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg hover:scale-105 transition-all">
                      <Link href="/signup">
                        <Cloud className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Sign Up for Cloud Sync
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Trust Indicators - Responsive */}
              <div className={`flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-gray-500 transition-all duration-1000 delay-700 px-4 sm:px-0 ${showNow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="flex items-center">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-teal-600" />
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-teal-600" />
                  <span>Setup in 2 minutes</span>
                </div>
                <div className="flex items-center">
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-teal-600" />
                  <span>Works offline</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-teal-600" />
                  <span>No ads ever</span>
                </div>
              </div>
            </div>

            {/* Removed Stats from hero to ensure content fits viewport */}

            {/* Dashboard Preview - Mobile Optimized */}
            {/* <div className={`relative max-w-6xl mx-auto transition-all duration-1000 delay-1200 px-4 sm:px-0 ${showNow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-1 sm:p-2 shadow-2xl">
                <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden">
                  <img
                    src="/hero.webp"
                    alt="TrackSmart Dashboard showing financial analytics"
                    className="w-full h-auto"
                  />
                </div>

                <div className="hidden sm:block absolute -top-4 sm:-top-6 -left-4 sm:-left-6 bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg border">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium">Always Free</span>
                  </div>

                </div>
                <div className="hidden sm:block absolute -bottom-4 sm:-bottom-6 -right-4 sm:-right-6 bg-teal-500 text-white rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm font-medium">+23% savings</span>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </section>

        {/* Stats - moved outside hero so hero+navbar fit exactly in viewport */}
        <section
          aria-label="stats"
          className="bg-white"
          style={{ scrollMarginTop: 'var(--header-h, 64px)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 my-12 sm:my-16 transition-all duration-1000 delay-1000 ${showNow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 sm:p-6 bg-white/80 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">{stat.number}</div>
                  <div className="text-gray-600 text-xs sm:text-sm lg:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Mobile Enhanced */}
        <section
          id="features"
          className="py-12 sm:py-16 lg:py-20 bg-white"
          style={{ scrollMarginTop: 'var(--header-h, 64px)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Everything You Need - Always Free
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Powerful features designed to make financial tracking effortless, with no premium tiers or hidden costs
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[{
                icon: DollarSign,
                title: "Smart Expense Tracking",
                description: "AI-powered categorization that learns your spending habits and automatically organizes transactions.",
                color: "teal",
                features: ["Auto-categorization", "Receipt scanning", "Multiple currencies", "Recurring transactions"]
              },
              {
                icon: PieChart,
                title: "Advanced Analytics",
                description: "Beautiful visualizations and deep insights that help you understand your financial patterns.",
                color: "blue",
                features: ["Interactive charts", "Spending trends", "Budget analysis", "Custom reports"]
              },
              {
                icon: Shield,
                title: "Privacy & Security",
                description: "Your data is protected with bank-level encryption and optional local-only storage.",
                color: "green",
                features: ["End-to-end encryption", "Local storage option", "No data selling", "GDPR compliant"]
              }].map((feature, index) => (
                <div key={index} className="relative group">
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-teal-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                    <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{feature.description}</p>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-center text-xs sm:text-sm text-gray-600">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-teal-500 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Free Forever Banner */}
            <div className="mt-12 sm:mt-16 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-teal-800">
                <Star className="h-4 w-4 mr-2 text-teal-600" />
                <span className="font-semibold">All features above are 100% free forever - No premium plans!</span>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Testimonials - Mobile Optimized */}
        <section
          id="testimonials"
          // className="py-12 sm:py-12 lg:py-26 bg-gray-50 min-h-screen"
          className="relative min-h-screen flex items-center bg-gray-50 overflow-hidden scroll-mt-16" // pt matches navbar height, add bottom padding for mobile

        // style={{ scrollMarginTop: 'var(--header-h, 64px)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Loved by Users Worldwide
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                See how TrackSmart is helping people take control of their finances - completely free
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
                <div className="text-center">
                  <div className="flex justify-center mb-3 sm:mb-4">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                    "{testimonials[activeTestimonial].text}"
                  </blockquote>
                  <div className="flex items-center justify-center">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-3 sm:mr-4">
                      <AvatarFallback className="bg-teal-500 text-white text-sm sm:text-base">
                        {testimonials[activeTestimonial].avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">{testimonials[activeTestimonial].name}</div>
                      <div className="text-gray-600 text-xs sm:text-sm">{testimonials[activeTestimonial].role}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial indicators - Touch friendly */}
              <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    aria-pressed={activeTestimonial === index}
                    aria-label={`Show testimonial ${index + 1}`}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all touch-manipulation ${activeTestimonial === index ? 'bg-teal-500 scale-110' : 'bg-gray-300 hover:bg-gray-400'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Mobile Enhanced */}
        <section
          id="how-it-works"
          className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-teal-50 to-teal-100"
          style={{ scrollMarginTop: 'var(--header-h, 64px)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Get Started in Minutes, Not Hours
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Three simple steps to financial clarity - choose local privacy or cloud convenience
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
              {[{
                step: 1,
                title: "Choose Your Setup",
                description: "Start using locally for complete privacy, or sign up for free cloud sync across all your devices.",
                image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&h=400&q=80",
                highlights: ["Local or Cloud", "Always Free", "2 minute setup"]
              },
              {
                step: 2,
                title: "Smart Organization",
                description: "Watch as AI automatically categorizes and organizes your financial data intelligently.",
                image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&h=400&q=80",
                highlights: ["AI categorization", "Custom rules", "Bulk editing"]
              },
              {
                step: 3,
                title: "Insights & Growth",
                description: "Discover spending patterns, set goals, and watch your financial health improve over time.",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&h=400&q=80",
                highlights: ["Visual reports", "Goal tracking", "Savings tips"]
              }].map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-6 sm:mb-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-xl sm:text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                      {item.step}
                    </div>
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-xl group-hover:shadow-2xl transition-all">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={600}
                        height={400}
                        className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{item.title}</h3>
                  <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{item.description}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {item.highlights.map((highlight, i) => (
                      <span key={i} className="px-2 py-1 sm:px-3 bg-teal-100 text-teal-700 rounded-full text-xs sm:text-sm font-medium">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section - Mobile Enhanced */}
        <section
          id="faq"
          className="py-12 sm:py-16 lg:py-20 bg-white"
          style={{ scrollMarginTop: 'var(--header-h, 64px)' }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Everything you need to know about TrackSmart's free service
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {[{
                question: "Is TrackSmart really completely free?",
                answer: "Yes! TrackSmart is 100% free forever with no hidden costs, premium tiers, or feature limitations. We believe everyone deserves access to powerful financial tracking tools."
              },
              {
                question: "What's the difference between local and cloud storage?",
                answer: "Local storage keeps all your data on your device for maximum privacy - no internet required. Cloud storage lets you sync across devices and access from anywhere, but requires creating a free account."
              },
              {
                question: "Is my financial data secure and private?",
                answer: "Absolutely. Whether you choose local or cloud storage, your data is protected with bank-level encryption. We never sell or share your data with third parties."
              },
              {
                question: "Can I switch between local and cloud storage later?",
                answer: "Yes! You can export your data anytime and import it into either storage method. You're never locked into one option."
              },
              {
                question: "Does TrackSmart work offline?",
                answer: "Yes! TrackSmart works perfectly offline, especially with local storage. Cloud sync just adds the convenience of accessing your data from multiple devices."
              },
              {
                question: "Will there ever be premium features or ads?",
                answer: "No! TrackSmart will always remain completely free with no ads. We're committed to providing powerful financial tools without monetizing your data or limiting features."
              }].map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                  <button
                    id={`faq-header-${index}`}
                    className="w-full px-4 py-4 sm:px-6 sm:py-6 text-left flex justify-between items-start hover:bg-gray-100 transition-colors touch-manipulation"
                    onClick={() => toggleFaq(index)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleFaq(index);
                      }
                    }}
                    aria-expanded={openFaq === index}
                    aria-controls={`faq-panel-${index}`}
                  >
                    <span className="font-semibold text-gray-900 text-base sm:text-lg pr-4 leading-relaxed">{faq.question}</span>
                    <div className="flex-shrink-0 mt-1">
                      {openFaq === index ? (
                        <Minus className="h-5 w-5 text-teal-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-teal-600" />
                      )}
                    </div>
                  </button>
                  {openFaq === index && (
                    <div
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-header-${index}`}
                      className="px-4 pb-4 sm:px-6 sm:pb-6"
                    >
                      <p className="text-gray-600 leading-relaxed text-sm sm:text-base lg:text-lg">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section - Mobile Optimized */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
            <div className="absolute top-5 left-5 sm:top-10 sm:left-10 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-5 right-5 sm:bottom-10 sm:right-10 w-32 h-32 sm:w-48 sm:h-48 bg-white/10 rounded-full blur-xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Master Your Money?
            </h2>
            <p className="text-lg sm:text-xl text-teal-100 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              Join 50,000+ users who've already transformed their financial habits with TrackSmart's free tools.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 px-4 sm:px-0">
              {user ? (
                <Button asChild size="lg" className="w-full sm:w-auto bg-white text-teal-600 hover:bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                  <Link href="/dashboard">
                    Access Your Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="w-full sm:w-auto bg-white text-teal-600 hover:bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                    <Link href="/dashboard">
                      <HardDrive className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Try Locally - Free Forever
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-2 text-teal-800 border-white hover:bg-white hover:text-teal-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                    <Link href="/signup">
                      <Cloud className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Sign Up for Cloud Sync
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 text-teal-100 text-sm sm:text-base">
              <div className="flex items-center">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span>100% free forever</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Footer - Mobile Optimized */}
        <footer className="bg-gray-900 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div className="sm:col-span-2">
                <div className="flex items-center mb-4 gap-2 sm:mb-6">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg sm:rounded-xl shadow-lg">
                    <CircleDollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-teal-400">TrackSmart</h3>
                </div>
                <p className="text-gray-400 mb-4 sm:mb-6 max-w-md text-base sm:text-lg leading-relaxed">
                  The smartest way to track expenses and build wealth - completely free forever, with no hidden costs or premium tiers.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center text-gray-400">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Secured by 256-bit encryption</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Always 100% Free</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">Product</h4>
                <ul className="space-y-2 sm:space-y-3">
                  {['Features', 'Security', 'Privacy', 'Open Source'].map(item => (
                    <li key={item}>
                      <button className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">Get Started</h4>
                <ul className="space-y-2 sm:space-y-3">
                  <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Try Locally</Link></li>
                  <li><Link href="/signup" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Cloud Sync</Link></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Support</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Contact</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-0">&copy; 2025 TrackSmart. All rights reserved.</p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Cookie Policy</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
