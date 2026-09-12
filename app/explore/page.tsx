import { Suspense } from "react";
import { ArchiveState } from "@/components/ui/archive-state";
import { Explorer } from "./explorer";

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <ArchiveState kind="loading" />
        </div>
      }
    >
      <Explorer />
    </Suspense>
  );
}
