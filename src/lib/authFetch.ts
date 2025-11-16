import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function authFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Agar body FormData bo'lsa, Content-Type qo'ymaymiz
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData && { 'Content-Type': 'application/json' }), // FormData bo'lsa JSON header qo'yilmaydi
    ...options.headers,
  };

  // Access token qo'shish
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      handleLogout();
      throw new Error('Session expired. Please login again.');
    }

    if (response.status === 500) {
      console.error('Server error. Please try again later.');
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

function handleLogout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('currentUser');
  window.location.href = '/login';
}

export async function logoutUser(): Promise<void> {
  try {
    await authFetch(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    handleLogout();
  }
}
