import type { RecognitionList } from '@/lib/content';
import RecognitionMonthCard from './recognition-month-card';

export default function RecognitionWall({ lists }: { lists: RecognitionList[] }) {
  if (lists.length === 0) return null;

  return (
    <div className="flex flex-col gap-8 min-[1025px]:gap-16">
      {lists.map((list, listIndex) => (
        <RecognitionMonthCard key={list.id} list={list} listIndex={listIndex} />
      ))}
    </div>
  );
}
