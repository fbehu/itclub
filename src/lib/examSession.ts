import { API_BASE_URL } from '@/config/api';

const DEVICE_ID_STORAGE_KEY = 'exam_device_id';
const EXAM_SESSION_KEY_PREFIX = 'exam_session_key_';

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `dev-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function getOrCreateExamDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId = generateId();
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextId);
  return nextId;
}

export function getExamSessionKey(studentExamId: string | number | null | undefined) {
  if (studentExamId === null || studentExamId === undefined) {
    return null;
  }

  return localStorage.getItem(`${EXAM_SESSION_KEY_PREFIX}${studentExamId}`);
}

export function setExamSessionKey(studentExamId: string | number, sessionKey: string) {
  localStorage.setItem(`${EXAM_SESSION_KEY_PREFIX}${studentExamId}`, sessionKey);
}

export function removeExamSessionKey(studentExamId: string | number | null | undefined) {
  if (studentExamId === null || studentExamId === undefined) {
    return;
  }

  localStorage.removeItem(`${EXAM_SESSION_KEY_PREFIX}${studentExamId}`);
}

function resolveApiUrl() {
  try {
    return new URL(API_BASE_URL);
  } catch {
    return new URL(API_BASE_URL, window.location.origin);
  }
}

export function buildExamSessionWebSocketUrl(
  studentExamId: string | number,
  accessToken: string,
  sessionKey: string
) {
  const apiUrl = resolveApiUrl();
  const protocol = apiUrl.protocol === 'https:' ? 'wss' : 'ws';
  const params = new URLSearchParams({
    token: accessToken,
    session_key: sessionKey,
  });

  return `${protocol}://${apiUrl.host}/ws/exams/session/${studentExamId}/?${params.toString()}`;
}
