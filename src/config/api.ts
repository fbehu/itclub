// API Base URL - .env.local dan o'qiydi
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login/',
  LOGOUT: '/auth/logout/',
  
  // User
  USER_ME: '/profile/me/',
  USER_PROFILE: '/profile/me/',
  USERS_LIST: '/users/',
  ADD_USER: '/users/add/',
  CHANGE_PASSWORD: (userId: string) => `/users/users/${userId}/change-password/`,

  
  // Statistics
  STATISTICS: '/profile/statistics/',
  
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
  GROUP_AVAILABLE_STUDENTS: (groupId: string) => `/groups/${groupId}/available-students/`,
  
  // Rooms
  ROOMS: '/rooms/',
  ROOM_DETAIL: (roomId: string) => `/rooms/${roomId}/`,
  
  // CSV Import/Export
  USERS_EXPORT: '/users/export/',
  USERS_EXPORT_TEMPLATE: '/users/export/template/',
  USERS_IMPORT: '/users/import/',
  
  // Attendance
  ATTENDANCE: '/attendance/',
  ATTENDANCE_BY_GROUP: (groupId: string | number, date: string) => `/attendance/group/${groupId}/${date}/`,
  MY_ATTENDANCE: '/attendance/my/',
  
  // News/System Updates
  NEWS: '/news/',
  
  // Certificates
  CERTIFICATES: '/certificates/',

  // Referrals
  MY_REFERRAL: '/referrals/my-referral/',
  MY_BALANCE: '/referrals/balance/',
  MY_DASHBOARD: '/referrals/my-dashboard/',
  MY_REWARDS: '/referrals/my-rewards/',
  CHOOSE_REWARD: '/referrals/choose-reward/',
  REQUEST_WITHDRAWAL: '/referrals/request-withdrawal/',
  MY_WITHDRAWALS: '/referrals/my-withdrawals/',
  MY_VOUCHERS: '/referrals/my-vouchers/',
  ACTIVATE_VOUCHER: '/referrals/activate-voucher/',
  TRANSACTIONS: '/referrals/transactions/',
  CLAIM_REWARD: '/referrals/claim-reward/',
  LEADERBOARD: '/referrals/leaderboard/',

  REFERRAL_VALIDATE: '/referrals/validate-code/',

  // Admin Referral Management
  ADMIN_REQUEST_WITHDRAWAL: '/referrals/admin/request-withdrawal/',
  ADMIN_REFERRAL_SETTINGS: '/referrals/admin/settings/',
  ADMIN_STUDENT_SEARCH: '/referrals/admin/search-student/',
  ADMIN_STUDENT_REWARDS: (studentId: string) => `/referrals/admin/student/${studentId}/rewards/`,
  ADMIN_STUDENT_BALANCE: (studentId: string) => `/referrals/admin/student/${studentId}/balance/`,
  ADMIN_STUDENT_VOUCHERS: (studentId: string) => `/referrals/admin/student/${studentId}/vouchers/`,
  ADMIN_WITHDRAWALS: (studentId: string) => `/referrals/admin/student/${studentId}/withdrawals/`,
  ADMIN_APPROVE_WITHDRAWAL: (withdrawalId: number) => `/referrals/admin/withdrawals/${withdrawalId}/approve/`,
  ADMIN_ACTIVATE_VOUCHER: (studentId: string) => `/referrals/admin/vouchers/${studentId}/activate/`,
  ADMIN_LEDGER: '/referrals/admin/ledger/',
  ADMIN_LEADERBOARD: '/referrals/admin/leaderboard/',

  // Payments
  PAYMENTS: '/payments/',
  PAYMENTS_RECEIPT: (enrollmentId: number) => `/payments/receipt/${enrollmentId}/`,
  PAYMENTS_AVAILABLE_MONTHS: '/payments/available-months/',
  PAYMENTS_MONTHLY_STATISTICS: (year: number, month: number) => `/payments/statistics/monthly/?year=${year}&month=${month}`,
};
