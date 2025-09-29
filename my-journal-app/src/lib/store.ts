import { create } from 'zustand';

interface UserStore {
  address: `0x${string}` | null;
  setAddress: (address: `0x${string}`) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  address: null,
  setAddress: (address) => set({ address }),
}));
