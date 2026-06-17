import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

type InvoiceRow = {
    invoice_id: string;
    invoice_no: string;
    invoice_date: string;
    invoice_status: string;
    sub_total: number | string;
    charges_total: number | string;
    invoice_amount: number | string;
    order_id: string;
    application_id: string;
    created_at: string;
    order_no?: string | null;
    is_paid?: boolean;
};

type InvoicesPageProps = {
    invoices: Paginated<InvoiceRow>;
    filters: {
        search?: string;
    };
};

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
                    !link.url && "opacity-50 pointer-events-none",
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

export default function InvoicesIndex({
    invoices,
    filters,
}: InvoicesPageProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const didMountRef = useRef(false);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                "/invoices",
                { search: search.trim() === "" ? undefined : search },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const stats = useMemo(() => {
        if (invoices.total === 0) return "No invoices";
        return `Showing ${invoices.from ?? 0}–${invoices.to ?? 0} of ${invoices.total}`;
    }, [invoices.from, invoices.to, invoices.total]);

    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n)) return n.toFixed(2);
        return String(value);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Invoices</h2>}
        >
            <Head title="Invoices" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Invoices</h1>
                        <p className="text-sm text-muted-foreground">{stats}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full max-w-md items-center gap-2">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search invoices..."
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
                </div>

                <div className="rounded-lg border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Invoice No
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Order No
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Subtotal
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Charges
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Invoice Date
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No invoices found.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.data.map((invoice) => (
                                        <tr
                                            key={invoice.invoice_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                <Link
                                                    href={`/invoices/${invoice.invoice_id}`}
                                                    className="underline"
                                                >
                                                    {invoice.invoice_no}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {invoice.order_no ?? "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                        invoice.invoice_status ===
                                                            "paid"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : invoice.invoice_status ===
                                                                "canceled"
                                                              ? "bg-gray-100 text-gray-800"
                                                              : "bg-amber-100 text-amber-800",
                                                    )}
                                                >
                                                    {invoice.invoice_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatAmount(
                                                    invoice.sub_total,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatAmount(
                                                    invoice.charges_total ?? 0,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatAmount(
                                                    invoice.invoice_amount,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {format(
                                                    invoice.invoice_date,
                                                    "MMM d, y",
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/invoices/${invoice.invoice_id}`}
                                                        className={buttonVariants(
                                                            {
                                                                variant:
                                                                    "outline",
                                                                size: "sm",
                                                            },
                                                        )}
                                                    >
                                                        View
                                                    </Link>
                                                    {invoice.order_id ? (
                                                        <Link
                                                            href={`/orders/${invoice.order_id}`}
                                                            className={buttonVariants(
                                                                {
                                                                    variant:
                                                                        "outline",
                                                                    size: "sm",
                                                                },
                                                            )}
                                                        >
                                                            Order
                                                        </Link>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <Pagination links={invoices.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
