const envPhpBaseUrl = (import.meta.env.VITE_PHP_BASE_URL as string | undefined)?.trim();

export const PHP_BASE_URL = envPhpBaseUrl && envPhpBaseUrl !== ''
  ? envPhpBaseUrl
  : 'http://localhost/group8/api';
