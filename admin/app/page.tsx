"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { getSections, getStudents } from "@/lib/data";
import { StatTile } from "@/components/StatTile";
import type { Section } from "@/lib/types";

export default function Home() {
  const { getToken } = useAuth();
  const [sections, setSections] = useState<Section[] | null>(null);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      const [sectionsData, students] = await Promise.all([
        getSections(token ?? ""),
        getStudents(),
      ]);
      if (active) {
        setSections(sectionsData);
        setStudentCount(students.length);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (sections === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-infiro-navy/20 border-t-infiro-navy" />
      </div>
    );
  }

  const totalSubsections = sections.reduce((sum, s) => sum + s.subsectionCount, 0);
  const totalTasks = sections.reduce((sum, s) => sum + s.taskCount, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-infiro-navy">Witaj!</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">
        Zarządzaj sekcjami, materiałami i zadaniami. Zmiany są widoczne w aplikacji mobilnej po opublikowaniu.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={sections.length} label="Sekcje kursu" />
        <StatTile value={totalSubsections} label="Podsekcje" />
        <StatTile value={totalTasks} label="Zadania" />
        <StatTile value={studentCount} label="Uczniowie z dostępem" />
      </div>

      <div className="mt-10 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-infiro-navy">Sekcje kursu</h2>
        <span className="flex items-center gap-3 text-sm text-gray-500">
          <span>{totalSubsections} podsekcji</span>
          <span className="text-gray-300">|</span>
          <span>{totalTasks} zadań</span>
        </span>
      </div>

      {sections.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">Brak sekcji — dodaj pierwszą.</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, index) => (
          <Link
            key={section.id}
            href={`/sections/${section.id}`}
            className="flex min-h-41 flex-col rounded-sm border border-gray-200 bg-white p-5 hover:border-infiro-navy"
          >
            <span className="text-xs font-medium text-gray-400">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 text-base font-semibold text-infiro-navy">
              {section.title}
            </h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-600">{section.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
              <span>
                {section.subsectionCount} podsekcji &middot; {section.taskCount} zadań
              </span>
              <span className="font-medium text-infiro-navy">Otwórz &rarr;</span>
            </div>
          </Link>
        ))}
        <Link
          href="/sections/new"
          className="flex min-h-41 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-gray-300 p-5 text-gray-500 hover:border-infiro-navy hover:text-infiro-navy"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-sm font-medium">Dodaj sekcję</span>
        </Link>
      </div>
    </div>
  );
}
