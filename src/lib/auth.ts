import { apiRequest, tokenStorage } from './api';

type LoginResponse = {
  access: string;
  refresh: string;
};

export async function login(username: string, password: string) {
  const data = await apiRequest<LoginResponse>('/auth/login/', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ username, password }),
  });
  tokenStorage.setTokens(data.access, data.refresh);
}

export async function logout() {
  const refresh = tokenStorage.getRefresh();
  if (refresh) {
    await apiRequest('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    });
  }
  tokenStorage.clear();
}
