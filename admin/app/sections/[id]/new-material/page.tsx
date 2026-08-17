"use client";

import { useParams } from "next/navigation";
import { NewMaterialForm } from "@/components/NewMaterialForm";

export default function NewSectionMaterialPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <NewMaterialForm
      backHref={`/sections/${id}`}
      parentTitle="Wróć do sekcji"
      onCreate={(payload) => console.log("create section material", { sectionId: id, ...payload })}
    />
  );
}
