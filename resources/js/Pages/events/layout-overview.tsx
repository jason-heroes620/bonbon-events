import GuestLayout from "@/Layouts/GuestLayout";
import { Head } from "@inertiajs/react";

type LayoutEvent = {
    event_id: string;
    event_name: string;
    event_booth_layout: string | null;
};

type BoothRow = {
    booth_id: string;
    booth_name: string;
    occupied: boolean;
    vendor_name: string | null;
};

type BoothGroup = {
    booth_type_id: string;
    booth_type_name: string;
    booths: BoothRow[];
};

type LayoutOverviewProps = {
    event: LayoutEvent;
    groups: BoothGroup[];
};

export default function LayoutOverview({ event, groups }: LayoutOverviewProps) {
    const layoutUrl = event.event_booth_layout ?? "";

    return (
        <GuestLayout className="container mx-auto max-w-5xl">
            <Head title={`Layout Overview - ${event.event_name}`} />

            <div className="space-y-4">
                <div className="rounded-lg border bg-white p-4">
                    <div className="text-lg font-semibold">
                        {event.event_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Event booth layout and occupancy list
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border bg-white p-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">
                                Booth Layout Image
                            </div>
                            {layoutUrl ? (
                                <a
                                    href={layoutUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Open image
                                </a>
                            ) : null}
                        </div>

                        <div className="mt-3">
                            {layoutUrl ? (
                                <img
                                    src={layoutUrl}
                                    alt={`${event.event_name} booth layout`}
                                    className="w-full rounded border object-contain"
                                />
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No booth layout image uploaded for this
                                    event.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm font-medium">
                            Occupancy List
                        </div>

                        {groups.length === 0 ? (
                            <div className="mt-3 text-sm text-muted-foreground">
                                No booths found for this event.
                            </div>
                        ) : (
                            <div className="mt-3 space-y-4">
                                {groups.map((group) => (
                                    <div
                                        key={group.booth_type_id}
                                        className="rounded border"
                                    >
                                        <div className="border-b bg-muted/40 px-3 py-2 text-sm font-semibold">
                                            {group.booth_type_name}
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="border-b">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-medium">
                                                            Booth
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-medium">
                                                            Vendor
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.booths
                                                        .sort((a, b) =>
                                                            a.booth_name.localeCompare(
                                                                b.booth_name,
                                                                undefined,
                                                                {
                                                                    numeric: true,
                                                                    sensitivity:
                                                                        "base",
                                                                },
                                                            ),
                                                        )
                                                        .map((booth) => (
                                                            <tr
                                                                key={
                                                                    booth.booth_id
                                                                }
                                                                className="border-b last:border-b-0"
                                                            >
                                                                <td className="px-3 py-2">
                                                                    {
                                                                        booth.booth_name
                                                                    }
                                                                </td>
                                                                <td className="px-3 py-2 text-muted-foreground">
                                                                    {booth.occupied
                                                                        ? (booth.vendor_name ??
                                                                          "-")
                                                                        : "-"}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
