import { redirect } from 'next/navigation';

export function safeRedirect(path: string, fallback = '/') {
  // Ensure the path is a relative path or an allowed domain to prevent Open Redirect attacks
  if (path.startsWith('/') && !path.startsWith('//')) {
    redirect(path);
  } else {
    redirect(fallback);
  }
}
