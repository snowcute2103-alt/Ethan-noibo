import RuleLaptopScene from '@/components/dashboard/rule-laptop-scene';

export default function DevPreviewRuleLaptopPage() {
  return (
    <div className="bg-white">
      <div className="relative overflow-hidden bg-navy-deep">
        <div className="rule-hero-grid" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-[1500px] px-8 py-20 sm:py-28">
          <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-cyan">Khối vận hành</p>
          <h1 className="title-glow mt-5 font-heading text-[clamp(3rem,8vw,7rem)] font-medium tracking-wide leading-[0.95] text-white">
            SOP &amp; Quy trình
          </h1>
          <div className="gradient-divider mt-6 w-24" aria-hidden="true" />
        </div>
      </div>
      <div className="mx-auto max-w-[1500px] px-8 py-28 sm:py-36">
        <p className="text-center text-base text-muted">Nội dung SOP nằm ở đây.</p>
      </div>
      <RuleLaptopScene />
    </div>
  );
}
