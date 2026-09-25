import { ApiError, apiFetch } from "./api";

export type HeadingBlock = { type: "heading"; text: string };
export type SubheadingBlock = { type: "subheading"; text: string };
export type ParagraphBlock = { type: "paragraph"; text: string };
export type ListBlock = { type: "list"; items: string[] };
export type ImageBlock = { type: "image"; src: string; alt: string };
export type CalloutStyle = "zapamietaj" | "wskazowka" | "uwaga" | "definicja";
export type CalloutBlock = { type: "callout"; style: CalloutStyle; text: string };

export type EbookBlock =
  | HeadingBlock
  | SubheadingBlock
  | ParagraphBlock
  | ListBlock
  | ImageBlock
  | CalloutBlock;

export type Ebook = {
  title: string;
  intro: string | null;
  blocks: EbookBlock[];
};

type RawImageBlock = { type: "image"; file: string; alt: string };
type RawBlock =
  | HeadingBlock
  | SubheadingBlock
  | ParagraphBlock
  | ListBlock
  | RawImageBlock
  | CalloutBlock;

type RawEbook = {
  title: string;
  intro?: string | null;
  blocks: RawBlock[];
};

function mapBlock(raw: RawBlock): EbookBlock {
  if (raw.type === "image") {
    return { type: "image", src: raw.file, alt: raw.alt };
  }
  return raw;
}

export async function getEbook(token: string, subsectionId: number): Promise<Ebook | null> {
  try {
    const raw = await apiFetch<RawEbook>(`/api/student/subsections/${subsectionId}/ebook`, { token });
    return {
      title: raw.title,
      intro: raw.intro ?? null,
      blocks: raw.blocks.map(mapBlock),
    };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
