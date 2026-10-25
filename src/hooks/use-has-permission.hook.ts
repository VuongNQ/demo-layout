import { useCurrentUser } from './use-current-user.hook';

// OR semantics over the permission array, matching the real repo's rule
// (06-routing-permission.md: "preserve current OR semantics for permission
// arrays"). A frontend guard like this is not a security boundary.
export function useHasPermission(required?: string | string[]): boolean {
  const { permissions } = useCurrentUser();
  if (!required) return true;
  const requiredList = Array.isArray(required) ? required : [required];
  if (requiredList.length === 0) return true;
  return requiredList.some((permission) => permissions.includes(permission));
}
