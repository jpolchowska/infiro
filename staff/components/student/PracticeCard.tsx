import { Card } from "@/components/ui/Card";
import { RichText } from "@/components/ui/RichText";
import { pluralize, WORDS } from "@/lib/pluralize";
import type { PracticeItem } from "@/lib/types";

export function PracticeCard({ items }: { items: PracticeItem[] }) {
  return (
    <Card title="Do powtórki" aside={pluralize(items.length, WORDS.task)}>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Wszystko na bieżąco — ostatnia próba każdego zadania była poprawna.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.taskId} className="py-3 text-sm first:pt-0 last:pb-0">
              <p className="line-clamp-2 text-gray-900">
                <RichText text={item.prompt} />
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {item.subsectionTitle} · próba {item.attemptNumber}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
