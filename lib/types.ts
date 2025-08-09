export type Profile = string;

export type ProfileConfig = {
  id: string;
  name: string;
  color?: string;
  description?: string;
  currency: string; 
  createdAt: string;
};

export type Transaction = {
  id?: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  profile: Profile;
  currency: string; 
};

export type UserInitData = {
  profiles: ProfileConfig[];
  // currency: string;
  currentProfile:string;
  transactions: Record<Profile, Transaction[]>;
};
