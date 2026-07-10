import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex flex-col bg-slate-50 dark:bg-zinc-950 pb-8 min-h-screen">
      {/* Hero Skeleton */}
      <div className="w-full h-[40vh] sm:h-[60vh] bg-zinc-200 dark:bg-zinc-800 animate-pulse relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-8 sm:p-16">
          <Skeleton className="h-10 w-3/4 sm:w-1/2 mb-4 bg-zinc-300/50" />
          <Skeleton className="h-6 w-1/2 sm:w-1/3 mb-8 bg-zinc-300/50" />
          <Skeleton className="h-12 w-40 bg-zinc-300/50" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {/* Categories Skeleton */}
        <section>
          <div className="flex overflow-hidden gap-4 sm:gap-8 pb-4 justify-start md:justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 w-[80px] sm:w-[100px] shrink-0">
                <Skeleton className="w-16 h-16 sm:w-24 sm:h-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </section>

        {/* Promo Grids Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 md:h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 md:h-64 w-full rounded-2xl" />
        </section>

        {/* Product Strip Skeleton */}
        <section className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-1/3 mt-2" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
