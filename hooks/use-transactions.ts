"use client";
import { useState, useEffect, useCallback } from "react";
import type {
  Transaction,
  Profile,
  ProfileConfig,
  UserInitData,
} from "../lib/types";
import { DataService } from "../lib/data-service";
import { useAuth } from "../components/context/authContext";
import { DEFAULT_CURRENCY, getCurrencyByCode } from "../lib/currency";
const defaultProfiles: ProfileConfig[] = [
  {
    id: "personal",
    name: "Personal",
    color: "#10b981",
    description: "Personal expenses and income",
    currency: "USD",
    createdAt: new Date().toISOString(),
  },
  {
    id: "agency",
    name: "Agency",
    color: "#3b82f6",
    description: "Business agency transactions",
    currency: "USD",
    createdAt: new Date().toISOString(),
  },
  {
    id: "team",
    name: "Team",
    color: "#8b5cf6",
    description: "Team-related expenses",
    currency: "USD",
    createdAt: new Date().toISOString(),
  },
];
export function useTransactions() {
  const { user, loading: authLoading, authInProgress } = useAuth();
  const [transactionsByProfile, setTransactionsByProfile] = useState<
    Record<Profile, Transaction[]>
  >({});
  const [profiles, setProfiles] = useState<ProfileConfig[]>(defaultProfiles);
  const [currentProfile, setCurrentProfile] = useState<Profile>("personal");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsInitialization, setNeedsInitialization] = useState(false);
  const dataService = DataService.getInstance();

  useEffect(() => {
    dataService.setUserId(user?.uid || null);
  }, [user, dataService]);

  useEffect(() => {
    if (authLoading || !user || authInProgress) return;
    const checkInitialization = async () => {
      try {
        const existingProfiles = await dataService.getProfiles();
        if (existingProfiles.length === 0) {
          setNeedsInitialization(true);
        }
      } catch (error) {
        console.error("Error checking initialization:", error);
        setNeedsInitialization(true);
      }
    };
    checkInitialization();
  }, [user, authLoading, authInProgress, dataService]);

  const initializeUserData = useCallback(async () => {
    if (!user || !needsInitialization) return;
    try {
      // Read local data safely
      const localProfilesRaw =
        typeof window !== "undefined"
          ? localStorage.getItem("expense-tracker-profiles")
          : null;
      const localTxRaw =
        typeof window !== "undefined"
          ? localStorage.getItem("expense-tracker-transactions")
          : null;
      const localCurrentProfile =
        typeof window !== "undefined"
          ? localStorage.getItem("expense-tracker-current-profile")
          : null;

      const parsedProfiles: ProfileConfig[] =
        (localProfilesRaw && JSON.parse(localProfilesRaw)) || defaultProfiles;

      // Determine current profile from local or default
      const resolvedCurrentProfile: Profile =
        (localCurrentProfile &&
          parsedProfiles.find((p) => p.id === localCurrentProfile)?.id) ||
        parsedProfiles[0]?.id ||
        "personal";

      // Read transactions map
      const parsedTransactions: Record<Profile, Transaction[]> =
        (localTxRaw && JSON.parse(localTxRaw)) || {};

      // Ensure keys exist for all profiles
      parsedProfiles.forEach((p) => {
        if (!parsedTransactions[p.id]) parsedTransactions[p.id] = [];
      });

      // Update UI state right away
      setProfiles(parsedProfiles);
      setCurrentProfile(resolvedCurrentProfile);
      setTransactionsByProfile(parsedTransactions);

      const initData: UserInitData = {
        profiles: parsedProfiles,
        currentProfile: resolvedCurrentProfile,
        transactions: parsedTransactions,
      };

      await dataService.initializeUserData(initData);
      setNeedsInitialization(false);
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
  }, [user, needsInitialization, dataService]);

  useEffect(() => {
    if (authLoading || authInProgress) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Ensure any local data is migrated before fetching
        await dataService.migrateLocalDataToFirestore();

        if (needsInitialization) {
          await initializeUserData();
        }

        const storedProfiles = await dataService.getProfiles();
        if (storedProfiles.length > 0) {
          setProfiles(storedProfiles);
          const storedCurrentProfile = await dataService.getCurrentProfile();
          let profileToSet: Profile = "personal";
          if (
            storedCurrentProfile &&
            storedProfiles.find((p) => p.id === storedCurrentProfile)
          ) {
            profileToSet = storedCurrentProfile as Profile;
          } else if (storedProfiles.length > 0) {
            profileToSet = storedProfiles[0].id as Profile;
          }
          setCurrentProfile(profileToSet);
        } else {
          // Seed defaults in absence of profiles
          const initData: UserInitData = {
            profiles: defaultProfiles,
            currentProfile: defaultProfiles[0].id,
            transactions: {},
          };
          await dataService.initializeUserData(initData);
          setProfiles(defaultProfiles);
          setCurrentProfile(defaultProfiles[0].id as Profile);
        }

        const storedTransactions = await dataService.getTransactions();
        if (Object.keys(storedTransactions).length > 0) {
          setTransactionsByProfile(
            storedTransactions as Record<Profile, Transaction[]>
          );
        } else {
          const initialData: Record<Profile, Transaction[]> = {};
          const profilesToUse =
            storedProfiles.length > 0 ? storedProfiles : defaultProfiles;
          profilesToUse.forEach((profile) => {
            initialData[profile.id as Profile] = [];
          });
          setTransactionsByProfile(initialData);
        }
      } catch (error) {
        console.error("Failed to load data", error);
        setProfiles(defaultProfiles);
        setCurrentProfile("personal");
        const initialData: Record<Profile, Transaction[]> = {};
        defaultProfiles.forEach((profile) => {
          initialData[profile.id as Profile] = [];
        });
        setTransactionsByProfile(initialData);
      } finally {
        setIsLoaded(true);
        setIsLoading(false);
      }
    };
    if (!authLoading && !authInProgress) {
      loadData();
    }
  }, [
    user?.uid,
    authLoading,
    authInProgress,
    needsInitialization,
    initializeUserData,
    dataService,
  ]);

  const switchProfile = useCallback(
    async (profile: Profile) => {
      console.log("Switching to profile:", profile);
      setCurrentProfile(profile);
      await dataService.setCurrentProfile(profile);
    },
    [dataService]
  );
  const addTransaction = useCallback(
    async (transaction: Transaction) => {
      try {
        const docRef = await dataService.addTransaction(transaction);
        const newTransaction: Transaction = {
          ...transaction,
          id: docRef,
        };
        setTransactionsByProfile((prev) => ({
          ...prev,
          [newTransaction.profile]: [
            newTransaction,
            ...(prev[newTransaction.profile] || []),
          ],
        }));
      } catch (error) {
        console.error("Failed to add transaction:", error);
        throw error;
      }
    },
    [dataService]
  );
  const deleteTransaction = useCallback(
    async (id: string, profile: Profile) => {
      try {
        await dataService.deleteTransaction(id, profile);
        setTransactionsByProfile((prev) => ({
          ...prev,
          [profile]: (prev[profile] || []).filter((t) => t.id !== id),
        }));
      } catch (error) {
        console.error("Failed to delete transaction:", error);
        throw error;
      }
    },
    [dataService]
  );
  const addProfile = useCallback(
    async (profileData: Omit<ProfileConfig, "id" | "createdAt">) => {
      const newProfile: ProfileConfig = {
        ...profileData,
        id: profileData.name.toLowerCase().replace(/\s+/g, "-"),
        currency: DEFAULT_CURRENCY.code,
        createdAt: new Date().toISOString(),
      };
      // Update UI state immediately
      setProfiles((prev) => [...prev, newProfile]);
      setTransactionsByProfile((prev) => ({
        ...prev,
        [newProfile.id]: [],
      }));
      setCurrentProfile(newProfile.id);
      try {
        await dataService.addProfile(newProfile);
        await dataService.setCurrentProfile(newProfile.id);
        return newProfile;
      } catch (error) {
        console.error("Failed to add profile:", error);
        throw error;
      } finally {
        initializeUserData();
      }
    },
    [dataService, initializeUserData]
  );
  const updateProfile = useCallback(
    async (
      profileId: string,
      updates: Partial<Omit<ProfileConfig, "id" | "createdAt">>
    ) => {
      // Update UI state immediately
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === profileId ? { ...profile, ...updates } : profile
        )
      );
      try {
        await dataService.updateProfile(profileId, updates);
      } catch (error) {
        console.error("Failed to update profile:", error);
        throw error;
      } finally {
        initializeUserData();
      }
    },
    [dataService, initializeUserData]
  );
  const updateProfileCurrency = useCallback(
    async (profileId: string, currencyCode: string) => {
      await updateProfile(profileId, { currency: currencyCode });
    },
    [updateProfile]
  );
  const deleteProfile = useCallback(
    async (profileId: string) => {
      // Update UI state immediately
      setProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
      setTransactionsByProfile((prev) => {
        const updated = { ...prev };
        delete updated[profileId];
        return updated;
      });
      if (currentProfile === profileId) {
        const remainingProfiles = profiles.filter((p) => p.id !== profileId);
        if (remainingProfiles.length > 0) {
          switchProfile(remainingProfiles[0].id);
        }
      }
      try {
        await dataService.deleteProfile(profileId);
      } catch (error) {
        console.error("Failed to delete profile:", error);
        throw error;
      } finally {
        initializeUserData();
      }
    },
    [dataService, currentProfile, profiles, switchProfile, initializeUserData]
  );
  const updateTransaction = useCallback(
    async (
      transactionId: string,
      profile: Profile,
      updates: Partial<Omit<Transaction, "id" | "profile">>
    ) => {
      try {
        await dataService.updateTransaction(transactionId, profile, updates);
        setTransactionsByProfile((prev) => ({
          ...prev,
          [profile]: (prev[profile] || []).map((t) =>
            t.id === transactionId ? { ...t, ...updates } : t
          ),
        }));
      } catch (error) {
        console.error("Failed to update transaction:", error);
        throw error;
      }
    },
    [dataService]
  );
  return {
    transactions: transactionsByProfile[currentProfile] || [],
    allTransactions: transactionsByProfile,
    profiles,
    currentProfile,
    addTransaction,
    deleteTransaction,
    addProfile,
    setCurrentProfile,
    updateProfile,
    updateProfileCurrency,
    deleteProfile,
    switchProfile,
    isLoaded,
    isLoading,
    updateTransaction,
  };
}
