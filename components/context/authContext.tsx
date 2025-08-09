"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { DataService } from '@/lib/data-service'

interface AuthContextType {
    user: User | null
    setUser: (user: User | null) => void
    loading: boolean
    authInProgress: boolean
    setAuthInProgress: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    setUser: () => { },
    authInProgress: false,
    setAuthInProgress: () => { }
})

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [authInProgress, setAuthInProgress] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser)
            const dataService = DataService.getInstance();
            dataService.setUserId(firebaseUser?.uid || null);
            setLoading(false)
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const runMigration = async () => {
            if (user && !authInProgress) {
                setAuthInProgress(true);
                try {
                    const dataService = DataService.getInstance();

                    dataService.setUserId(user.uid);
                    await dataService.migrateLocalDataToFirestore();
                } catch (error) {
                    console.error('Failed to migrate local data to Firestore:', error);
                } finally {
                    setAuthInProgress(false);
                }
            }
        };

        runMigration();
    }, [user]);


    return (
        <AuthContext.Provider value={{
            user,
            loading,
            setUser,
            authInProgress,
            setAuthInProgress
        }}>
            {children}
        </AuthContext.Provider>
    )
}
