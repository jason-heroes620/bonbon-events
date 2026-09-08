import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { buttonVariants, Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowDownWideNarrow,
    ArrowUpNarrowWide,
    BarChart3,
    Plus,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type EventOption = {
    event_id: string;
    event_name: string;
    event_start_date: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type VendorSalesRow = {
    application_id: string;
    application_event_id: string;
    application_code: string;
    vendor_id: string;
    vendor_name: string | null;
    booth_numbers: string | null;
    total_sales_rm: string | null;
    sales_range: string | null;
};

type ChartDistributionRow = {
    sales_range: string;
    vendors_count: number;
};

type SalesRangeOption = {
    id: number;
    sales_range: string;
};

type PaidVendorOption = {
    application_event_id: string;
    application_id: string;
    application_code: string;
    vendor_id: string;
    vendor_name: string | null;
    booth_numbers: string | null;
    label: string;
};

type SalesReportPageProps = {
    events: EventOption[];
    selectedEventId: string | null;
    filters: {
        sort: "vendor_name" | "total_sales_rm";
        direction: "asc" | "desc";
    };
    chartDistribution: ChartDistributionRow[];
    vendorRows: Paginated<VendorSalesRow>;
    salesRanges: SalesRangeOption[];
    paidVendorsForEvent: PaidVendorOption[];
};

const selectClassName =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function Pagination({ links }: { links: PaginationLink[] }) {
    if (!links?.length) return null;

    return (
        <nav className="flex flex-wrap gap-1">
            {links.map((link) => {
                const commonClassName = cn(
                    "inline-flex items-center rounded-md border px-3 py-1 text-sm",
                    link.active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-muted",
                    !link.url && "pointer-events-none opacity-50",
                );

                if (!link.url) {
                    return (
                        <span
                            key={link.label}
                            className={commonClassName}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }

                return (
                    <Link
                        key={link.label}
                        href={link.url}
                        className={commonClassName}
                        preserveScroll
                        preserveState
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}

export default function SalesReport({
    events,
    selectedEventId,
    filters,
    chartDistribution,
    vendorRows,
    salesRanges,
    paidVendorsForEvent,
}: SalesReportPageProps) {
    const [eventId, setEventId] = useState(selectedEventId ?? "");
    const [sort, setSort] = useState<"vendor_name" | "total_sales_rm">(
        filters.sort ?? "vendor_name",
    );
    const [direction, setDirection] = useState<"asc" | "desc">(
        filters.direction ?? "asc",
    );
    const [manualModalOpen, setManualModalOpen] = useState(false);

    const form = useForm({
        application_event_id: "",
        total_sales_amount: "",
        event_id: selectedEventId ?? "",
        sort: filters.sort ?? "vendor_name",
        direction: filters.direction ?? "asc",
    });

    useEffect(() => {
        setEventId(selectedEventId ?? "");
        form.setData("event_id", selectedEventId ?? "");
    }, [selectedEventId]);

    useEffect(() => {
        setSort(filters.sort ?? "vendor_name");
        setDirection(filters.direction ?? "asc");
        form.setData("sort", filters.sort ?? "vendor_name");
        form.setData("direction", filters.direction ?? "asc");
    }, [filters.sort, filters.direction]);

    const selectedEvent = useMemo(
        () => events.find((e) => e.event_id === eventId) ?? null,
        [events, eventId],
    );

    const totalVendors = useMemo(() => {
        return chartDistribution.reduce(
            (sum, row) => sum + (Number(row.vendors_count) || 0),
            0,
        );
    }, [chartDistribution]);

    const applyFilters = (next?: {
        eventId?: string;
        sort?: "vendor_name" | "total_sales_rm";
        direction?: "asc" | "desc";
    }) => {
        const nextEventId =
            next?.eventId !== undefined ? next.eventId : eventId;
        const nextSort = next?.sort ?? sort;
        const nextDirection = next?.direction ?? direction;

        router.get(
            "/sales-report",
            {
                event_id: nextEventId === "" ? undefined : nextEventId,
                sort: nextSort === "vendor_name" ? undefined : nextSort,
                direction:
                    nextSort === "vendor_name" && nextDirection === "asc"
                        ? undefined
                        : nextDirection,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const toggleSort = (nextSort: "vendor_name" | "total_sales_rm") => {
        applyFilters({
            sort: nextSort,
            direction:
                sort === nextSort && direction === "asc" ? "desc" : "asc",
        });
    };

    const renderSortHeader = (
        label: string,
        key: "vendor_name" | "total_sales_rm",
        align: "left" | "right" = "left",
    ) => {
        const active = sort === key;
        const alignClass =
            align === "right" ? "text-right justify-end" : "text-left";
        return (
            <button
                type="button"
                onClick={() => toggleSort(key)}
                className={cn(
                    "inline-flex items-center gap-1 font-medium",
                    alignClass,
                    !active && "text-muted-foreground hover:text-foreground",
                )}
            >
                <span>{label}</span>
                {active && direction === "asc" ? (
                    <ArrowUpNarrowWide className="h-3.5 w-3.5" />
                ) : (
                    <ArrowDownWideNarrow
                        className={cn("h-3.5 w-3.5", !active && "opacity-0")}
                    />
                )}
            </button>
        );
    };

    const selectedEventLabel = selectedEvent
        ? selectedEvent.event_start_date
            ? `${selectedEvent.event_name} (${format(new Date(selectedEvent.event_start_date), "MMM d, yyyy")})`
            : selectedEvent.event_name
        : "";

    const closeManualModal = () => {
        setManualModalOpen(false);
        form.reset();
        form.clearErrors();
    };

    const openManualModal = () => {
        if (!selectedEventId) return;
        form.setData("application_event_id", "");
        form.setData("total_sales_amount", "");
        form.setData("event_id", selectedEventId);
        form.setData("sort", sort);
        form.setData("direction", direction);
        form.clearErrors();
        setManualModalOpen(true);
    };

    const submitManualSales = () => {
        form.post("/sales-report", {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                closeManualModal();
                router.reload({
                    only: ["vendorRows", "chartDistribution"],
                });
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Sales Report</h2>}
        >
            <Head title="Sales Report" />

            <div className="space-y-4">
                <div className="rounded-lg border bg-white p-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-3 md:items-end">
                        <div className="md:col-span-2 space-y-2">
                            <label
                                htmlFor="event_id"
                                className="text-sm font-medium"
                            >
                                Event
                            </label>
                            <select
                                id="event_id"
                                className={selectClassName}
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
                            >
                                <option value="" disabled>
                                    Select an event
                                </option>
                                {events.map((event) => (
                                    <option
                                        key={event.event_id}
                                        value={event.event_id}
                                    >
                                        {event.event_name}
                                        {event.event_start_date
                                            ? ` (${format(new Date(event.event_start_date), "MMM d, yyyy")})`
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setEventId("");
                                    applyFilters({ eventId: "" });
                                }}
                                disabled={eventId === ""}
                            >
                                Reset
                            </Button>
                            <Button
                                type="button"
                                disabled={!eventId}
                                onClick={() => applyFilters({ eventId })}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm text-muted-foreground">
                            {selectedEventLabel ? (
                                <>
                                    Showing sales report for event:{" "}
                                    <span className="font-medium text-foreground">
                                        {selectedEventLabel}
                                    </span>
                                </>
                            ) : (
                                "Select an event to view sales data and record submissions."
                            )}
                        </div>
                        <div>
                            <Button
                                type="button"
                                disabled={!selectedEventId}
                                onClick={openManualModal}
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Sales Submission
                            </Button>
                        </div>
                    </div>
                </div>

                {selectedEventId ? (
                    <>
                        <div className="rounded-lg border bg-white">
                            <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    <span>Sales Distribution</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Total vendors with sales submission:{" "}
                                    <span className="font-medium text-foreground">
                                        {totalVendors}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="h-[360px] w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={chartDistribution}
                                            margin={{
                                                top: 10,
                                                right: 10,
                                                left: 0,
                                                bottom: 10,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="currentColor"
                                                className="stroke-foreground/10"
                                            />
                                            <XAxis
                                                dataKey="sales_range"
                                                tick={{ fontSize: 12 }}
                                                interval={0}
                                                angle={-15}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tick={{ fontSize: 12 }}
                                                label={{
                                                    value: "No. of vendors",
                                                    angle: -90,
                                                    position: "insideLeft",
                                                    style: {
                                                        fontSize: 12,
                                                        fill: "currentColor",
                                                    },
                                                }}
                                            />
                                            <Tooltip />
                                            <Bar
                                                dataKey="vendors_count"
                                                name="No. of vendors"
                                                fill="#F90606"
                                                radius={[6, 6, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border bg-white">
                            <div className="flex items-center justify-between border-b px-4 py-3">
                                <div className="text-sm font-semibold">
                                    Vendor Sales
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Showing{" "}
                                    <span className="font-medium text-foreground">
                                        {vendorRows.from ?? 0}
                                    </span>
                                    {" – "}
                                    <span className="font-medium text-foreground">
                                        {vendorRows.to ?? 0}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium text-foreground">
                                        {vendorRows.total}
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/40">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium w-64">
                                                {renderSortHeader(
                                                    "Vendor Name",
                                                    "vendor_name",
                                                )}
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Booth Number
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium w-56">
                                                {renderSortHeader(
                                                    "Total Sales (RM)",
                                                    "total_sales_rm",
                                                    "right",
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendorRows.data.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-10 text-center text-muted-foreground"
                                                >
                                                    No paid vendor sales found
                                                    for this event.
                                                </td>
                                            </tr>
                                        ) : (
                                            vendorRows.data.map((row) => (
                                                <tr
                                                    key={
                                                        row.application_event_id
                                                    }
                                                    className="border-b last:border-b-0"
                                                >
                                                    <td className="px-4 py-3 font-medium">
                                                        <Link
                                                            className={buttonVariants(
                                                                {
                                                                    variant:
                                                                        "link",
                                                                },
                                                            )}
                                                            href={`/applications/${row.application_id}`}
                                                        >
                                                            {row.vendor_name ??
                                                                "-"}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {row.booth_numbers &&
                                                        row.booth_numbers.trim() !==
                                                            ""
                                                            ? row.booth_numbers
                                                            : "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {row.total_sales_rm
                                                            ? row.total_sales_rm
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between border-t px-4 py-3">
                                <Pagination links={vendorRows.links} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
                        Select an event to view the sales distribution and
                        vendor sales list.
                    </div>
                )}
            </div>

            <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Manual Sales Submission</DialogTitle>
                        <DialogDescription>
                            Submit a sales entry on behalf of a paid vendor for
                            the selected event.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="vendor_application_event_id"
                                className="text-sm font-medium"
                            >
                                Vendor
                            </label>
                            <select
                                id="vendor_application_event_id"
                                className={selectClassName}
                                value={form.data.application_event_id}
                                onChange={(e) =>
                                    form.setData(
                                        "application_event_id",
                                        e.target.value,
                                    )
                                }
                                disabled={
                                    form.processing ||
                                    paidVendorsForEvent.length === 0
                                }
                            >
                                <option value="">Select a vendor</option>
                                {paidVendorsForEvent.map((option) => (
                                    <option
                                        key={option.application_event_id}
                                        value={option.application_event_id}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {form.errors.application_event_id ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.application_event_id}
                                </p>
                            ) : null}
                            {paidVendorsForEvent.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No paid vendors are available for this
                                    event.
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="sales_range_amount"
                                className="text-sm font-medium"
                            >
                                Sales Range
                            </label>
                            <select
                                id="sales_range_amount"
                                className={selectClassName}
                                value={form.data.total_sales_amount}
                                onChange={(e) =>
                                    form.setData(
                                        "total_sales_amount",
                                        e.target.value,
                                    )
                                }
                                disabled={form.processing}
                            >
                                <option value="">Select a sales range</option>
                                {salesRanges.map((option) => (
                                    <option
                                        key={option.id}
                                        value={option.sales_range}
                                    >
                                        {option.sales_range}
                                    </option>
                                ))}
                            </select>
                            {form.errors.total_sales_amount ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.total_sales_amount}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeManualModal}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitManualSales}
                            disabled={
                                form.processing ||
                                paidVendorsForEvent.length === 0 ||
                                form.data.application_event_id === "" ||
                                form.data.total_sales_amount === ""
                            }
                        >
                            {form.processing ? "Submitting..." : "Submit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
