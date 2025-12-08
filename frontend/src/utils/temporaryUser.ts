export const getTemporaryUserName = () => {
  if (typeof window === 'undefined') return '';
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.name) return parsed.name as string;
    }
  } catch {
    return localStorage.getItem('guest_name') || '';
  }
  return localStorage.getItem('guest_name') || '';
};

export const isGuestUser = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      const email = parsed?.email || '';
      const isTemporary = parsed?.is_temporary === true;
      return isTemporary || /^guest_\d+_[a-z0-9]+@temp\.billiards\.local$/i.test(email);
    }
  } catch {
    return false;
  }
  return false;
};

export const getUserEmail = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      return parsed?.email || null;
    }
  } catch {
    return null;
  }
  return null;
};

