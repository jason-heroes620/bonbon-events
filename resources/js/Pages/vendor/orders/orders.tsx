import PublicSiteLayout from "@/components/PublicSiteLayout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Head, Link, router } from "@inertiajs/react";
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

type OrderRow = {
    order_id: string;
    order_no: string;
    application_id: string;
    application_code: string;
    total_price: number | string;
    sub_total: number | string;
    discount_price: number | string;
    charges_total: number | string;
    is_paid: boolean;
    is_active: boolean;
    created_at: string;
    invoice_id?: string | null;
    invoice_no?: string | null;
    invoice_status?: string | null;
};

type VendorOrdersProps = {
    orders: Paginated<OrderRow>;
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

export default function VendorOrdersIndex({ orders, filters }: VendorOrdersProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const didMountRef = useRef(false);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                "/vendor/orders",
                { search: search.trim() === "" ? undefined : search },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const stats = useMemo(() => {
        if (orders.total === 0) return "No orders";
        return `Showing ${orders.from ?? 0}–${orders.to ?? 0} of ${orders.total}`;
    }, [orders.from, orders.to, orders.total]);

    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n)) return n.toFixed(2);
        return String(value);
    };

    return (
        <PublicSiteLayout>
            <Head title="My Orders" />

            <div className="mx-auto max-w-6xl p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">My Orders</h1>
                        <p className="text-sm text-muted-foreground">{stats}</p>
                    </div>
                    <Link
                        href="/"
                        className={buttonVariants({ variant: "outline" })}
                    >
                        Back to Home
                    </Link>
                </div>

                <div className="flex w-full max-w-md items-center gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by order no / application / invoice..."
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
                                        Order No
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Application
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Payment
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Invoice
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Created
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.data.map((order) => (
                                        <tr
                                            key={order.order_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {order.order_no}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/vendor/applications/${order.application_id}`}
                                                    className="underline"
                                                >
                                                    {order.application_code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatAmount(order.total_price)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                        order.is_paid
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-amber-100 text-amber-800",
                                                    )}
                                                >
                                                    {order.is_paid
                                                        ? "Paid"
                                                        : "Unpaid"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {order.invoice_id ? (
                                                    <span className="text-sm">
                                                        {order.invoice_no ??
                                                            "Invoice"}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {order.created_at
                                                    ? format(
                                                          new Date(
                                                              order.created_at,
                                                          ),
                                                          "MMM d, y",
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/vendor/orders/${order.order_id}`}
                                                    className={buttonVariants(
                                                        {
                                                            variant: "outline",
                                                            size: "sm",
                                                        },
                                                    )}
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination links={orders.links} />
            </div>
        </PublicSiteLayout>
    );
}

