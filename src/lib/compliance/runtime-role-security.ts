/** A newly created Neon role is NOT automatically a least-privileged app role.
 * Neon managed roles can inherit neon_superuser and have BYPASSRLS.
 * Runtime activation MUST require independent verification of actual privileges. */
export type RuntimeRoleSecurity={
 name:string;superuser:boolean;createDb:boolean;createRole:boolean;
 bypassRls:boolean;inheritedRoles:readonly string[];
};
export function assertLeastPrivilegeRole(role:RuntimeRoleSecurity):void{
 if(!role.name.trim()||role.superuser||role.createDb||role.createRole||
    role.bypassRls||role.inheritedRoles.some(r=>r==="neon_superuser"||r==="pg_database_owner"))
  throw Error("Unsafe privileged database runtime role");
}
