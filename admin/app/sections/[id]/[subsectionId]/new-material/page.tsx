"use client";

import { useParams } from "next/navigation";
import { NewMaterialForm } from "@/components/NewMaterialForm";

export default function NewSubsectionMaterialPage() {
  const { id, subsectionId } = useParams<{ id: string; subsectionId: string }>();

  return (
    <NewMaterialForm
      backHref={`/sections/${id}/${subsectionId}`}
      parentTitle="Wróć do podsekcji"
      onCreate={(payload) =>
        console.log("create subsection material", { sectionId: id, subsectionId, ...payload })
      }
    />
  );
}
