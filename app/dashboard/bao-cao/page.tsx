import { redirect } from 'next/navigation';

/** Báo cáo website đã dời vào trong "Quản trị" — giữ route cũ chỉ để redirect,
 *  tránh gãy bookmark/link cũ trỏ tới /dashboard/bao-cao. */
export default function BaoCaoRedirectPage() {
  redirect('/dashboard/admin/bao-cao');
}
