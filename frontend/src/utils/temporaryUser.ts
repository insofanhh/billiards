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

