"use client";

import { useParams } from "next/navigation";
import { NewMaterialForm } from "@/components/NewMaterialForm";
import { useAuth } from "@/components/AuthContext";
import { createMaterial } from "@/lib/data";

export default function NewSubsectionMaterialPage() {
  const { id, subsectionId } = useParams<{ id: string; subsectionId: string }>();
  const { getToken } = useAuth();

  return (
    <NewMaterialForm
      backHref={`/sections/${id}/${subsectionId}`}
      parentTitle="Wróć do podsekcji"
      onCreate={async (payload) => {
        const token = await getToken();
        await createMaterial(
          token ?? "",
          { subsectionId: Number(subsectionId) },
          { title: payload.title, contentText: payload.contentText || undefined, file: payload.file || undefined }
        );
      }}
    />
  );
}
