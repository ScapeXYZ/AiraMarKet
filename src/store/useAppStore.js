import { create } from 'zustand';

const useAppStore = create((set) => ({
  isDarkMode: false,
  toggleTheme: () => set((state) => {
    const nextVal = !state.isDarkMode;
    if (nextVal) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: nextVal };
  }),
  
  profileData: {
    nickname: 'Trader_Anon',
    picture: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5mynRnO05PMYjJd4c9pATpp_CQNpzcuGCuynRG5rI2sR6fjElHLEmsj0uuq1_37kGszQW6Lm7Nx73hl71PgeFxr9oOyn14HpIVZkkfbHiEskuSrePFACjwxxNoJdO8xjTP0jpBN1bTi4K6IpZangC3HOfa0rNiJmVinhzBTn0HsixddoBCOCgjXN3d0SNJkz4EKnodR6fkkh14DscesLHVZ0wRgeEQKOqoC8cABi8GQ95kMVMGB4UgCFztlOQANyh7SsvMYkWoNA',
    xHandle: ''
  },
  setProfileData: (data) => set({ profileData: data }),
  
  activeMarket: {},
  setActiveMarket: (market) => set({ activeMarket: market }),
}));

export default useAppStore;
