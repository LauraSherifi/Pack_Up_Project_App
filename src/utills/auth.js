const AUTH_KEYS = ['token', 'username', 'role', 'userId'];

export const clearLegacyAuth = () => {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getAuthItem = (key) => {
  clearLegacyAuth();
  return sessionStorage.getItem(key);
};

export const setAuthSession = ({ token, username, role, userId }) => {
  clearLegacyAuth();
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('username', username);
  sessionStorage.setItem('role', role);
  if (userId) {
    sessionStorage.setItem('userId', String(userId));
  }
};

export const isAuthenticated = () => {
  return Boolean(getAuthItem('token'));
};

export const logout = () => {
  clearLegacyAuth();
  AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
};
