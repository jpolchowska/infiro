"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { LoadState } from "@/components/LoadState";
import { getEbook } from "@/lib/data";
import type { CalloutStyle, EbookBlock } from "@/lib/types";
import { useApiData } from "@/lib/useApiData";

const CALLOUT_LABELS: Record<CalloutStyle, string> = {
  zapamietaj: "Zapamiętaj",
  wskazowka: "Wskazówka",
  uwaga: "Uwaga",
  definicja: "Definicja",
};

function EbookBlockView({ block }: { block: EbookBlock }) {
  switch (block.type) {
    case "heading":
      return <h2 className="mt-8 text-xl font-semibold text-infiro-navy">{block.text}</h2>;
    case "subheading":
      return <h3 className="mt-6 text-base font-semibold text-gray-900">{block.text}</h3>;
    case "paragraph":
      return <p className="mt-3 whitespace-pre-wrap text-gray-700">{block.text}</p>;
    case "list":
      return (
        <ul className="mt-3 list-inside list-disc text-gray-700">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    case "image":
      return (
        <Image
          src={block.file}
          alt={block.alt}
          width={block.width}
          height={block.height}
          unoptimized
          className="mt-4 h-auto max-w-full rounded-sm"
        />
      );
    case "callout":
      return (
        <div className="mt-4 rounded-sm border-l-4 border-infiro-navy bg-infiro-navy/5 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-infiro-navy">
            {CALLOUT_LABELS[block.style]}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-gray-800">{block.text}</p>
        </div>
      );
  }
}

export default function EbookPage() {
  const { id, subsectionId } = useParams<{ id: string; subsectionId: string }>();
  const { state } = useApiData((token) => getEbook(token, Number(subsectionId)), subsectionId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const ebook = state.data;
  if (!ebook) notFound();

  return (
    <div>
      <Link href={`/sections/${id}/${subsectionId}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wróć do podsekcji
      </Link>
      <article className="mt-3 max-w-2xl rounded-sm border border-gray-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-infiro-navy">{ebook.title}</h1>
        {ebook.intro && <p className="mt-3 text-gray-600">{ebook.intro}</p>}
        {ebook.blocks.map((block, index) => (
          <EbookBlockView key={index} block={block} />
        ))}
      </article>
    </div>
  );
}
