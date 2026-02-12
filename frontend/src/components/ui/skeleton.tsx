import { cn } from "@/lib/utils"
import { TableRow, TableCell } from "@/components/ui/table"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
    </TableRow>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export { Skeleton, TableRowSkeleton, TableSkeleton, CardSkeleton }
