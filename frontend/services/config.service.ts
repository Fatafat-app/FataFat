import { api } from './api';
import { ApiResponse } from '../types';

export interface VerticalConfig {
  enabled: boolean;
  mode: 'ON' | 'DRAIN' | 'OFF';
  message?: {
    title: string;
    body: string;
  } | null;
}

export interface BootstrapConfig {
  verticals: {
    food: VerticalConfig;
    grocery: VerticalConfig;
  };
  supportPhone?: string;
  minAppVersion?: string;
  maintenance?: boolean;
}

export const configService = {
  async getBootstrapConfig(): Promise<BootstrapConfig> {
    const response = await api.get<ApiResponse<BootstrapConfig>>('/config/bootstrap');
    return response.data.data;
  },
};
