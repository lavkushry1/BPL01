
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Admin {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}
