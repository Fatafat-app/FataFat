import { create } from 'zustand';
import { BootstrapConfig, configService, VerticalConfig } from '../services/config.service';

interface ConfigStore {
  config: BootstrapConfig | null;
  isLoading: boolean;
  error: string | null;

  fetchBootstrap: () => Promise<void>;
  updateVertical: (vertical: 'food' | 'grocery', config: Partial<VerticalConfig>) => void;
  isVerticalAvailable: (vertical: 'food' | 'grocery') => boolean;
  getVerticalMessage: (vertical: 'food' | 'grocery') => { title: string; body: string } | null;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: {
    verticals: {
      food: { enabled: true, mode: 'ON', message: null },
      grocery: { enabled: true, mode: 'ON', message: null },
    },
    supportPhone: '+91 99999 99999',
    minAppVersion: '1.0.0',
    maintenance: false,
  },
  isLoading: false,
  error: null,

  fetchBootstrap: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await configService.getBootstrapConfig();
      if (data && data.verticals) {
        set({ config: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      console.warn('[ConfigStore] Bootstrap fetch failed, using fallback defaults:', err.message);
      set({ isLoading: false, error: err.message });
    }
  },

  updateVertical: (vertical, newConfig) => {
    const current = get().config;
    if (!current) return;

    set({
      config: {
        ...current,
        verticals: {
          ...current.verticals,
          [vertical]: {
            ...current.verticals[vertical],
            ...newConfig,
          },
        },
      },
    });
  },

  isVerticalAvailable: (vertical) => {
    const conf = get().config?.verticals?.[vertical];
    if (!conf) return true;
    return conf.enabled && conf.mode === 'ON';
  },

  getVerticalMessage: (vertical) => {
    const conf = get().config?.verticals?.[vertical];
    return conf?.message || null;
  },
}));
