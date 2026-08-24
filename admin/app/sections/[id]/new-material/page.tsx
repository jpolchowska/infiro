"use client";

import { useParams } from "next/navigation";
import { NewMaterialForm } from "@/components/NewMaterialForm";
import { useAuth } from "@/components/AuthContext";
import { createMaterial } from "@/lib/data";

export default function NewSectionMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();

  return (
    <NewMaterialForm
      backHref={`/sections/${id}`}
      parentTitle="Wróć do sekcji"
      onCreate={async (payload) => {
        const token = await getToken();
        await createMaterial(
          token ?? "",
          { sectionId: Number(id) },
          { title: payload.title, contentText: payload.contentText || undefined, file: payload.file || undefined }
        );
      }}
    />
  );
}
