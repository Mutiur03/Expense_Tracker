import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Transaction, ProfileConfig, UserInitData } from "./types";
import { DEFAULT_CURRENCY } from "./currency";

export class DataService {
  private static instance: DataService;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  private getUserDocRef() {
    if (!this.userId) throw new Error("User not authenticated");
    return doc(db, "users", this.userId);
  }

  private getTransactionCollectionRef() {
    if (!this.userId) throw new Error("User not authenticated");
    return collection(db, "users", this.userId, "transactions");
  }

  async initializeUserData(initData: UserInitData): Promise<void> {
    if (!this.userId) {
      console.log("Initializing localStorage for non-authenticated user");

      localStorage.setItem(
        "expense-tracker-profiles",
        JSON.stringify(initData.profiles)
      );
      localStorage.setItem(
        "expense-tracker-current-profile",
        initData.profiles[0]?.id || "personal"
      );

      const transactionsByProfile: Record<string, Transaction[]> = {};
      for (const profile of initData.profiles) {
        if (initData.transactions[profile.id]?.length > 0) {
          transactionsByProfile[profile.id] = initData.transactions[profile.id];
        }
      }
      localStorage.setItem(
        "expense-tracker-transactions",
        JSON.stringify(transactionsByProfile)
      );
      return;
    }

    const userDocRef = this.getUserDocRef();
    await setDoc(userDocRef, {
      profiles: initData.profiles,

      currentProfile: initData.profiles[0]?.id || "personal",
      createdAt: new Date().toISOString(),
    });

    for (const profile of initData.profiles) {
      if (initData.transactions[profile.id]?.length > 0) {
        for (const transaction of initData.transactions[profile.id]) {
          console.log(transaction);

          await this.addTransaction(transaction);
        }
      }
    }
  }

  async getProfiles(): Promise<ProfileConfig[]> {
    if (!this.userId) {
      const stored = localStorage.getItem("expense-tracker-profiles");
      return stored ? JSON.parse(stored) : [];
    }

    try {
      const userDoc = await getDoc(this.getUserDocRef());
      if (userDoc.exists()) {
        return userDoc.data().profiles || [];
      }
      return [];
    } catch (error) {
      console.error("Error getting profiles:", error);
      return [];
    }
  }

  async saveProfiles(profiles: ProfileConfig[]): Promise<void> {
    if (!this.userId) {
      localStorage.setItem(
        "expense-tracker-profiles",
        JSON.stringify(profiles)
      );
      return;
    }

    try {
      await updateDoc(this.getUserDocRef(), {
        profiles,
      });
    } catch (error) {
      console.error("Error saving profiles:", error);
      throw error;
    }
  }

  async addProfile(profile: ProfileConfig): Promise<void> {
    const profiles = await this.getProfiles();
    profiles.push(profile);
    await this.saveProfiles(profiles);
  }

  async updateProfile(
    profileId: string,
    updates: Partial<Omit<ProfileConfig, "id" | "createdAt">>
  ): Promise<void> {
    const profiles = await this.getProfiles();
    const index = profiles.findIndex((p) => p.id === profileId);
    console.log("Updating profile:", profileId, "with updates:", updates);
    console.log("Current profiles before update:", profiles);

    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      console.log("Updated profile:", profiles[index]);
      console.log("All profiles after update:", profiles);
      await this.saveProfiles(profiles);
    } else {
      console.warn("Profile not found for update:", profileId);
    }
  }

  async deleteProfile(profileId: string): Promise<void> {
    const profiles = await this.getProfiles();
    const filteredProfiles = profiles.filter((p) => p.id !== profileId);
    await this.saveProfiles(filteredProfiles);

    if (!this.userId) {
      try {
        const stored = localStorage.getItem("expense-tracker-transactions");
        if (stored) {
          const transactions = JSON.parse(stored);
          delete transactions[profileId];
          localStorage.setItem(
            "expense-tracker-transactions",
            JSON.stringify(transactions)
          );
        }
      } catch (error) {
        console.error(
          "Error deleting profile transactions from localStorage:",
          error
        );
      }
    } else {
      try {
        const transactionsRef = this.getTransactionCollectionRef();
        const q = query(transactionsRef, where("profile", "==", profileId));
        const querySnapshot = await getDocs(q);

        const deletePromises = querySnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
      } catch (error) {
        console.error(
          "Error deleting profile transactions from Firestore:",
          error
        );
      }
    }
  }

  async getCurrentProfile(): Promise<string | null> {
    if (!this.userId) {
      return localStorage.getItem("expense-tracker-current-profile");
    }

    try {
      const userDoc = await getDoc(this.getUserDocRef());
      if (userDoc.exists()) {
        return userDoc.data().currentProfile || null;
      }
      return null;
    } catch (error) {
      console.error("Error getting current profile:", error);
      return null;
    }
  }

  async setCurrentProfile(profile: string): Promise<void> {
    if (!this.userId) {
      localStorage.setItem("expense-tracker-current-profile", profile);
      console.log("Set current profile in localStorage:", profile);

      return;
    }

    try {
      console.log("Setting current profile in Firestore:", profile);
      await updateDoc(this.getUserDocRef(), {
        currentProfile: profile,
      });
    } catch (error) {
      console.error("Error setting current profile:", error);
      throw error;
    }
  }

  async getCurrency(): Promise<string> {
    if (!this.userId) {
      const currentProfileId = localStorage.getItem(
        "expense-tracker-current-profile"
      );
      const stored = localStorage.getItem("expense-tracker-profiles");
      if (stored && currentProfileId) {
        const profiles: ProfileConfig[] = JSON.parse(stored);
        const profile = profiles.find((p) => p.id === currentProfileId);
        console.log("Getting currency - Found profile:", profile);

        return profile?.currency || DEFAULT_CURRENCY.code;
      }
      return DEFAULT_CURRENCY.code;
    }

    try {
      const userDoc = await getDoc(this.getUserDocRef());
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentProfile = userData.currentProfile;
        const profiles = userData.profiles || [];

        console.log("Getting currency - Current profile:", currentProfile);
        console.log("Getting currency - Available profiles:", profiles);

        const profile = profiles.find(
          (p: ProfileConfig) => p.id === currentProfile
        );
        console.log("Getting currency - Found profile:", profile);

        return profile?.currency || DEFAULT_CURRENCY.code;
      }
      return DEFAULT_CURRENCY.code;
    } catch (error) {
      console.error("Error getting currency:", error);
      return DEFAULT_CURRENCY.code;
    }
  }

  async setCurrency(currencyCode: string): Promise<void> {
    if (!this.userId) {
      const stored = localStorage.getItem("expense-tracker-profiles");
      const currentProfileId = localStorage.getItem(
        "expense-tracker-current-profile"
      );

      if (stored && currentProfileId) {
        const profiles: ProfileConfig[] = JSON.parse(stored);
        const profileIndex = profiles.findIndex(
          (p) => p.id === currentProfileId
        );

        if (profileIndex !== -1) {
          profiles[profileIndex].currency = currencyCode;
          localStorage.setItem(
            "expense-tracker-profiles",
            JSON.stringify(profiles)
          );
        }
      }

      return;
    }

    try {
      const userDocRef = this.getUserDocRef();
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          profiles: [],
          currentProfile: "personal",
          createdAt: new Date().toISOString(),
        });
      }

      const userData = userDoc.data();
      const currentProfile = userData?.currentProfile;
      const profiles = userData?.profiles || [];

      if (currentProfile) {
        const profileIndex = profiles.findIndex(
          (p: ProfileConfig) => p.id === currentProfile
        );
        if (profileIndex !== -1) {
          profiles[profileIndex].currency = currencyCode;
          await updateDoc(userDocRef, { profiles });
        }
      }
    } catch (error) {
      console.error("Error setting currency:", error);

      throw error;
    }
  }

  async getTransactions(): Promise<Record<string, Transaction[]>> {
    if (!this.userId) {
      try {
        const stored = localStorage.getItem("expense-tracker-transactions");
        return stored ? JSON.parse(stored) : {};
      } catch (error) {
        console.error("Error parsing localStorage transactions:", error);
        return {};
      }
    }

    try {
      const transactionsRef = this.getTransactionCollectionRef();
      const querySnapshot = await getDocs(transactionsRef);

      const transactionsByProfile: Record<string, Transaction[]> = {};

      querySnapshot.docs.forEach((doc) => {
        const transaction = { id: doc.id, ...doc.data() } as Transaction;
        console.log("Parsed transaction:", transaction);
        if (!transactionsByProfile[transaction.profile]) {
          transactionsByProfile[transaction.profile] = [];
        }
        transactionsByProfile[transaction.profile].push(transaction);
      });

      Object.keys(transactionsByProfile).forEach((profile) => {
        transactionsByProfile[profile].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });

      return transactionsByProfile;
    } catch (error) {
      console.error("Error getting transactions from Firestore:", error);

      try {
        const stored = localStorage.getItem("expense-tracker-transactions");
        return stored ? JSON.parse(stored) : {};
      } catch (localError) {
        console.error("Error parsing localStorage transactions:", localError);
        return {};
      }
    }
  }

  async addTransaction(transaction: Transaction): Promise<string> {
    if (!this.userId) {
      try {
        const stored = localStorage.getItem("expense-tracker-transactions");
        const transactions = stored ? JSON.parse(stored) : {};

        if (!transaction.id) {
          transaction.id =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        }

        if (!transactions[transaction.profile]) {
          transactions[transaction.profile] = [];
        }
        transactions[transaction.profile].unshift(transaction);

        localStorage.setItem(
          "expense-tracker-transactions",
          JSON.stringify(transactions)
        );
        return transaction.id;
      } catch (error) {
        console.error("Error saving transaction to localStorage:", error);
        throw error;
      }
    }

    try {
      const transactionsRef = this.getTransactionCollectionRef();
      const docRef = await addDoc(transactionsRef, {
        ...transaction,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding transaction to Firestore:", error);
      try {
        const stored = localStorage.getItem("expense-tracker-transactions");
        const transactions = stored ? JSON.parse(stored) : {};

        if (!transactions[transaction.profile]) {
          transactions[transaction.profile] = [];
        }
        transactions[transaction.profile].unshift(transaction);

        localStorage.setItem(
          "expense-tracker-transactions",
          JSON.stringify(transactions)
        );
        console.log("Transaction saved to localStorage as fallback");
        return "localstorage";
      } catch (localError) {
        console.error(
          "Error saving transaction to localStorage fallback:",
          localError
        );
        throw error;
      }
    }
  }

  async deleteTransaction(
    transactionId: string,
    profile: string
  ): Promise<void> {
    if (!this.userId) {
      if (!transactionId) {
        console.warn(
          `Attempted to delete a transaction with an empty id in profile "${profile}". Operation skipped.`
        );
        return;
      }
      try {
        const stored = localStorage.getItem("expense-tracker-transactions");
        const transactions = stored ? JSON.parse(stored) : {};

        if (transactions[profile]) {
          const originalLength = transactions[profile].length;
          transactions[profile] = transactions[profile].filter(
            (t: Transaction) => t.id !== transactionId
          );
          if (transactions[profile].length === originalLength) {
            console.warn(
              `Transaction id "${transactionId}" not found in profile "${profile}" for local deletion.`
            );
          }

          if (transactions[profile].length === 0) {
            delete transactions[profile];
          }
          localStorage.setItem(
            "expense-tracker-transactions",
            JSON.stringify(transactions)
          );
        } else {
          console.warn(
            `Profile "${profile}" not found in local transactions for deletion.`
          );
        }
      } catch (error) {
        console.error("Error deleting transaction from localStorage:", error);
        throw error;
      }
      return;
    }

    try {
      const transactionDocRef = doc(
        this.getTransactionCollectionRef(),
        transactionId
      );
      console.log("Deleting transaction from Firestore:", transactionDocRef);
      await deleteDoc(transactionDocRef);
    } catch (error) {
      console.error("Error deleting transaction from Firestore:", error);
      throw error;
    }
  }

  async updateTransaction(
    transactionId: string,
    profile: string,
    updates: Partial<Omit<Transaction, "id" | "profile">>
  ): Promise<void> {
    if (!this.userId) {
      try {
        const stored = localStorage.getItem("expense-tracker-transactions");
        const transactions = stored ? JSON.parse(stored) : {};
        if (transactions[profile]) {
          const idx = transactions[profile].findIndex(
            (t: Transaction) => t.id === transactionId
          );
          if (idx !== -1) {
            transactions[profile][idx] = {
              ...transactions[profile][idx],
              ...updates,
              id: transactionId,
              profile,
            };
            localStorage.setItem(
              "expense-tracker-transactions",
              JSON.stringify(transactions)
            );
          }
        }
      } catch (error) {
        console.error("Error updating transaction in localStorage:", error);
        throw error;
      }
      return;
    }

    try {
      const transactionDocRef = doc(
        this.getTransactionCollectionRef(),
        transactionId
      );
      await updateDoc(transactionDocRef, updates);
    } catch (error) {
      console.error("Error updating transaction in Firestore:", error);
      throw error;
    }
  }

  async migrateLocalDataToFirestore(): Promise<void> {
    console.log("Migration attempt - userId:", this.userId);

    if (!this.userId) {
      console.warn("Migration skipped: User not authenticated");
      return;
    }

    try {
      const localProfiles = localStorage.getItem("expense-tracker-profiles");
      const localCurrentProfile = localStorage.getItem(
        "expense-tracker-current-profile"
      );
      const localTransactions = localStorage.getItem(
        "expense-tracker-transactions"
      );

      console.log("Local data found:", {
        profiles: !!localProfiles,
        currentProfile: !!localCurrentProfile,
        transactions: !!localTransactions,
      });

      if (!localProfiles && !localCurrentProfile && !localTransactions) {
        console.warn("Migration skipped: No local data found");
        return;
      }

      console.log("Starting migration to Firestore...");
      const userDoc = await getDoc(this.getUserDocRef());
      const userExists = userDoc.exists();

      const profiles: ProfileConfig[] = localProfiles
        ? JSON.parse(localProfiles)
        : [];
      const currentProfile =
        localCurrentProfile || profiles[0]?.id || "personal";
      const transactions: Record<string, Transaction[]> = localTransactions
        ? JSON.parse(localTransactions)
        : {};

      if (userExists) {
        const existingData = userDoc.data();
        const existingProfiles = existingData.profiles || [];

        const mergedProfiles = [...existingProfiles];
        for (const localProfile of profiles) {
          const existingProfileIndex = mergedProfiles.findIndex(
            (p) => p.id === localProfile.id
          );
          if (existingProfileIndex === -1) {
            mergedProfiles.push(localProfile);
          } else {
            // If local has transactions for this profile, update the profile info (currency, color, etc.) from local
            if (transactions[localProfile.id]?.length > 0) {
              mergedProfiles[existingProfileIndex] = {
                ...mergedProfiles[existingProfileIndex],
                ...localProfile,
              };
            }
          }
        }

        await updateDoc(this.getUserDocRef(), {
          profiles: mergedProfiles,
          currentProfile: existingData.currentProfile || currentProfile,
        });

        const transactionsRef = this.getTransactionCollectionRef();
        const migrationPromises: Promise<void>[] = [];

        Object.values(transactions)
          .flat()
          .forEach((transaction) => {
            migrationPromises.push(
              addDoc(transactionsRef, {
                ...transaction,
                createdAt: new Date().toISOString(),
              }).then(() => {})
            );
          });

        await Promise.all(migrationPromises);
        console.log(
          "Successfully merged local data with existing Firestore data"
        );
      } else {
        await setDoc(this.getUserDocRef(), {
          profiles,
          currentProfile,
          createdAt: new Date().toISOString(),
        });

        const transactionsRef = this.getTransactionCollectionRef();
        const migrationPromises: Promise<void>[] = [];

        Object.values(transactions)
          .flat()
          .forEach((transaction) => {
            migrationPromises.push(
              addDoc(transactionsRef, {
                ...transaction,
                createdAt: new Date().toISOString(),
              }).then(() => {})
            );
          });

        await Promise.all(migrationPromises);
        console.log(
          "Successfully migrated local data to new Firestore document"
        );
      }

      localStorage.removeItem("expense-tracker-profiles");
      localStorage.removeItem("expense-tracker-current-profile");
      localStorage.removeItem("expense-tracker-transactions");

      console.log("Local data cleared after successful migration");
    } catch (error) {
      console.error("Error migrating local data to Firestore:", error);
    }
  }
}
