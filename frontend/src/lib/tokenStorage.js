// Isolated on purpose: the only file that touches localStorage, so
// swapping to React Native's AsyncStorage later is a one-file change.
const KEY = 'sss_token';

export function getToken() {
  return localStorage.getItem(KEY);
}

export function setToken(token) {
  localStorage.setItem(KEY, token);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}
