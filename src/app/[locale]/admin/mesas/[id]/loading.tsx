import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoInscricoes() {
  return (
    <div>
      <Skeleton className="h-4 w-32" />
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mt-8 h-6 w-40" />
      <div className="mt-4 space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
