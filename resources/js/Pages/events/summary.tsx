import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type EventOption = {
    event_id: string;
    event_name: string;
    event_start_date: string;
    event_booth_layout: string | null;
};

type BoothRow = {
    booth_id: string;
    booth_name: string;
    occupied: boolean;
    vendor_name: string | null;
    application_id?: string | null;
    is_paid?: boolean | null;
};

type BoothGroup = {
    booth_type_id: string;
    booth_type_name: string;
    booths: BoothRow[];
};

type EventSummaryPageProps = {
    events: EventOption[];
    selectedEventId: string | null;
    groups: BoothGroup[];
};

const selectClassName =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function EventSummary({
    events,
    selectedEventId,
    groups,
}: EventSummaryPageProps) {
    const [eventId, setEventId] = useState(selectedEventId ?? "");

    const selectedEvent = useMemo(() => {
        return events.find((e) => e.event_id === eventId) ?? null;
    }, [events, eventId]);

    const boothLayoutUrl = selectedEvent?.event_booth_layout ?? "";

    const stats = useMemo(() => {
        const allBooths = groups.flatMap((g) => g.booths);
        const totalBooths = allBooths.length;
        const totalOccupied = allBooths.filter((b) => b.occupied).length;
        const totalAvailable = totalBooths - totalOccupied;
        const byCategory = groups.map((g) => ({
            booth_type_id: g.booth_type_id,
            booth_type_name: g.booth_type_name,
            total: g.booths.length,
        }));

        return {
            totalBooths,
            totalOccupied,
            totalAvailable,
            byCategory,
        };
    }, [groups]);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Event Summary</h2>}
        >
            <Head title="Event Summary" />

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
                                        {event.event_name}{" "}
                                        {event.event_start_date
                                            ? `(${format(
                                                  new Date(
                                                      event.event_start_date,
                                                  ),
                                                  "MMM d, yyyy",
                                              )})`
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                disabled={!eventId}
                                onClick={() => {
                                    router.get(
                                        "/events/summary",
                                        { event_id: eventId },
                                        {
                                            preserveScroll: true,
                                            preserveState: true,
                                            replace: true,
                                        },
                                    );
                                }}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-row items-center gap-1">
                        <div>
                            {boothLayoutUrl ? (
                                <div>
                                    <a
                                        href={boothLayoutUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold underline"
                                    >
                                        view
                                    </a>
                                    <span className="text-sm">
                                        {" "}
                                        booth layout
                                    </span>
                                </div>
                            ) : (
                                ""
                            )}
                        </div>
                    </div>
                </div>

                {groups.length === 0 ? (
                    <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
                        No booths found for this event.
                    </div>
                ) : null}

                {!groups ? (
                    <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
                        Select an event and click Apply to view booth occupancy.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-white p-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="flex flex-row justify-between items-center gap-2 rounded-md border bg-muted/10 p-3">
                                    <div className="text-xs text-muted-foreground">
                                        Total Booth
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {stats.totalBooths}
                                    </div>
                                </div>
                                <div className="flex flex-row justify-between items-center gap-2 rounded-md border bg-muted/10 p-3">
                                    <div className="text-xs text-muted-foreground">
                                        Total Occupied
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {stats.totalOccupied}
                                    </div>
                                </div>
                                <div className="flex flex-row justify-between items-center gap-2 rounded-md border bg-muted/10 p-3">
                                    <div className="text-xs text-muted-foreground">
                                        Total Available
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {stats.totalAvailable}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="text-sm font-medium">
                                    Total Booth by Category
                                </div>
                                <div className="mt-2 flex flex-col gap-2 md:flex-row md:flex-wrap">
                                    {stats.byCategory.map((c) => (
                                        <div
                                            key={c.booth_type_id}
                                            className="rounded-full border bg-background px-3 py-1 text-sm"
                                        >
                                            {c.booth_type_name}: {c.total}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                            {groups.map((group) => (
                                <div
                                    key={group.booth_type_id}
                                    className="rounded-lg border bg-white"
                                >
                                    <div className="border-b px-4 py-3">
                                        <div className="text-sm font-semibold">
                                            {group.booth_type_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {group.booths.length} booth(s)
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {group.booths.map((booth) => (
                                            <div
                                                key={booth.booth_id}
                                                className="px-4 py-3 flex flex-col gap-1"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="text-sm font-medium">
                                                        {booth.booth_name}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                                booth.occupied
                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                    : "bg-gray-100 text-gray-800",
                                                            )}
                                                        >
                                                            {booth.occupied
                                                                ? "Occupied"
                                                                : "Available"}
                                                        </span>
                                                        {booth.occupied ? (
                                                            <span
                                                                className={cn(
                                                                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                                    booth.is_paid
                                                                        ? "bg-emerald-100 text-emerald-800"
                                                                        : "bg-amber-100 text-amber-800",
                                                                )}
                                                            >
                                                                {booth.is_paid
                                                                    ? "Paid"
                                                                    : "Unpaid"}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    {booth.vendor_name
                                                        ? booth.vendor_name
                                                        : "-"}

                                                    {booth.occupied &&
                                                    booth.application_id ? (
                                                        <div className="text-xs">
                                                            <Link
                                                                href={`/applications/${booth.application_id}`}
                                                                className="underline"
                                                            >
                                                                Application
                                                            </Link>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
