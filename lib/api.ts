const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export function apiUrl(path: string) {
  if (!baseUrl) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
