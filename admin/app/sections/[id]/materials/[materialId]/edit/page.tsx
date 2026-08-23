"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { EditMaterialForm } from "@/components/EditMaterialForm";
import { useAuth } from "@/components/AuthContext";
import { getSection, updateMaterial } from "@/lib/data";
import type { Material } from "@/lib/types";

export default function EditSectionMaterialPage() {
  const { id, materialId } = useParams<{ id: string; materialId: string }>();
  const { getToken } = useAuth();
  const [material, setMaterial] = useState<Material | null | undefined>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      const section = await getSection(token ?? "", Number(id));
      if (!active) return;
      const found = section?.materials.find((m) => m.id === Number(materialId));
      setMaterial(found ?? undefined);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, materialId]);

  if (material === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-infiro-navy/20 border-t-infiro-navy" />
      </div>
    );
  }
  if (material === undefined) notFound();

  return (
    <EditMaterialForm
      material={material}
      backHref={`/sections/${id}`}
      parentTitle="Wróć do sekcji"
      onSave={async (payload) => {
        const token = await getToken();
        await updateMaterial(token ?? "", material.id, payload);
      }}
    />
  );
}
