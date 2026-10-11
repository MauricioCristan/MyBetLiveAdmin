export type BackendlessPage<T> = {
    success: boolean;
    message: string;
    page: number;
    limit: number;
    total: number;
    data: T[];
  };
  
  export type BackendlessStd<T> = {
    code: number;
    data: T[];
    message: string;
    success: boolean;
  };
  
  export type RoleListRow = {
    id: string; // UUID
    code: string;
    name: string;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  
  export type RoleFormView = {
    id?: string;
    code: string;
    name: string;
  };
  
  export type RoleUpsertPayload = {
    code: string;
    name: string;
  };
  
  export type RoleFormDTO = {
    id?: string | null;
    code: string;
    name: string;
    permissionIds: string[];
  };

export type OptionDTO<T = string> = {
    id: T;
    label: string;
  };

export const ROLE_CONSTRAINTS = {
  CODE_MAX: 60,
  NAME_MAX: 120,
} as const;
  
