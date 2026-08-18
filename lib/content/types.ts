import type { Department, Tier } from '../roles';

/** Ai được xem nội dung này — dùng chung bởi mọi loại nội dung trong dashboard. */
export interface Visibility {
  departments: Department[] | 'all';
  minTier?: Tier;
}

export type Severity = 'info' | 'warning' | 'critical';
