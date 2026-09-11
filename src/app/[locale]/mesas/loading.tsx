import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoMesas() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:max-w-5xl lg:px-[10vw]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="mt-4 h-9 w-48" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Skeleton className="h-9 w-36 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
