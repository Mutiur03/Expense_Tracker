'use client'

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,

} from "@/components/ui/card"
import { CircleDollarSign } from "lucide-react"
import {
  auth,
  googleProvider
} from "@/lib/firebase"
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  getAdditionalUserInfo,
  fetchSignInMethodsForEmail,
  signOut,
} from "firebase/auth"
import { useAuth } from "@/components/context/authContext"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, setAuthInProgress, authInProgress } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && user && !authInProgress) {
      router.push("/dashboard")
    }
  }, [user, loading, authInProgress, router])

  if (loading || authInProgress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-muted-foreground text-sm">Checking authentication...</span>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError("")
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      setError(error.message || "Failed to login")
    } finally {
      setFormLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError("")
    setAuthInProgress(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const check = result.user

      if (!check.email) {
        await signOut(auth)
        setError("No email found for this Google account.")
        return
      }

      const isNewUser = getAdditionalUserInfo(result)?.isNewUser

      if (isNewUser) {
        await check.delete()
        await signOut(auth)
        setError("You need to sign up first.")
        return
      }

    } catch (error: any) {
      if (auth.currentUser) await signOut(auth)
      setError(error.message || "Failed to login.")
    } finally {
      setGoogleLoading(false)
      setAuthInProgress(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <CircleDollarSign className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">TrackSmart</span>
          </Link>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="ml-auto inline-block text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={formLoading || googleLoading}>
                {formLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={formLoading || googleLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Logging in..." : "Continue with Google"}
          </Button>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
