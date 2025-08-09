"use client";

import Link from 'next/link';
import { Button } from '../components/ui/button';
import { ArrowRight, CircleDollarSign, BarChart, Shield, User, LogOut, Loader2, ChevronDown, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center cursor-pointer" onClick={scrollToTop}>
              <CircleDollarSign className="h-8 w-8 text-teal-600 mr-2" />
              <h1 className="text-2xl font-bold text-teal-600">TrackSmart</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-teal-600 transition-colors"
              >

                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-700 hover:text-teal-600 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-gray-700 hover:text-teal-600 transition-colors"
              >
                FAQ
              </button>
              {user ? (
                <>
                  <Button asChild variant="ghost" size="sm">
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
                  <Button variant="ghost" asChild size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-teal-500 hover:bg-teal-600">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-50 to-blue-50 py-20 lg:py-32 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Take Control of Your
                <span className="text-teal-600 block">Finances</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The simplest way to manage your money, gain financial clarity, and save more. Track expenses, visualize spending patterns, and build better money habits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Button asChild size="lg" className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4">
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4">
                      <Link href="/signup">
                        Get Started for Free
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-2 border-teal-500 text-teal-600 hover:bg-teal-50 px-8 py-4">
                      <Link href="/dashboard">Try Demo</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="relative w-full max-w-2xl mx-auto">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800&q=80"
                  alt="TrackSmart Dashboard Preview showing financial charts and analytics"
                  className="w-full h-auto rounded-2xl shadow-2xl border border-gray-200"
                />
                {/* Optional: Add a subtle overlay or frame effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features for Smart Money Management</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to track, analyze, and optimize your financial life in one intuitive platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <CircleDollarSign className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Entry & Smart Categorization</h3>
              <p className="text-gray-600">
                Add expenses in seconds with intelligent auto-categorization and receipt scanning capabilities.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Visual Reports & Trends</h3>
              <p className="text-gray-600">
                Beautiful charts and insights that help you understand your spending patterns and financial health.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <User className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multiple Profiles</h3>
              <p className="text-gray-600">
                Manage personal and business finances separately with unlimited budget profiles.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <ArrowRight className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">CSV Export</h3>
              <p className="text-gray-600">
                Export your financial data anytime for tax preparation or external analysis tools.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <CircleDollarSign className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Currency Support</h3>
              <p className="text-gray-600">
                Track expenses in multiple currencies with real-time exchange rate conversion.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cloud & Local Storage</h3>
              <p className="text-gray-600">
                Choose between secure cloud sync across devices or keep your data completely local and private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How TrackSmart Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with financial tracking in three simple steps and start building better money habits today.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80"
                  alt="Organize Categories"
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover rounded-lg shadow-lg"
                  unoptimized
                />

              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Add Expenses</h3>
              <p className="text-gray-600">
                Quickly log your purchases with our intuitive interface. Snap receipts or manually enter transactions in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <Image
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80"
                  alt="Organize Categories"
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover rounded-lg shadow-lg"
                  unoptimized
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Organize Categories</h3>
              <p className="text-gray-600">
                Let our smart categorization system organize your spending automatically or customize categories to fit your lifestyle.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <Image
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80"
                  alt="Analyze Spending"
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover rounded-lg shadow-lg"
                  unoptimized
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Analyze & Optimize</h3>
              <p className="text-gray-600">
                Discover spending patterns with beautiful charts and insights. Make informed decisions to improve your financial health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about TrackSmart and how it can help you manage your finances better.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Is my financial data secure and private?",
                answer: "Absolutely. TrackSmart offers two storage options: secure cloud storage with bank-level encryption, or completely local storage that never leaves your device. You choose what works best for your privacy needs."
              },
              {
                question: "Can I use TrackSmart without an internet connection?",
                answer: "Yes! TrackSmart works perfectly in local mode without any internet connection. Your data stays on your device, and you can export it anytime. Cloud sync is optional for those who want multi-device access."
              },
              {
                question: "Can I export my financial data?",
                answer: "Yes, you can export all your data to CSV format at any time. This makes it easy to use your data with other tools, for tax preparation, or simply as a backup of your financial records."
              },
              {
                question: "Is there a mobile app available?",
                answer: "TrackSmart is a progressive web app that works seamlessly on all devices - desktop, tablet, and mobile. Simply access it through your browser and add it to your home screen for a native app experience."
              },
              {
                question: "How does smart categorization work?",
                answer: "Our AI analyzes transaction descriptions and automatically assigns appropriate categories based on merchant names and spending patterns. You can always customize categories or create your own to match your specific needs."
              },
              {
                question: "Is TrackSmart really free?",
                answer: "Yes! TrackSmart core features are completely free with no hidden costs. We believe everyone should have access to powerful financial tracking tools to improve their financial well-being."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-lg">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors rounded-lg"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <div className="w-6 h-6 flex items-center justify-center">
                    {openFaq === index ? (
                      <Minus className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Plus className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already improved their financial health with TrackSmart.
            Start tracking your expenses and building better money habits today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-gray-50">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-gray-50">
                  <Link href="/signup">Get Started for Free</Link>
                </Button>
                <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-gray-50">
                  <Link href="/dashboard">Try Demo</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <CircleDollarSign className="h-8 w-8 text-teal-400 mr-2" />
                <h3 className="text-2xl font-bold text-teal-400">TrackSmart</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The simplest way to manage your money, gain financial clarity, and save more.
                Take control of your finances today.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/signup" className="text-gray-400 hover:text-white transition-colors">Sign Up</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2025 TrackSmart. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
