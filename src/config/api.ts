// API Base URL - .env.local dan o'qiydi
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/users/login/',
  LOGOUT: '/users/logout/',
  
  // User
  USER_ME: '/users/me/',
  USER_PROFILE: '/users/profile/',
  CHANGE_PASSWORD: '/users/change_password/',
  USERS_LIST: '/users/users/',
  ADD_USER: '/users/add/',

  
  // Statistics
  STATISTICS: '/users/statistics/',
  
  // Check User
  CHECK_USER: '/users/check-users/',
  
  // Messages
  MESSAGES: '/message/',
  GET_ADMINS: '/users/admins/',
  GET_CONVERSATIONS: '/message/conversations/',
};
