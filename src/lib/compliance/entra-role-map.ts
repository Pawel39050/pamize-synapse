import type {ComplianceRole} from "./assessment-authorization.ts";
const ROLE_MAP:Readonly<Record<string,ComplianceRole>>={
 "Compliance.Author":"author","Compliance.Reviewer":"reviewer","Compliance.Viewer":"viewer"
};
/** Only exact Entra app-role values are accepted, never informal role names. */
export function resolveEntraComplianceRoles(values:unknown):ComplianceRole[]{
 if(!Array.isArray(values))return [];
 return [...new Set(values.filter((v):v is string=>typeof v==="string").map(v=>ROLE_MAP[v]).filter((v):v is ComplianceRole=>!!v))];
}
