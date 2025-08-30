export function getUser(context: any) {
  return context?.clientContext?.user || null;
}

export function requireUser(context: any) {
  const u = getUser(context);
  if (!u) {
    const e: any = new Error('unauthorized');
    (e.statusCode as any) = 401;
    throw e;
  }
  return u;
}

export function isAdmin(user: any): boolean {
  const roles: string[] = user?.app_metadata?.roles || [];
  return roles.includes('admin');
}