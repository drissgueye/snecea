const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

/** Base URL du backend (sans /api) pour les médias (pièces jointes, etc.) */
export const MEDIA_BASE_URL =
  (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '') ||
  'http://127.0.0.1:8000';

/** Construit l'URL complète d'un fichier média (pièce jointe, photo, etc.) */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const relative = path.startsWith('/') ? path.slice(1) : path;
  return `${MEDIA_BASE_URL}/media/${relative}`;
}

const ACCESS_TOKEN_KEY = 'cnts.accessToken';
const REFRESH_TOKEN_KEY = 'cnts.refreshToken';

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export type ApiError = {
  status: number;
  data: unknown;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) {
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    tokenStorage.clear();
    return null;
  }

  const data = (await response.json()) as { access: string };
  tokenStorage.setTokens(data.access, refresh);
  return data.access;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers);

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!headers.has('Content-Type') && options.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false) {
    const access = tokenStorage.getAccess();
    if (access) {
      headers.set('Authorization', `Bearer ${access}`);
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && options.auth !== false) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers.set('Authorization', `Bearer ${newAccess}`);
      const retry = await fetch(url, { ...options, headers });
      if (retry.ok) {
        return (await retry.json()) as T;
      }
      const retryData = await retry.json().catch(() => ({}));
      throw { status: retry.status, data: retryData } as ApiError;
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw { status: response.status, data } as ApiError;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

/** Événement calendrier (réunion planifiée) renvoyé par l’API */
export interface CalendarEvent {
  id: string;
  event_type?: 'reunion' | 'activite';
  title: string;
  start: string;
  end: string;
  statut?: string;
  statut_display?: string;
  type_reunion?: string;
  type_reunion_display?: string;
  dossier_id?: number;
  dossier_numero?: string;
  lieu?: string;
  ordre_du_jour?: string;
  reunion_id?: number;
  type_activite?: string;
  type_activite_display?: string;
  requete_id?: number;
  numero_reference?: string;
  description?: string;
  activite_id?: number;
}

/**
 * Récupère les événements calendrier (réunions planifiées) pour une plage de dates.
 * Utilisé par la page /calendar pour afficher les réunions issues du traitement des requêtes.
 */
export async function getCalendarEvents(params: {
  start: string;
  end: string;
}): Promise<CalendarEvent[]> {
  const sp = new URLSearchParams({ start: params.start, end: params.end });
  return apiRequest<CalendarEvent[]>(`/reunions/calendar-events/?${sp.toString()}`);
}

/** Activité planifiée sur une requête (suivi d'activités, date affichée au calendrier) */
export interface ActiviteRequeteDto {
  id: number;
  requete_id: number;
  type_activite: string;
  type_activite_display?: string;
  titre: string;
  description: string;
  date_planifiee: string;
  statut: string;
  date_realisation: string | null;
  commentaire: string;
  /** Chemin ou URL de la pièce jointe du compte rendu (si présente) */
  piece_jointe_compte_rendu?: string | null;
  extra_data?: Record<string, unknown>;
  created_by_id?: number;
  created_at: string;
}

/** Champ optionnel lié à un type d'activité (selon le pôle) */
export interface ActivityTypeFieldDef {
  name: string;
  label: string;
  type: 'text' | 'date' | 'datetime' | 'number' | 'textarea';
  required?: boolean;
}

/** Type d'activité proposé pour un pôle */
export interface ActivityTypeChoice {
  value: string;
  label: string;
  fields: ActivityTypeFieldDef[];
}

/** Réponse GET /requetes/:id/activity-type-choices/ */
export interface RequeteActivityTypeChoicesDto {
  pole_code: string;
  pole_name: string | null;
  types: ActivityTypeChoice[];
}

export async function getRequeteActivites(requeteId: string): Promise<ActiviteRequeteDto[]> {
  return apiRequest<ActiviteRequeteDto[]>(`/requetes/${requeteId}/activites/`);
}

export async function getRequeteActivityTypeChoices(
  requeteId: string
): Promise<RequeteActivityTypeChoicesDto> {
  return apiRequest<RequeteActivityTypeChoicesDto>(
    `/requetes/${requeteId}/activity-type-choices/`
  );
}

export async function createRequeteActivite(
  requeteId: string,
  data: {
    type_activite: string;
    titre: string;
    description?: string;
    date_planifiee: string;
    extra_data?: Record<string, unknown>;
  }
): Promise<ActiviteRequeteDto> {
  return apiRequest<ActiviteRequeteDto>(`/requetes/${requeteId}/activites/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Met à jour une activité (statut, date de réalisation, commentaire, pièce jointe).
 * Utilisé pour « Marquer comme terminée » et « Annuler ».
 * Si piece_jointe_compte_rendu est un File, la requête est envoyée en multipart/form-data.
 */
export async function updateRequeteActivite(
  requeteId: string,
  activiteId: number | string,
  data: {
    statut?: string;
    date_realisation?: string | null;
    commentaire?: string;
    piece_jointe_compte_rendu?: File | null;
  }
): Promise<ActiviteRequeteDto> {
  const hasFile = data.piece_jointe_compte_rendu instanceof File;
  if (hasFile) {
    const form = new FormData();
    if (data.statut != null) form.append('statut', data.statut);
    if (data.date_realisation != null) form.append('date_realisation', data.date_realisation);
    if (data.commentaire != null) form.append('commentaire', data.commentaire);
    form.append('piece_jointe_compte_rendu', data.piece_jointe_compte_rendu!);
    return apiRequest<ActiviteRequeteDto>(
      `/requetes/${requeteId}/activites/${activiteId}/`,
      { method: 'PATCH', body: form }
    );
  }
  const { piece_jointe_compte_rendu: _, ...jsonData } = data;
  return apiRequest<ActiviteRequeteDto>(
    `/requetes/${requeteId}/activites/${activiteId}/`,
    {
      method: 'PATCH',
      body: JSON.stringify(jsonData),
    }
  );
}

/** Document syndical (API documents) */
export interface DocumentSyndicalDto {
  id: number;
  nom: string;
  description: string;
  pole: { id: number; nom: string } | null;
  pole_id: number | null;
  annee: number;
  categorie: string;
  fichier: string;
  version: number;
  uploaded_by?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Liste les documents syndicaux (avec recherche et tri optionnels).
 */
export async function getDocuments(params?: {
  search?: string;
  ordering?: string;
}): Promise<DocumentSyndicalDto[]> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.ordering) sp.set('ordering', params.ordering);
  const query = sp.toString();
  const url = `/documents/${query ? `?${query}` : ''}`;
  const data = await apiRequest<DocumentSyndicalDto[] | { results: DocumentSyndicalDto[] }>(url);
  return Array.isArray(data) ? data : (data.results ?? []);
}

/**
 * Télécharge un fichier (ex. PDF) avec authentification et déclenche le téléchargement côté client.
 */
export async function downloadFile(
  path: string,
  filename: string,
  options: { method?: string } = {}
): Promise<void> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers();
  const access = tokenStorage.getAccess();
  if (access) headers.set('Authorization', `Bearer ${access}`);
  const response = await fetch(url, { method: options.method ?? 'GET', headers });
  if (response.status === 401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers.set('Authorization', `Bearer ${newAccess}`);
      const retry = await fetch(url, { method: options.method ?? 'GET', headers });
      if (!retry.ok) throw { status: retry.status, data: await retry.json().catch(() => ({})) } as ApiError;
      const blob = await retry.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
      return;
    }
  }
  if (!response.ok) throw { status: response.status, data: await response.json().catch(() => ({})) } as ApiError;
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}
