'use client';

import { useState } from 'react';
import { Activity, BarChart3, CalendarDays, CircleHelp, Gauge, Globe2, Search, TrendingDown, TrendingUp } from 'lucide-react';
import type { AnalyticsPageRow, ReportMetric, ReportRow, WebsiteReport } from '@/lib/content/reports';

function Trend({ trend, change }: Pick<ReportMetric, 'trend' | 'change'>) {
  if (!change || trend === 'neutral') return <span className="text-xs font-semibold text-muted">—</span>;
  const up = trend === 'up';
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">{up ? 'Tăng' : 'Giảm'} </span>
      {change}
    </span>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={`Giải thích: ${text}`}
        className="grid h-5 w-5 cursor-help place-items-center rounded-full text-muted transition hover:bg-blue/10 hover:text-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
      </button>
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-60 -translate-x-1/2 rounded-lg bg-navy px-3 py-2 text-left text-xs font-medium normal-case leading-relaxed tracking-normal text-white shadow-xl group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function BilingualText({
  text,
  englishClassName,
  vietnameseClassName,
}: {
  text: string;
  englishClassName: string;
  vietnameseClassName: string;
}) {
  const [vietnamese, english] = text.split(' / ');
  if (!english) return <span className={englishClassName}>{text}</span>;
  return (
    <span className="flex flex-col">
      <span className={englishClassName}>{english}</span>
      <span className={vietnameseClassName}>{vietnamese}</span>
    </span>
  );
}

function MetricGrid({ metrics, accent = 'blue' }: { metrics: ReportMetric[]; accent?: 'blue' | 'violet' }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-visible rounded-[18px] border border-[#e7edf7] bg-[#e7edf7] lg:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <BilingualText
              text={metric.label}
              englishClassName="text-xs font-bold uppercase tracking-[0.08em] text-navy"
              vietnameseClassName="mt-0.5 text-[10px] font-semibold normal-case tracking-normal text-muted"
            />
            {metric.description && <InfoTip text={metric.description} />}
          </div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <strong className={`font-heading text-2xl font-semibold sm:text-3xl ${accent === 'violet' ? 'text-[#6542bd]' : 'text-navy'}`}>
              {metric.value}
            </strong>
            <Trend trend={metric.trend} change={metric.change} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DataList({ title, rows, valueLabel }: { title: string; rows: ReportRow[]; valueLabel: string }) {
  const visibleRows = rows.slice(0, 5);
  const max = Math.max(...visibleRows.map((row) => Number(row.value) || 0), 1);
  return (
    <section className="overflow-hidden rounded-[20px] border border-[#e8edf5] bg-white shadow-[0_18px_45px_-32px_rgba(26,39,69,0.4)]">
      <div className="flex items-center justify-between border-b border-[#e8edf5] px-4 py-4 sm:px-5">
        <h3 className="font-heading">
          <BilingualText
            text={title}
            englishClassName="text-base font-semibold text-navy"
            vietnameseClassName="mt-0.5 text-[11px] font-medium text-muted"
          />
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{valueLabel}</span>
      </div>
      <div className="divide-y divide-[#edf1f7]">
        {visibleRows.map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{row.label}</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#eef3fb]">
                <div className="h-full rounded-full bg-blue" style={{ width: `${Math.max((Number(row.value) / max) * 100, 2)}%` }} />
              </div>
            </div>
            <div className="flex min-w-[74px] items-center justify-end gap-3 text-right">
              <span className="font-heading text-base font-bold text-navy">{row.value}</span>
              <Trend trend={row.trend} change={row.change} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QueryTable({ rows }: { rows: ReportRow[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#e8edf5] bg-white shadow-[0_18px_45px_-32px_rgba(26,39,69,0.4)]">
      <div
        className="max-h-[218px] overflow-auto overscroll-contain outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue/20"
        role="region"
        aria-label={`Bảng ${rows.length} từ khóa tìm kiếm, cuộn để xem đầy đủ`}
        tabIndex={0}
      >
        <table className="w-full min-w-[360px] table-fixed border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-navy text-white shadow-sm">
            <tr>
              <th className="w-[52%] px-4 py-3 font-heading"><span className="block text-[11px] uppercase tracking-wider">Queries</span><span className="mt-0.5 block text-[9px] font-medium normal-case text-white/65">Từ khóa</span></th>
              <th className="w-[22%] px-2 py-3 text-right font-heading"><span className="block text-[10px] uppercase tracking-wider">Clicks</span><span className="mt-0.5 block text-[9px] font-medium normal-case text-white/65">Lượt nhấp</span></th>
              <th className="w-[26%] px-3 py-3 text-right font-heading"><span className="block text-[10px] uppercase tracking-wider">Impr.</span><span className="mt-0.5 block text-[9px] font-medium normal-case text-white/65">Hiển thị</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8edf5]">
            {rows.map((row) => (
              <tr key={row.label} className="transition-colors hover:bg-[#f6f9ff]">
                <td className="truncate px-4 py-3 text-sm font-semibold text-ink" title={row.label}>{row.label}</td>
                <td className="px-2 py-3 text-right text-sm font-bold text-blue">{row.value}</td>
                <td className="px-3 py-3 text-right text-sm font-bold text-[#6542bd]">{row.secondary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && (
        <p className="border-t border-[#e8edf5] px-4 py-2 text-[10px] font-medium text-muted">
          Scroll to view all {rows.length} queries · Cuộn để xem đủ {rows.length} từ khóa
        </p>
      )}
    </section>
  );
}

function SearchBreakdown({
  title,
  titleVi,
  rows,
  limit,
}: {
  title: string;
  titleVi: string;
  rows: ReportRow[];
  limit?: number;
}) {
  const visibleRows = limit ? rows.slice(0, limit) : rows;
  const scrollable = !limit && rows.length > 4;
  return (
    <section className="overflow-hidden rounded-[20px] border border-[#e8edf5] bg-white shadow-[0_18px_45px_-32px_rgba(26,39,69,0.35)]">
      <div className="flex items-end justify-between border-b border-[#e8edf5] px-4 py-3">
        <div>
          <h3 className="font-heading text-sm font-bold text-navy">{title}</h3>
          <p className="mt-0.5 text-[10px] font-medium text-muted">{titleVi}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-right text-[9px] font-bold uppercase tracking-wider text-muted">
          <span>Clicks</span>
          <span>Impressions</span>
        </div>
      </div>
      <div
        className={`divide-y divide-[#edf1f7] outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue/20 ${scrollable ? 'max-h-[174px] overflow-y-auto overscroll-contain' : ''}`}
        role={scrollable ? 'region' : undefined}
        aria-label={scrollable ? `${title}: ${rows.length} mục, cuộn để xem đầy đủ` : undefined}
        tabIndex={scrollable ? 0 : undefined}
      >
        {visibleRows.map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_54px_72px] items-center gap-2 px-4 py-2.5 text-sm">
            <span className="truncate font-semibold text-ink" title={row.label}>{row.label}</span>
            <span className="text-right font-bold text-blue">{row.value}</span>
            <span className="text-right font-bold text-[#6542bd]">{row.secondary}</span>
          </div>
        ))}
      </div>
      {scrollable && (
        <p className="border-t border-[#edf1f7] px-4 py-2 text-[10px] font-medium text-muted">
          Scroll to view all {rows.length} items · Cuộn để xem đủ {rows.length} mục
        </p>
      )}
    </section>
  );
}

function PagesAndScreensTable({ rows }: { rows: AnalyticsPageRow[] }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#e8edf5] bg-white shadow-[0_18px_45px_-32px_rgba(26,39,69,0.4)]">
      <div
        className="max-h-[330px] overflow-auto overscroll-contain outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue/20"
        role="region"
        aria-label={`Bảng hiệu quả ${rows.length} trang, cuộn để xem đầy đủ`}
        tabIndex={0}
      >
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-navy text-white shadow-sm">
            <tr className="text-[10px] uppercase tracking-wider">
              <th className="px-4 py-3">Page path<span className="mt-0.5 block normal-case tracking-normal text-white/60">Đường dẫn trang</span></th>
              <th className="px-4 py-3 text-right">Views<span className="mt-0.5 block normal-case tracking-normal text-white/60">Lượt xem</span></th>
              <th className="px-4 py-3 text-right">Active users<span className="mt-0.5 block normal-case tracking-normal text-white/60">Người dùng</span></th>
              <th className="px-4 py-3 text-right">Views/user<span className="mt-0.5 block normal-case tracking-normal text-white/60">Lượt xem/người</span></th>
              <th className="px-4 py-3 text-right">Engagement<span className="mt-0.5 block normal-case tracking-normal text-white/60">Tương tác TB</span></th>
              <th className="px-4 py-3 text-right">Events<span className="mt-0.5 block normal-case tracking-normal text-white/60">Sự kiện</span></th>
              <th className="px-4 py-3 text-right">Key events<span className="mt-0.5 block normal-case tracking-normal text-white/60">Sự kiện chính</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8edf5]">
            {rows.map((row) => (
              <tr key={row.path} className="transition-colors hover:bg-[#f6f9ff]">
                <td className="max-w-[320px] truncate px-4 py-3 text-sm font-semibold text-ink" title={row.path}>{row.path}</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-blue">{row.views}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-navy">{row.activeUsers}</td>
                <td className="px-4 py-3 text-right text-sm text-ink">{row.viewsPerUser}</td>
                <td className="px-4 py-3 text-right text-sm text-ink">{row.engagementTime}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-navy">{row.eventCount}</td>
                <td className="px-4 py-3 text-right text-sm text-muted">{row.keyEvents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[#e8edf5] px-4 py-2 text-[10px] font-medium text-muted">
        Scroll to view all {rows.length} pages · Cuộn để xem đủ {rows.length} trang
      </p>
    </div>
  );
}

export default function ReportDashboard({ reports }: { reports: WebsiteReport[] }) {
  const [reportId, setReportId] = useState(reports[0]?.id ?? '');
  const report = reports.find((item) => item.id === reportId) ?? reports[0];
  if (!report) return null;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 text-xs text-muted">
        <Globe2 className="h-4 w-4 text-blue" aria-hidden="true" />
        <span>Nguồn: Google Analytics, Google Search Console và Google Lighthouse.</span>
      </div>
      <div className="flex flex-col gap-4 border-b border-[#dce4f0] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-heading text-sm font-bold uppercase tracking-[0.28em] text-blue">Website Ethan Ecom</p>
          <h1 className="mt-3 font-heading">
            <span className="block text-[clamp(2.5rem,6vw,5rem)] font-light uppercase leading-none tracking-wide text-navy">Report</span>
            <span className="mt-2 block text-sm font-semibold uppercase tracking-[0.22em] text-muted sm:text-base">Báo cáo</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted md:whitespace-nowrap">Theo dõi hiệu quả truy cập, tìm kiếm và chất lượng kỹ thuật của website theo từng lần cập nhật.</p>
        </div>
        <label className="flex min-w-[230px] flex-col gap-2 font-heading text-xs font-bold uppercase tracking-wider text-muted">
          Chọn ngày báo cáo
          <span className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue" aria-hidden="true" />
            <select value={reportId} onChange={(event) => setReportId(event.target.value)} className="w-full cursor-pointer appearance-none rounded-[16px] border border-[#dbe4f2] bg-white py-3.5 pl-12 pr-4 text-base font-bold text-navy outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10">
              {reports.map((item) => <option key={item.id} value={item.id}>{item.date}</option>)}
            </select>
          </span>
        </label>
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-[18px] border border-blue/15 bg-[#edf5ff] px-5 py-4 text-sm font-semibold text-navy">
        <CalendarDays className="h-5 w-5 shrink-0 text-blue" aria-hidden="true" />
        {report.periodLabel}
      </div>

      <div className="mt-10 space-y-14">
        <section aria-labelledby="quality-title">
          <div className="mb-4 flex items-center gap-3"><span className="rounded-full bg-[#e8f8ee] p-2.5 text-emerald-600"><Gauge className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Google Lighthouse · Desktop</p><div className="flex items-start gap-2"><h2 id="quality-title" className="font-heading"><span className="block text-xl font-semibold text-navy sm:text-2xl">Website quality</span><span className="mt-0.5 block text-xs font-medium text-muted">Chất lượng website</span></h2><InfoTip text="Tổng hợp các chỉ số chất lượng kỹ thuật đo bằng Google Lighthouse trên máy tính." /></div></div></div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {report.lighthouse.scores.map((score) => (
              <div key={score.label} className="flex items-center gap-4 rounded-[20px] border border-emerald-100 bg-white p-4 shadow-[0_18px_45px_-32px_rgba(16,185,129,0.5)] sm:justify-center">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[5px] border-emerald-400 bg-emerald-50 font-heading text-xl font-semibold text-emerald-700">{score.value}</div>
                <div className="flex items-start gap-1.5"><BilingualText text={score.label} englishClassName="text-sm font-bold text-navy" vietnameseClassName="mt-0.5 text-[10px] font-medium text-muted" />{score.description && <InfoTip text={score.description} />}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-px overflow-visible rounded-[20px] border border-[#e6ecf4] bg-[#e6ecf4] sm:grid-cols-2 lg:grid-cols-5">
            {report.lighthouse.metrics.map((metric) => (
              <div key={metric.label} className="bg-white p-4"><div className="flex items-center justify-between gap-2"><Activity className="h-4 w-4 text-emerald-500" aria-hidden="true" />{metric.description && <InfoTip text={metric.description} />}</div><div className="mt-2"><BilingualText text={metric.label} englishClassName="text-xs font-bold text-navy" vietnameseClassName="mt-0.5 text-[10px] font-medium text-muted" /></div><p className="mt-1 font-heading text-xl font-bold text-navy">{metric.value}</p></div>
            ))}
          </div>
        </section>

        <section aria-labelledby="search-title">
          <div className="mb-4 flex items-center gap-3"><span className="rounded-full bg-[#e7f0ff] p-2.5 text-blue"><Search className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue">Google Search Console</p><div className="flex items-start gap-2"><h2 id="search-title" className="font-heading"><span className="block text-xl font-semibold text-navy sm:text-2xl">Search performance</span><span className="mt-0.5 block text-xs font-medium text-muted">Hiệu suất tìm kiếm</span></h2><InfoTip text="Dữ liệu về cách người dùng tìm thấy website trên Google Search." /></div></div></div>
          <MetricGrid metrics={report.searchConsole.metrics} accent="violet" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {report.searchConsole.insights.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-[18px] border border-[#e5eafa] bg-gradient-to-r from-white to-[#f4f1ff] p-4">
                <div><BilingualText text={metric.label} englishClassName="text-xs font-bold text-navy" vietnameseClassName="mt-0.5 text-[10px] font-medium text-muted" /><p className="mt-1 font-heading text-2xl font-semibold text-navy">{metric.value}</p></div>
                <Trend trend={metric.trend} change={metric.change} />
              </div>
            ))}
          </div>
          <div className="mt-3 grid min-w-0 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-[1.55fr_1fr_1fr_0.75fr]">
            <QueryTable rows={report.searchConsole.queries} />
            <SearchBreakdown title="Top pages" titleVi="Trang tìm kiếm nổi bật" rows={report.searchConsole.pages} />
            <SearchBreakdown title="Countries" titleVi="Quốc gia" rows={report.searchConsole.countries} />
            <SearchBreakdown title="Devices" titleVi="Thiết bị" rows={report.searchConsole.devices} limit={3} />
          </div>
          <div className="mt-3 overflow-hidden rounded-[20px] bg-navy text-white">
            <div className="border-b border-white/10 px-4 py-3">
              <h3 className="font-heading text-sm font-bold">Key insights</h3>
              <p className="mt-0.5 text-[10px] font-medium text-white/55">Điểm nổi bật từ dữ liệu Search Console</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-white/10 lg:grid-cols-4 lg:divide-y-0">
              {report.searchConsole.highlights.map((metric) => (
                <div key={metric.label} className="p-4">
                  <p className="font-heading text-2xl font-semibold text-cyan">{metric.value}</p>
                  <div className="mt-1.5">
                    <BilingualText text={metric.label} englishClassName="text-xs font-bold text-white" vietnameseClassName="mt-0.5 text-[10px] font-medium text-white/55" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="analytics-title">
          <div className="mb-4 flex items-center gap-3"><span className="rounded-full bg-[#fff2d8] p-2.5 text-[#b5720a]"><BarChart3 className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b5720a]">Google Analytics</p><div className="flex items-start gap-2"><h2 id="analytics-title" className="font-heading"><span className="block text-xl font-semibold text-navy sm:text-2xl">Traffic overview</span><span className="mt-0.5 block text-xs font-medium text-muted">Tổng quan truy cập</span></h2><InfoTip text="Tổng hợp người dùng, lượt tương tác, trang xem và nguồn truy cập website." /></div></div></div>
          <MetricGrid metrics={report.analytics.metrics} />
          <div className="mt-3 rounded-[20px] border border-[#e8edf5] bg-[#f7f9fd] p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-heading text-base font-bold text-navy">Pages and screens</h3>
                <p className="mt-0.5 text-[11px] font-medium text-muted">Trang và màn hình</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-muted shadow-sm">{report.analytics.pagesAndScreens.period}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
              {report.analytics.pagesAndScreens.metrics.map((metric) => (
                <div key={metric.label} className="rounded-[14px] bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-1">
                    <BilingualText text={metric.label} englishClassName="text-[10px] font-bold uppercase tracking-wide text-navy" vietnameseClassName="mt-0.5 text-[9px] font-medium text-muted" />
                    {metric.description && <InfoTip text={metric.description} />}
                  </div>
                  <p className="mt-2 font-heading text-xl font-bold text-navy">{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3"><PagesAndScreensTable rows={report.analytics.pagesAndScreens.rows} /></div>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            <DataList title="Người dùng theo quốc gia / Countries" rows={report.analytics.countries} valueLabel="Users" />
            <DataList title="Trang được xem nhiều / Top pages" rows={report.analytics.pages} valueLabel="Views" />
            <DataList title="Kênh truy cập / Channels" rows={report.analytics.channels} valueLabel="Sessions" />
          </div>
        </section>
      </div>
    </div>
  );
}
