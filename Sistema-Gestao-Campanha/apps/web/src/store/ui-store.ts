import { create } from 'zustand'

type UiState = {
  mobileMenuOpen: boolean
  peopleFiltersOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  setPeopleFiltersOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  mobileMenuOpen: false,
  peopleFiltersOpen: false,
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
  setPeopleFiltersOpen: (peopleFiltersOpen) => set({ peopleFiltersOpen }),
}))
