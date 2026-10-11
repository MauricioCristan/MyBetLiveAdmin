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
  
  export type RoleOptionDTO = {
    id: string;    // UUID
    label: string; // name
  };
  
  export type UserListRow = {
    id: string; // UUID
    username: string;
    email: string | null;
    enabled: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  };
  
  export type UserFormView = {
    id?: string;
    username: string;
    email: string | null;
    enabled: boolean;
    roleId: string | null; // ✅ CLAVE: el backend lo regresa en edit
  };
  
export type UserUpsertPayload = {
    username: string;
    email: string | null;
    enabled: boolean;
    roleId: string | null; // ✅ mandas UUID del role
  };

export const USER_CONSTRAINTS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 60,
  EMAIL_MAX: 120,
} as const;
  
