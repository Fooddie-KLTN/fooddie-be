import { Skeleton } from "@/components/ui/skeleton";

export function RestaurantSkeleton() {
  return (
    <div className="pb-10">
      <Skeleton className="h-[300px] w-full" />
      
      <div className="container mt-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <Skeleton className="h-8 w-48 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Skeleton className="h-10 w-64 mb-6" />
        
        {[1, 2].map(section => (
          <div key={section} className="mb-10">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map(item => (
                <div key={item} className="min-w-[280px]">
                  <Skeleton className="h-48 w-full mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}