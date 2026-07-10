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

type ApplicationRow = {
    application_id: string;
    application_code: string;
    application_status: string;
    created_at: string;
    event_count: number;
    first_event_name: string | null;
    order_id: string | null;
    order_no: string | null;
    is_paid: boolean | null;
    total_price: number | string | null;
};

type VendorApplicationsProps = {
    applications: Paginated<ApplicationRow>;
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

export default function VendorApplicationsIndex({
    applications,
    filters,
}: VendorApplicationsProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const didMountRef = useRef(false);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                "/vendor/applications",
                {
                    search: search.trim() === "" ? undefined : search,
                },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const stats = useMemo(() => {
        if (applications.total === 0) return "No applications";
        return `Showing ${applications.from ?? 0}–${applications.to ?? 0} of ${
            applications.total
        }`;
    }, [applications.from, applications.to, applications.total]);

    return (
        <PublicSiteLayout>
            <Head title="My Applications" />

            <div className="mx-auto max-w-6xl p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">
                            My Applications
                        </h1>
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
                        placeholder="Search by code/status..."
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
                                        Application
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Event(s)
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Order
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Payment
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
                                {applications.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.data.map((app) => (
                                        <tr
                                            key={app.application_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {app.application_code}
                                            </td>
                                            <td className="px-4 py-3">
                                                {app.application_status.toUpperCase()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {app.event_count > 0 ? (
                                                    <div className="space-y-1">
                                                        <div>
                                                            {app.first_event_name ??
                                                                "-"}
                                                        </div>
                                                        {app.event_count > 1 ? (
                                                            <div className="text-xs text-muted-foreground">
                                                                +
                                                                {app.event_count -
                                                                    1}{" "}
                                                                more
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {app.order_id ? (
                                                    <Link
                                                        href={`/vendor/orders/${app.order_id}`}
                                                        className="text-sm font-medium underline"
                                                    >
                                                        {app.order_no ?? "View"}
                                                    </Link>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {app.is_paid === null ? (
                                                    "-"
                                                ) : (
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                            app.is_paid
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-amber-100 text-amber-800",
                                                        )}
                                                    >
                                                        {app.is_paid
                                                            ? "Paid"
                                                            : "Unpaid"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {app.created_at
                                                    ? format(
                                                          new Date(
                                                              app.created_at,
                                                          ),
                                                          "MMM d, y",
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/vendor/applications/${app.application_id}`}
                                                    className={buttonVariants({
                                                        variant: "outline",
                                                        size: "sm",
                                                    })}
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

                <Pagination links={applications.links} />
            </div>
        </PublicSiteLayout>
    );
}
