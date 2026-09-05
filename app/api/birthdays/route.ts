import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listActiveBirthdaysByMonthOffset } from '@/lib/users';

/** Sinh nhật tháng trước/này/sau cho popup "Chương trình sinh nhật" ở trang chủ — offset tính
 *  theo tháng hiện tại (-1/0/1). Route riêng vì trang chủ chỉ SSR sẵn dữ liệu tháng này. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const offsetParam = req.nextUrl.searchParams.get('offset');
  const offset = Number(offsetParam);
  if (!Number.isInteger(offset) || offset < -12 || offset > 12) {
    return NextResponse.json({ error: 'offset không hợp lệ' }, { status: 400 });
  }

  const people = await listActiveBirthdaysByMonthOffset(offset);
  return NextResponse.json({ people });
}
