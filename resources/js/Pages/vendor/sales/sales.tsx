import PublicSiteLayout from "@/components/PublicSiteLayout";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";

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

type SalesRow = {
    vendor_sales_id: string;
    application_id: string;
    event_id: string;
    total_sales_amount: string;
    created_at: string;
    application_code: string;
    event_name: string | null;
    event_end_date: string | null;
};

type EventOption = {
    application_id: string;
    event_id: string;
    event_name: string;
    application_code: string;
    label: string;
};

type SalesRangeOption = {
    id: number;
    sales_range: string;
};

type VendorSalesProps = {
    sales: Paginated<SalesRow>;
    eventOptions: EventOption[];
    salesRanges: SalesRangeOption[];
    filters: {
        search?: string;
    };
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

export default function VendorSalesIndex({
    sales,
    eventOptions,
    salesRanges,
    filters,
}: VendorSalesProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [open, setOpen] = useState(false);
    const didMountRef = useRef(false);

    const form = useForm({
        application_id: "",
        total_sales_amount: "",
    });

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                "/vendor/sales",
                {
                    search: search.trim() === "" ? undefined : search,
                },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const stats = useMemo(() => {
        if (sales.total === 0) return "No sales submissions";
        return `Showing ${sales.from ?? 0}–${sales.to ?? 0} of ${sales.total}`;
    }, [sales.from, sales.to, sales.total]);

    const closeModal = () => {
        setOpen(false);
        form.reset();
        form.clearErrors();
    };

    const handleSubmit = () => {
        form.post("/vendor/sales", {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                closeModal();
                router.reload({
                    only: ["sales"],
                });
            },
        });
    };

    return (
        <PublicSiteLayout>
            <Head title="My Sales Submissions" />

            <div className="mx-auto max-w-6xl p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">
                            My Sales Submissions
                        </h1>
                        <p className="text-sm text-muted-foreground">{stats}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" onClick={() => setOpen(true)}>
                            New Submission
                        </Button>
                        <Link
                            href="/"
                            className={buttonVariants({ variant: "outline" })}
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>

                <div className="flex w-full max-w-md items-center gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by event / application / sales range..."
                    />
                    {search.trim() !== "" ? (
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setSearch("")}
                        >
                            Clear
                        </Button>
                    ) : null}
                </div>

                <div className="rounded-lg border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Event
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Application
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Total Sales
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Submitted
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No sales submissions found.
                                        </td>
                                    </tr>
                                ) : (
                                    sales.data.map((row) => (
                                        <tr
                                            key={row.vendor_sales_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {row.event_name ?? "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/vendor/applications/${row.application_id}`}
                                                    className="underline"
                                                >
                                                    {row.application_code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.total_sales_amount}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {row.created_at
                                                    ? format(
                                                          new Date(
                                                              row.created_at,
                                                          ),
                                                          "MMM d, y",
                                                      )
                                                    : "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination links={sales.links} />
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>New Sales Submission</DialogTitle>
                        <DialogDescription>
                            Submit total sales for a paid, approved event
                            application.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="application_id"
                                className="text-sm font-medium"
                            >
                                Event
                            </label>
                            <select
                                id="application_id"
                                className={selectClassName}
                                value={form.data.application_id}
                                onChange={(e) =>
                                    form.setData(
                                        "application_id",
                                        e.target.value,
                                    )
                                }
                                disabled={form.processing}
                            >
                                <option value="">Select an event</option>
                                {eventOptions.map((option) => (
                                    <option
                                        key={option.application_id}
                                        value={option.application_id}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {form.errors.application_id ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.application_id}
                                </p>
                            ) : null}
                            {eventOptions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No eligible paid and approved events are
                                    available for submission.
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="total_sales_amount"
                                className="text-sm font-medium"
                            >
                                Total Sales
                            </label>
                            <select
                                id="total_sales_amount"
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
                            onClick={closeModal}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={
                                form.processing ||
                                eventOptions.length === 0 ||
                                form.data.application_id === "" ||
                                form.data.total_sales_amount === ""
                            }
                        >
                            {form.processing ? "Submitting..." : "Submit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PublicSiteLayout>
    );
}
