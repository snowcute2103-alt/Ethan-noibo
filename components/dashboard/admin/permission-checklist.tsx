'use client';

import { useMemo, useState, useTransition } from 'react';
import { AlertCircle, ListChecks, Search, SearchX, ShieldCheck } from 'lucide-react';
import type { UserRow } from '@/lib/users';
import { DEPARTMENTS, departmentLabel, tierLabel, type Tier } from '@/lib/roles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TIERS: Tier[] = ['staff', 'leader', 'full'];

interface DocOption {
  id: string;
  title: string;
}

export interface PermissionActions {
  grant: (userId: number, docId: string) => Promise<{ ok: true }>;
  revoke: (userId: number, docId: string) => Promise<{ ok: true }>;
  bulkGrant: (userIds: number[], docId: string) => Promise<{ ok: true }>;
  bulkRevoke: (userIds: number[], docId: string) => Promise<{ ok: true }>;
}

export default function PermissionChecklist({
  docs,
  users,
  grantsByDoc,
  actions,
}: {
  docs: DocOption[];
  users: UserRow[];
  grantsByDoc: Record<string, number[]>;
  actions: PermissionActions;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedDocId, setSelectedDocId] = useState(docs[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState<Set<number>>(new Set(grantsByDoc[docs[0]?.id ?? ''] ?? []));
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function selectDoc(docId: string) {
    setSelectedDocId(docId);
    setGranted(new Set(grantsByDoc[docId] ?? []));
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !term || u.fullName.toLowerCase().includes(term) || u.username.toLowerCase().includes(term);
      const matchesDept = !departmentFilter || u.department === departmentFilter;
      const matchesTier = !tierFilter || u.tier === tierFilter;
      return matchesSearch && matchesDept && matchesTier;
    });
  }, [users, search, departmentFilter, tierFilter]);

  const filteredIds = useMemo(() => filteredUsers.map((u) => u.id), [filteredUsers]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  function toggleSelectOne(userId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleBulkGrant() {
    setError(null);
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        await actions.bulkGrant(ids, selectedDocId);
        setGranted((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.add(id));
          return next;
        });
        clearSelection();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleBulkRevoke() {
    setError(null);
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        await actions.bulkRevoke(ids, selectedDocId);
        setGranted((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
        clearSelection();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function toggle(userId: number, checked: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        if (checked) {
          await actions.grant(userId, selectedDocId);
          setGranted((prev) => new Set(prev).add(userId));
        } else {
          await actions.revoke(userId, selectedDocId);
          setGranted((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  if (docs.length === 0) {
    return (
      <Empty className="border border-[var(--theme-border)] bg-surface">
        <EmptyMedia><ShieldCheck aria-hidden="true" /></EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Chưa có tài liệu rule</EmptyTitle>
          <EmptyDescription>Tạo rule trước, sau đó quay lại đây để cấp quyền đọc.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Field className="max-w-lg">
        <FieldLabel htmlFor="permission-document">Tài liệu</FieldLabel>
        <NativeSelect
          id="permission-document"
          value={selectedDocId}
          onChange={(e) => selectDoc(e.target.value)}
          containerClassName="w-full"
        >
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_minmax(12rem,0.6fr)_minmax(10rem,0.4fr)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc username…"
            aria-label="Tìm nhân sự để cấp quyền"
            className="pl-10"
          />
        </div>
        <NativeSelect
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          aria-label="Lọc nhân sự theo khối"
          containerClassName="w-full"
        >
          <option value="">Tất cả khối</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          aria-label="Lọc nhân sự theo cấp"
          containerClassName="w-full"
        >
          <option value="">Tất cả cấp</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {tierLabel(t)}
            </option>
          ))}
        </NativeSelect>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedIds.size > 0 && (
        <Alert variant="warning">
          <ListChecks aria-hidden="true" />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">{selectedIds.size} đã chọn</Badge>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleBulkGrant}
            >
              Cấp quyền đọc
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={handleBulkRevoke}
            >
              Thu hồi quyền đọc
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
              Bỏ chọn
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="max-h-[560px] overflow-auto border border-navy/15">
        <Table className="min-w-[640px]">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-0 bg-navy text-cyan hover:bg-navy">
              <TableHead className="whitespace-nowrap bg-navy px-4 py-3 text-cyan">
                <Checkbox
                  checked={allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleSelectAllFiltered}
                  aria-label="Chọn tất cả user đang lọc"
                  className="border-cyan/50 bg-navy data-[state=checked]:border-gold data-[state=checked]:bg-gold data-[state=checked]:text-navy"
                />
              </TableHead>
              {['Được đọc', 'Họ tên', 'Username', 'Khối', 'Cấp'].map((label) => (
                <TableHead key={label} className="whitespace-nowrap bg-navy px-4 py-3 font-semibold uppercase tracking-wide text-cyan">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id} className="odd:bg-white even:bg-surface-2/60">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(u.id)}
                    onCheckedChange={() => toggleSelectOne(u.id)}
                    aria-label={`Chọn ${u.fullName}`}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    disabled={isPending}
                    checked={granted.has(u.id)}
                    onCheckedChange={(checked) => toggle(u.id, checked === true)}
                    aria-label={`${granted.has(u.id) ? 'Thu hồi' : 'Cấp'} quyền đọc cho ${u.fullName}`}
                  />
                </TableCell>
                <TableCell className="font-semibold">{u.fullName}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{departmentLabel(u.department)}</TableCell>
                <TableCell><Badge variant="outline">{tierLabel(u.tier)}</Badge></TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <Empty>
                    <EmptyMedia><SearchX aria-hidden="true" /></EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>Không có nhân sự phù hợp</EmptyTitle>
                      <EmptyDescription>Thử đổi từ khoá hoặc bộ lọc khối và cấp.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
