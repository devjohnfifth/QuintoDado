import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoMesa() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:max-w-5xl lg:px-[10vw]">
      <Skeleton className="mb-6 aspect-[21/9] w-full rounded-2xl" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-9 w-3/4" />
      <Skeleton className="mt-2 h-4 w-40" />
      <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-4 w-5/6 max-w-2xl" />

      <div className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card/60 p-5 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-10 h-6 w-40" />
      <Skeleton className="mt-4 h-32 w-full rounded-xl" />
    </article>
  );
}
