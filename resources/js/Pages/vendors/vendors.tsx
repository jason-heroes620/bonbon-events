import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Vendor } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

type VendorsPageProps = {
    vendors: Paginated<Vendor>;
    filters: {
        search?: string;
        status?: "all" | "pending" | "approved" | "rejected";
        page?: number;
    };
};

type ListParams = {
    search?: string;
    status?: VendorsPageProps["filters"]["status"];
    page?: number;
};

const STATUS_OPTIONS: Array<{
    value: VendorsPageProps["filters"]["status"];
    label: string;
}> = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

function normalizeStatus(
    raw: string | null | undefined,
): VendorsPageProps["filters"]["status"] {
    if (raw === "pending" || raw === "approved" || raw === "rejected") {
        return raw;
    }
    return "all";
}

function buildListParams(params: ListParams): Record<string, string> {
    const search =
        typeof params.search === "string" && params.search.trim() !== ""
            ? params.search
            : undefined;
    const status =
        params.status && params.status !== "all" ? params.status : undefined;
    const page =
        typeof params.page === "number" &&
        Number.isFinite(params.page) &&
        params.page > 1
            ? params.page
            : undefined;

    const result: Record<string, string> = {};
    if (search) result.search = search;
    if (status) result.status = status;
    if (page) result.page = String(page);
    return result;
}

function buildVendorsUrl(params: ListParams): string {
    const clean = buildListParams(params);
    const query = new URLSearchParams(clean);
    const queryString = query.toString();
    return queryString ? `/vendors?${queryString}` : "/vendors";
}

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

export default function VendorsIndex({ vendors, filters }: VendorsPageProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState<VendorsPageProps["filters"]["status"]>(
        normalizeStatus(filters.status),
    );
    const didMountRef = useRef(false);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                "/vendors",
                buildListParams({
                    search,
                    status,
                }),
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search, status]);

    const stats = useMemo(() => {
        if (vendors.total === 0) return "No vendors";
        return `Showing ${vendors.from ?? 0}–${vendors.to ?? 0} of ${vendors.total}`;
    }, [vendors.from, vendors.to, vendors.total]);

    const currentPage = vendors.current_page ?? 1;

    const returnParams = buildListParams({
        search,
        status,
        page: currentPage,
    });
    const queryString = new URLSearchParams(returnParams).toString();

    const vendorEditUrl = (vendorId: string) =>
        queryString
            ? `/vendors/${vendorId}?${queryString}`
            : `/vendors/${vendorId}`;

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Vendors</h2>}
        >
            <Head title="Vendors" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Vendors</h1>
                        <p className="text-sm text-muted-foreground">{stats}</p>
                    </div>

                    <Link
                        href={buildVendorsUrl({})}
                        className={buttonVariants()}
                    >
                        Create Vendor
                    </Link>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full flex-wrap items-center gap-2">
                        <div className="flex flex-1 max-w-md items-center gap-2">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search vendors..."
                            />
                            {search.trim() !== "" || status !== "all" ? (
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setStatus("all");
                                        router.get(
                                            "/vendors",
                                            {},
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    Clear
                                </Button>
                            ) : null}
                        </div>

                        <select
                            className={cn(
                                "h-10 w-44 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring",
                            )}
                            value={status}
                            onChange={(e) =>
                                setStatus(
                                    normalizeStatus(e.currentTarget.value),
                                )
                            }
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="rounded-lg border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Vendor
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Active
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No vendors found.
                                        </td>
                                    </tr>
                                ) : (
                                    vendors.data.map((vendor) => (
                                        <tr
                                            key={vendor.vendor_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {vendor.vendor_name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {vendor.vendor_email}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {vendor.user
                                                    ? `${vendor.user.name}`
                                                    : vendor.user_id}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                        vendor.is_active
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-gray-100 text-gray-800",
                                                    )}
                                                >
                                                    {vendor.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                        vendor.vendor_status ===
                                                            "approved"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : vendor.vendor_status ===
                                                                "rejected"
                                                              ? "bg-red-100 text-red-800"
                                                              : "bg-yellow-100 text-yellow-800",
                                                    )}
                                                >
                                                    {vendor.vendor_status ===
                                                    "approved"
                                                        ? "Approved"
                                                        : vendor.vendor_status ===
                                                            "rejected"
                                                          ? "Rejected"
                                                          : "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={vendorEditUrl(
                                                            vendor.vendor_id,
                                                        )}
                                                        className={buttonVariants(
                                                            {
                                                                variant:
                                                                    "outline",
                                                                size: "sm",
                                                            },
                                                        )}
                                                    >
                                                        Edit
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                        <Pagination links={vendors.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
