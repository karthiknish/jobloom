"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    Row,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDownIcon } from "lucide-react"

interface VirtualizedDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    searchPlaceholder?: string
    onRowClick?: (row: TData) => void
    containerHeight?: string
    estimateRowHeight?: number
}

interface DataTableRowProps<TData> {
    row: Row<TData>
    onRowClick?: (row: TData) => void
    style?: React.CSSProperties
}

const DataTableRow = <TData,>({ row, onRowClick, style }: DataTableRowProps<TData>) => {
    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            className={cn(
                "hover:bg-muted/50 transition-colors flex w-full",
                onRowClick && "cursor-pointer"
            )}
            style={style}
            onClick={() => onRowClick?.(row.original)}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell
                    key={cell.id}
                    className="flex-1 overflow-hidden truncate"
                    style={{ width: cell.column.getSize() }}
                >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    )
}

// Fixed generic memoization
const MemoizedDataTableRow = React.memo(DataTableRow, (prevProps, nextProps) => {
    return (
        prevProps.row.getIsSelected() === nextProps.row.getIsSelected() &&
        prevProps.row.original === nextProps.row.original &&
        prevProps.onRowClick === nextProps.onRowClick &&
        JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
    )
}) as typeof DataTableRow

export function VirtualizedDataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Filter...",
    onRowClick,
    containerHeight = "600px",
    estimateRowHeight = 60,
}: VirtualizedDataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    const { rows } = table.getRowModel()
    const parentRef = React.useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateRowHeight,
        overscan: 10,
    })

    const virtualRows = virtualizer.getVirtualItems()
    const totalSize = virtualizer.getTotalSize()

    return (
        <div className="w-full space-y-4">
            {/* Search and Column Visibility */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {searchKey && (
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <Input
                            placeholder={searchPlaceholder}
                            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn(searchKey)?.setFilterValue(event.target.value)
                            }
                            className="h-9 w-full sm:w-[250px]"
                        />
                    </div>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="sm:ml-auto">
                            Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Virtualized Table Container */}
            <div
                ref={parentRef}
                className="rounded-md border border-border/70 bg-card/50 backdrop-blur-sm overflow-auto"
                style={{ height: containerHeight }}
            >
                <Table className="grid">
                    <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm border-b">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="flex w-full">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="flex-1 flex items-center"
                                            style={{ width: header.getSize() }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody
                        className="relative"
                        style={{ height: `${totalSize}px` }}
                    >
                        {rows.length > 0 ? (
                            virtualRows.map((virtualRow: { index: number; size: number; start: number }) => {
                                const row = rows[virtualRow.index] as Row<TData>
                                return (
                                    <MemoizedDataTableRow<TData>
                                        key={row.id}
                                        row={row}
                                        onRowClick={onRowClick}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    />
                                )
                            })
                        ) : (
                            <div className="flex items-center justify-center h-24 text-muted-foreground">
                                No results.
                            </div>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Showing {rows.length} records {table.getFilteredSelectedRowModel().rows.length > 0 && `(${table.getFilteredSelectedRowModel().rows.length} selected)`}
                </div>
            </div>
        </div>
    )
}
