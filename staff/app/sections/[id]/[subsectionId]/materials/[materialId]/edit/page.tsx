"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { EditMaterialForm } from "@/components/EditMaterialForm";
import { useAuth } from "@/components/AuthContext";
import { getSubsection, updateMaterial } from "@/lib/data";
import type { Material } from "@/lib/types";

export default function EditSubsectionMaterialPage() {
  const { id, subsectionId, materialId } = useParams<{
    id: string;
    subsectionId: string;
    materialId: string;
  }>();
  const { getToken } = useAuth();
  const [material, setMaterial] = useState<Material | null | undefined>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      const subsection = await getSubsection(token ?? "", Number(subsectionId));
      if (!active) return;
      const found = subsection?.materials.find((m) => m.id === Number(materialId));
      setMaterial(found ?? undefined);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subsectionId, materialId]);

  if (material === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-infiro-navy/20 border-t-infiro-navy" />
      </div>
    );
  }
  if (material === undefined) notFound();

  return (
    <EditMaterialForm
      material={material}
      backHref={`/sections/${id}/${subsectionId}`}
      parentTitle="Wróć do podsekcji"
      onSave={async (payload) => {
        const token = await getToken();
        await updateMaterial(token ?? "", material.id, payload);
      }}
    />
  );
}
