// API Base URL - .env.local dan o'qiydi
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/users/login/',
  LOGOUT: '/users/logout/',
  
  // User
  USER_ME: '/users/me/',
  USER_PROFILE: '/users/me/',
  USERS_LIST: '/users/users/',
  ADD_USER: '/users/add/',
  CHANGE_PASSWORD: (userId: string) => `/users/users/${userId}/change-password/`,

  
  // Statistics
  STATISTICS: '/users/statistics/',
  
  // Check User
  CHECK_USER: '/users/check-users/',
  
  // Messages
  MESSAGES: '/message/',
  GET_ADMINS: '/users/admins/',
  GET_CONVERSATIONS: '/message/conversations/',
  MARK_AS_READ: '/message/mark-read/',
  UNREAD_COUNT: '/message/unread-count/',
  
  // SMS
  SEND_SMS: '/messages/',
  
  // Groups
  GROUPS: '/groups/',
  GROUP_DETAIL: (groupId: string) => `/groups/${groupId}/`,
  GROUP_STUDENTS: (groupId: string) => `/groups/${groupId}/students/`,
  
  // Attendance
  ATTENDANCE: '/attendance/',
  ATTENDANCE_BY_GROUP: (groupId: string) => `/attendance/group/${groupId}/`,
  MY_ATTENDANCE: '/attendance/my/',
};
