import { User, VoiceChannel, ChatMessage } from '../types/index.js';

export function getBackendUrl(): string {
  // Limpa automaticamente túneis temporários antigos
  const custom = localStorage.getItem('nexus_custom_backend_url');
  if (custom && (custom.includes('loca.lt') || custom.includes('lhr.life') || custom.includes('ngrok'))) {
    localStorage.removeItem('nexus_custom_backend_url');
  }

  const cleaned = localStorage.getItem('nexus_custom_backend_url');
  if (cleaned && cleaned.trim()) {
    return cleaned.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
  }
  return '';
}

export function setCustomBackendUrl(url: string): void {
  if (url && url.trim()) {
    localStorage.setItem('nexus_custom_backend_url', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('nexus_custom_backend_url');
  }
}

class ApiService {
  private getBaseUrl(): string {
    const backend = getBackendUrl();
    return backend ? `${backend}/api` : '/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const token = localStorage.getItem('auth_token_ref');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        cache: 'no-store',
      });
    } catch (err: any) {
      throw new Error(`Falha de conexão com o servidor. Verifique a URL do backend.`);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || (data.details ? `${data.error}: ${data.details}` : 'Erro na requisição');
      throw new Error(errorMsg);
    }

    return data as T;
  }

  async checkHealth(targetUrl?: string): Promise<boolean> {
    const baseUrl = targetUrl ? `${targetUrl.replace(/\/+$/, '')}/api/health` : '/api/health';
    try {
      const res = await fetch(baseUrl);
      const data = await res.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }

  async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      localStorage.setItem('auth_token_ref', res.token);
    }
    return res;
  }

  async register(data: { username: string; email: string; password: string; confirmPassword: string }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      localStorage.setItem('auth_token_ref', res.token);
    }
    return res;
  }

  async updateProfile(data: { username?: string; avatar?: string; bio?: string }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (res.token) {
      localStorage.setItem('auth_token_ref', res.token);
    }
    return res;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      localStorage.removeItem('auth_token_ref');
    }
  }

  async getUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/users');
  }

  async getChannels(): Promise<{ channels: VoiceChannel[] }> {
    return this.request<{ channels: VoiceChannel[] }>('/channels');
  }

  async createChannel(channel: { name: string; description?: string; type?: 'VOICE' | 'TEXT' }): Promise<{ channel: VoiceChannel }> {
    return this.request<{ channel: VoiceChannel }>('/channels', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  }

  async updateChannel(id: string, channel: { name?: string; description?: string; position?: number }): Promise<{ channel: VoiceChannel }> {
    return this.request<{ channel: VoiceChannel }>(`/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(channel),
    });
  }

  async deleteChannel(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/channels/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderChannels(orderedIds: string[]): Promise<{ channels: VoiceChannel[] }> {
    return this.request<{ channels: VoiceChannel[] }>('/channels/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
  }

  async sendMessage(channelId: string, data: { content: string; mediaUrl?: string; mediaType?: string }): Promise<{ message: ChatMessage }> {
    return this.request<{ message: ChatMessage }>(`/messages/${channelId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessages(channelId: string): Promise<{ messages: ChatMessage[] }> {
    return this.request<{ messages: ChatMessage[] }>(`/messages/${channelId}`);
  }
}

export const api = new ApiService();
