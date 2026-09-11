import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoPresencialBh() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <Skeleton className="mx-auto h-10 w-72" />
        <Skeleton className="mx-auto mt-4 h-5 w-96 max-w-full" />
        <Skeleton className="mx-auto mt-8 h-11 w-40 rounded-full" />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:max-w-5xl lg:px-[10vw]">
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </>
  );
}
