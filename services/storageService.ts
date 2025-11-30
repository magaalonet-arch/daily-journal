const STORAGE_KEYS = {
  USERS: 'reflectai_users',
  CURRENT_USER: 'reflectai_current_user',
  ENTRIES: 'reflectai_entries',
};

export const storageService = {
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  },

  setItem: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },

  get keys() {
    return STORAGE_KEYS;
  }
};