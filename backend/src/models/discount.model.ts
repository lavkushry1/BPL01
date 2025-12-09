
export interface Discount {
  id: string;
  code: string;
  amount: number;
  description?: string;
  max_uses: number;
  uses_count: number;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  auto_apply?: boolean;
  event_id?: string;
  priority?: number;
}
