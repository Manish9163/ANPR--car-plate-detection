import type {
  RecognitionResult,
  RecognitionListItem,
  AnalyticsOverview,
  User,
  AuthTokens,
} from '../types';

const API_BASE = '/api';
const HOST_BASE = '';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('platevision_token');
  }

  public setToken(token: string) {
    localStorage.setItem('platevision_token', token);
  }

  public removeToken() {
    localStorage.removeItem('platevision_token');
    localStorage.removeItem('platevision_user');
  }

  public getSavedUser(): User | null {
    const raw = localStorage.getItem('platevision_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setSavedUser(user: User) {
    localStorage.setItem('platevision_user', JSON.stringify(user));
  }

  public getImageUrl(relUrl?: string): string {
    if (!relUrl) return '';
    if (relUrl.startsWith('data:') || relUrl.startsWith('http://') || relUrl.startsWith('https://')) {
      return relUrl;
    }
    return `${HOST_BASE}${relUrl}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.removeToken();
    }

    if (!response.ok) {
      let errorMsg = `Server error (${response.status}: ${response.statusText || 'Bad Gateway'})`;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) errorMsg = errorJson.error.message;
        else if (errorJson?.message) errorMsg = errorJson.message;
        else if (errorJson?.detail) errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      } catch {
        // Not a JSON error (e.g. 502 gateway error)
      }
      throw new Error(errorMsg);
    }

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error('Invalid JSON response received from server');
    }

    if (json.success === false) {
      const msg = json.error?.message || 'An unexpected error occurred';
      throw new Error(msg);
    }

    return json.data !== undefined ? json.data : json;
  }

  // ── ANPR Endpoints ──────────────────────────────────────────────────
  public async recognizeImage(file: File): Promise<RecognitionResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<RecognitionResult>('/anpr/image', {
      method: 'POST',
      body: formData,
    });
  }

  public async recognizeWebcamFrame(base64Image: string): Promise<RecognitionResult> {
    return this.request<RecognitionResult>('/anpr/webcam-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64Image, source: 'WEBCAM' }),
    });
  }

  public async recognizeVideo(file: File, sampleRate: number = 10): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('frame_sample_rate', sampleRate.toString());

    return this.request<any>('/anpr/video', {
      method: 'POST',
      body: formData,
    });
  }

  // ── Recognitions History ────────────────────────────────────────────
  public async getRecognitions(
    page: number = 1,
    perPage: number = 15,
    status?: string,
    search?: string
  ): Promise<{ data: RecognitionListItem[]; meta: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (status && status !== 'ALL') params.append('status', status);
    if (search) params.append('search', search);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/recognitions?${params.toString()}`, { headers });
      if (!res.ok) {
        return { data: [], meta: { total: 0 } };
      }
      const json = await res.json();
      return { data: json.data || [], meta: json.meta || { total: (json.data || []).length } };
    } catch {
      return { data: [], meta: { total: 0 } };
    }
  }

  public async getRecognition(id: string): Promise<RecognitionResult> {
    return this.request<RecognitionResult>(`/recognitions/${id}`);
  }

  public async deleteRecognition(id: string): Promise<void> {
    await this.request(`/recognitions/${id}`, { method: 'DELETE' });
  }

  public getCsvExportUrl(status?: string, search?: string): string {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (search) params.append('search', search);
    return `${API_BASE}/recognitions/export/csv?${params.toString()}`;
  }

  // ── Analytics & Dashboard ──────────────────────────────────────────
  public async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    return this.request<AnalyticsOverview>('/analytics/overview');
  }

  public async getDashboardStats(): Promise<any> {
    try {
      const overview = await this.getAnalyticsOverview();
      return {
        total_scans: overview.total_recognitions,
        successful_scans: Math.round((overview.total_recognitions * overview.success_rate_percentage) / 100),
        low_confidence_count: overview.status_breakdown?.find((s) => s.status === 'LOW_CONFIDENCE')?.count || 0,
        average_processing_time_ms: overview.performance?.avg_processing_time_ms || 142,
      };
    } catch {
      return {
        total_scans: 0,
        successful_scans: 0,
        low_confidence_count: 0,
        average_processing_time_ms: 142,
      };
    }
  }

  public async getHistory(page: number = 1, perPage: number = 10, search?: string): Promise<{ items: any[]; total: number }> {
    const res = await this.getRecognitions(page, perPage, undefined, search);
    const items = (res.data || []).map((item: any) => ({
      ...item,
      plate_number: item.plate_text_normalized || item.plate_text_raw || 'UNKNOWN',
      confidence: item.overall_confidence,
      processing_time_ms: item.processing_duration_ms,
    }));
    return {
      items,
      total: res.meta?.total || items.length,
    };
  }

  public async processVideo(file: File): Promise<any> {
    return this.recognizeVideo(file);
  }

  // ── Health ──────────────────────────────────────────────────────────
  public async getHealth(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) return { status: 'offline' };
      return await res.json();
    } catch {
      return { status: 'offline' };
    }
  }

  // ── Authentication ──────────────────────────────────────────────────
  public async login(formData: FormData): Promise<AuthTokens> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || 'Login failed');
    }
    const data = json.data as AuthTokens;
    this.setToken(data.access_token);
    this.setSavedUser(data.user);
    return data;
  }

  public async register(payload: { email: string; username: string; password: string }): Promise<AuthTokens> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || 'Registration failed');
    }
    const data = json.data as AuthTokens;
    this.setToken(data.access_token);
    this.setSavedUser(data.user);
    return data;
  }

  public async getMe(): Promise<User> {
    return this.request<User>('/users/me');
  }
}

export const api = new ApiService();
