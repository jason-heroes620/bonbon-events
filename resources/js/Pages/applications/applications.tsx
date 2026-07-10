import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Application, Event } from "@/types";
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

type ApplicationsPageProps = {
    applications: Paginated<Application>;
    events: Pick<Event, "event_id" | "event_name">[];
    filters: {
        search?: string;
        event_id?: string | null;
        status?: string | null;
    };
};

const selectClassName =
    "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm";

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

export default function ApplicationsIndex({
    applications,
    events,
    filters,
}: ApplicationsPageProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [eventId, setEventId] = useState(filters.event_id ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const didMountRef = useRef(false);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                "/applications",
                {
                    search: search.trim() === "" ? undefined : search,
                    event_id: eventId.trim() === "" ? undefined : eventId,
                    status: status.trim() === "" ? undefined : status,
                },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search, eventId, status]);

    const stats = useMemo(() => {
        if (applications.total === 0) return "No applications";
        return `Showing ${applications.from ?? 0}–${applications.to ?? 0} of ${
            applications.total
        }`;
    }, [applications.from, applications.to, applications.total]);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Applications</h2>}
        >
            <Head title="Applications" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Applications</h1>
                        <p className="text-sm text-muted-foreground">{stats}</p>
                    </div>

                    <Link
                        href="/applications/create"
                        className={buttonVariants()}
                    >
                        Create Application
                    </Link>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full max-w-md items-center gap-2">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search applications..."
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

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                            className={selectClassName}
                            value={eventId}
                            onChange={(e) => setEventId(e.target.value)}
                        >
                            <option value="">All events</option>
                            {events.map((e) => (
                                <option key={e.event_id} value={e.event_id}>
                                    {e.event_name}
                                </option>
                            ))}
                        </select>

                        <select
                            className={selectClassName}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="rounded-lg border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Application Code
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Vendor
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Events
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Payment Status
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
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.data.map((application) => (
                                        <tr
                                            key={application.application_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {application.application_code}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {application.vendor
                                                    ?.vendor_name ?? ""}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {(application.events ?? [])
                                                    .map(
                                                        (e) =>
                                                            e.event
                                                                ?.event_name ??
                                                            "",
                                                    )
                                                    .filter(Boolean)
                                                    .join(", ")}
                                            </td>

                                            <td className="px-4 py-3">
                                                {application.order?.is_paid ===
                                                true ? (
                                                    <span className="text-emerald-800 ">
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span className="text-red-800">
                                                        Unpaid
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/applications/${application.application_id}`}
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
                        <Pagination links={applications.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
