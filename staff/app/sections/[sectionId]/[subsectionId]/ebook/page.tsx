"use client";

import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { LoadState } from "@/components/ui/LoadState";
import { getEbook } from "@/lib/data";
import type { CalloutStyle, EbookBlock } from "@/lib/types";
import { useApiData } from "@/hooks/useApiData";
import { BackLink } from "@/components/ui/BackLink";
import { RichText } from "@/components/ui/RichText";

const CALLOUT_LABELS: Record<CalloutStyle, string> = {
  zapamietaj: "Zapamiętaj",
  wskazowka: "Wskazówka",
  uwaga: "Uwaga",
  definicja: "Definicja",
};

function EbookBlockView({ block }: { block: EbookBlock }) {
  switch (block.type) {
    case "heading":
      return <h2 className="mt-10 text-xl font-semibold text-infiro-navy">{block.text}</h2>;
    case "subheading":
      return <h3 className="mt-8 text-lg font-semibold text-gray-900">{block.text}</h3>;
    case "paragraph":
      return (
        <p className="mt-4 whitespace-pre-wrap text-gray-700">
          <RichText text={block.text} />
        </p>
      );
    case "list":
      return (
        <ul className="mt-4 list-disc space-y-1.5 pl-6 text-gray-700 marker:text-infiro-navy/40">
          {block.items.map((item, index) => (
            <li key={index}>
              <RichText text={item} />
            </li>
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
          className="mx-auto mt-6 h-auto max-w-full rounded-sm"
        />
      );
    case "callout":
      return (
        <div className="mt-6 rounded-sm border-l-4 border-infiro-navy bg-infiro-navy/5 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-infiro-navy">
            {CALLOUT_LABELS[block.style]}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-gray-800">
            <RichText text={block.text} />
          </p>
        </div>
      );
  }
}

export default function EbookPage() {
  const { sectionId, subsectionId } = useParams<{ sectionId: string; subsectionId: string }>();
  const { state } = useApiData((token) => getEbook(token, Number(subsectionId)), subsectionId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const ebook = state.data;
  if (!ebook) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href={`/sections/${sectionId}/${subsectionId}`}>Wróć do podsekcji</BackLink>
      <article className="mt-3 rounded-sm border border-infiro-border bg-white px-6 py-8 text-base leading-relaxed sm:px-12 sm:py-12">
        <h1 className="text-3xl font-semibold leading-tight text-infiro-navy">{ebook.title}</h1>
        {ebook.intro && (
          <p className="mt-4 text-lg text-gray-600">
            <RichText text={ebook.intro} />
          </p>
        )}
        {ebook.blocks.map((block, index) => (
          <EbookBlockView key={index} block={block} />
        ))}
      </article>
    </div>
  );
}
