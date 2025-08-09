"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { CircleDollarSign, ArrowLeft, Mail, Calendar, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Separator } from "../../components/ui/separator";
import { auth } from "@/lib/firebase";
import { signOut, updateProfile, deleteUser, User, EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../components/ui/alert-dialog";
import { useAuth } from "@/components/context/authContext";
import emailjs from "@emailjs/browser";
import { sendPasswordResetEmail, updatePassword, linkWithCredential } from "firebase/auth";

type DeleteAccountOptions = {
    user: User;
    password?: string; // required for email/password users
    onSuccess?: () => void;
    onError?: (message: string) => void;
};

export const deleteUserWithReauthentication = async ({
    user,
    password,
    onSuccess,
    onError,
}: DeleteAccountOptions) => {
    try {
        const providerId = user.providerData[0]?.providerId;
        if (providerId === "password") {
            if (!password || !user.email) {
                throw new Error("Password and email are required for reauthentication");
            }
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
        } else if (providerId === "google.com") {
            const googleProvider = new GoogleAuthProvider();
            await reauthenticateWithPopup(user, googleProvider);
        } else {
            throw new Error(`Unsupported auth provider: ${providerId}`);
        }
        await deleteUser(user);
        onSuccess?.();
    } catch (error: any) {
        console.error("Error deleting user:", error);
        onError?.(error.message || "Failed to delete user");
    }
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [submit, setSubmit] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState("");
    const [otpSuccess, setOtpSuccess] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showAddPassword, setShowAddPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordActionError, setPasswordActionError] = useState("");
    const [passwordActionSuccess, setPasswordActionSuccess] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [changeLoading, setChangeLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState("");
    const [resetError, setResetError] = useState("");

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push("/");
        } else {
            setDisplayName(user.displayName || "");
        }
    }, [user, loading, router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmit(true);
        setError("");
        setSuccess("");
        try {
            await updateProfile(user, {
                displayName: displayName.trim() || null,
            });
            setSuccess("Profile updated successfully");
        } catch (error: any) {
            setError(error.message || "Failed to update profile");
        } finally {
            setSubmit(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleDeleteAccountWithReauth = async () => {
        if (!user) return;
        setVerifyingOtp(true);
        setOtpError("");
        setPasswordError("");
        setOtpSuccess("");
        setPasswordSuccess("");
        const providerId = user.providerData[0]?.providerId;
        try {
            if (providerId === "password") {
                if (!password) {
                    setPasswordError("Password is required.");
                    setVerifyingOtp(false);
                    return;
                }
                await deleteUserWithReauthentication({
                    user,
                    password,
                    onSuccess: () => {
                        setPasswordSuccess("Account deleted successfully.");
                        router.push("/");
                    },
                    onError: (msg) => setPasswordError(msg),
                });
            } else if (providerId === "google.com") {
                await deleteUserWithReauthentication({
                    user,
                    onSuccess: () => {
                        setOtpSuccess("Account deleted successfully.");
                        router.push("/");
                    },
                    onError: (msg) => setOtpError(msg),
                });
            }
        } catch (err: any) {
            if (providerId === "password") setPasswordError("Failed to delete account.");
            else setOtpError("Failed to delete account.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    const sendOtp = async () => {
        setOtpLoading(true);
        setOtpError("");
        setOtpSuccess("");
        try {
            const OTP = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(OTP);
            if (!user?.email) throw new Error("User email not found");
            await emailjs.send(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string,
                process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID as string,
                {
                    email: user.email,
                    passcode: OTP,
                    year: new Date().getFullYear(),
                },
                process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string
            );
            setOtpSent(true);
            setOtpSuccess("OTP sent to your email.");
        } catch (err) {
            setOtpError("Failed to send OTP. Please try again.");
        } finally {
            setOtpLoading(false);
        }
    };

    const verifyOtpAndDelete = async () => {
        setVerifyingOtp(true);
        setOtpError("");
        setOtpSuccess("");
        try {


            if (otp.toString() !== generatedOtp?.toString()) {
                setOtpError("Invalid OTP. Please check your email and try again.");
                setVerifyingOtp(false);
                return;
            }
            await handleDeleteAccountWithReauth();
        } catch (err) {
            setOtpError("Failed to delete account.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    const getUserInitials = (email: string | null) => {
        if (!email) return "U";
        return email.charAt(0).toUpperCase();
    };

    const formatDate = (date: string | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString();
    };

    if (!user) {
        return null;
    }

    // Helper to check if user has password provider linked
    const hasPasswordProvider = user?.providerData.some((p) => p.providerId === "password");

    // Add password for Google user
    const handleAddPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordActionError("");
        setPasswordActionSuccess("");
        if (!user?.email) return;
        if (!newPassword || newPassword.length < 6) {
            setPasswordActionError("Password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordActionError("Passwords do not match.");
            return;
        }
        setChangeLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, newPassword);
            await linkWithCredential(user, credential);
            setPasswordActionSuccess("Password added successfully.");
            setShowAddPassword(false);
        } catch (err: any) {
            setPasswordActionError(err.message || "Failed to add password.");
        } finally {
            setChangeLoading(false);
        }
    };

    // Change password for email/password or Google+password users
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordActionError("");
        setPasswordActionSuccess("");
        if (!user?.email) return;
        if (!oldPassword || !newPassword) {
            setPasswordActionError("Please fill all fields.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordActionError("New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordActionError("Passwords do not match.");
            return;
        }
        setChangeLoading(true);
        try {
            // Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setPasswordActionSuccess("Password changed successfully.");
            setShowChangePassword(false);
        } catch (err: any) {
            setPasswordActionError(err.message || "Failed to change password.");
        } finally {
            setChangeLoading(false);
        }
    };

    // Reset password (send email)
    const handleResetPassword = async () => {
        setResetError("");
        setResetSuccess("");
        setResetLoading(true);
        try {
            if (!user?.email) throw new Error("No email found.");
            await sendPasswordResetEmail(auth, user.email);
            setResetSuccess("Password reset email sent.");
        } catch (err: any) {
            setResetError(err.message || "Failed to send reset email.");
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-xs px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <CircleDollarSign className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold">TrackSmart</span>
                    </Link>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="max-w-2xl mx-auto w-full space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold">Profile Settings</h1>
                        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {/* <User className="h-5 w-5" /> */}
                                Profile Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                                    <AvatarFallback className="text-2xl">{getUserInitials(user.email)}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-semibold">{user.displayName || "User"}</h3>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Joined {formatDate(user.metadata.creationTime ?? null)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Update Profile</CardTitle>
                            <CardDescription>Make changes to your profile information.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                {error && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                                        {success}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        type="text"
                                        placeholder="Enter your display name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={user.email || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                </div>
                                <Button type="submit" disabled={submit}>
                                    {submit ? "Updating..." : "Update Profile"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Password Management</CardTitle>
                            <CardDescription>
                                Manage your password for account security.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* For email/password users */}
                            {user.providerData[0]?.providerId === "password" && (
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setShowChangePassword((v) => !v);
                                            setShowAddPassword(false);
                                            setPasswordActionError("");
                                            setPasswordActionSuccess("");
                                            setOldPassword("");
                                            setNewPassword("");
                                            setConfirmPassword("");
                                        }}
                                    >
                                        Change Password
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleResetPassword}
                                        disabled={resetLoading}
                                    >
                                        {resetLoading ? "Sending..." : "Reset Password (Email)"}
                                    </Button>
                                    {/* Show confirmation after sending reset email */}
                                    {resetSuccess && (
                                        <div className="p-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded mt-2">
                                            {resetSuccess}
                                        </div>
                                    )}
                                    {resetError && (
                                        <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded mt-2">
                                            {resetError}
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* For Google users */}
                            {user.providerData[0]?.providerId === "google.com" && (
                                <div className="space-y-3">
                                    {!hasPasswordProvider ? (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                setShowAddPassword((v) => !v);
                                                setShowChangePassword(false);
                                                setPasswordActionError("");
                                                setPasswordActionSuccess("");
                                                setOldPassword("");
                                                setNewPassword("");
                                                setConfirmPassword("");
                                            }}
                                        >
                                            Add Password
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => {
                                                    setShowChangePassword((v) => !v);
                                                    setShowAddPassword(false);
                                                    setPasswordActionError("");
                                                    setPasswordActionSuccess("");
                                                    setOldPassword("");
                                                    setNewPassword("");
                                                    setConfirmPassword("");
                                                }}
                                            >
                                                Change Password
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={handleResetPassword}
                                                disabled={resetLoading}
                                            >
                                                {resetLoading ? "Sending..." : "Reset Password (Email)"}
                                            </Button>
                                            {/* Show confirmation after sending reset email */}
                                            {resetSuccess && (
                                                <div className="p-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded mt-2">
                                                    {resetSuccess}
                                                </div>
                                            )}
                                            {resetError && (
                                                <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded mt-2">
                                                    {resetError}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            {/* Add Password Form */}
                            {showAddPassword && (
                                <form onSubmit={handleAddPassword} className="space-y-2 mt-4">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New password"
                                    />
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm password"
                                    />
                                    {passwordActionError && (
                                        <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                            {passwordActionError}
                                        </div>
                                    )}
                                    {passwordActionSuccess && (
                                        <div className="p-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                                            {passwordActionSuccess}
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full" disabled={changeLoading}>
                                        {changeLoading ? "Adding..." : "Add Password"}
                                    </Button>
                                </form>
                            )}
                            {/* Change Password Form */}
                            {showChangePassword && (
                                <form onSubmit={handleChangePassword} className="space-y-2 mt-4">
                                    <Label htmlFor="oldPassword">Current Password</Label>
                                    <Input
                                        id="oldPassword"
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        placeholder="Current password"
                                    />
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New password"
                                    />
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                    {passwordActionError && (
                                        <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                            {passwordActionError}
                                        </div>
                                    )}
                                    {passwordActionSuccess && (
                                        <div className="p-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                                            {passwordActionSuccess}
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full" disabled={changeLoading}>
                                        {changeLoading ? "Changing..." : "Change Password"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Actions</CardTitle>
                            <CardDescription>Manage your account settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" onClick={handleLogout} className="w-full">
                                Sign Out
                            </Button>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => {
                                                setOtp("");
                                                setOtpSent(false);
                                                setOtpError("");
                                                setOtpSuccess("");
                                                setPassword("");
                                                setPasswordError("");
                                                setPasswordSuccess("");
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Account
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your account
                                                and remove your data from our servers.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        {/* Show password prompt for email/password users, OTP for Google users */}
                                        {user.providerData[0]?.providerId === "password" ? (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="password">Enter your password to confirm</Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Password"
                                                    />
                                                </div>
                                                {passwordError && (
                                                    <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                                        {passwordError}
                                                    </div>
                                                )}
                                                {passwordSuccess && (
                                                    <div className="p-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                                                        {passwordSuccess}
                                                    </div>
                                                )}
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <Button
                                                        type="button"
                                                        onClick={handleDeleteAccountWithReauth}
                                                        disabled={verifyingOtp}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        {verifyingOtp ? "Deleting..." : "Delete Account"}
                                                    </Button>
                                                </AlertDialogFooter>
                                            </>
                                        ) : (
                                            !otpSent ? (
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <Button
                                                        type="button"
                                                        onClick={sendOtp}
                                                        disabled={otpLoading}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        {otpLoading ? "Sending OTP..." : "Send OTP to Email"}
                                                    </Button>
                                                </AlertDialogFooter>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="otp">Enter OTP sent to your email</Label>
                                                        <Input
                                                            id="otp"
                                                            type="text"
                                                            value={otp}
                                                            onChange={(e) => setOtp(e.target.value)}
                                                            placeholder="Enter OTP"
                                                            maxLength={6}
                                                        />
                                                    </div>
                                                    {otpError && (
                                                        <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                                            {otpError}
                                                        </div>
                                                    )}
                                                    {otpSuccess && (
                                                        <div className="p-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                                                            {otpSuccess}
                                                        </div>
                                                    )}
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <Button
                                                            type="button"
                                                            onClick={verifyOtpAndDelete} // <-- call verifyOtpAndDelete here
                                                            disabled={verifyingOtp}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            {verifyingOtp ? "Verifying..." : "Delete Account"}
                                                        </Button>
                                                    </AlertDialogFooter>
                                                </>
                                            )
                                        )}
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </div >
            </main >
        </div >
    );
}
