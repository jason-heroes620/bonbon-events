import GuestLayout from "@/Layouts/GuestLayout";
import { Head } from "@inertiajs/react";
import { useEffect, useState } from "react";

type LayoutImage = {
    event_layout_image_id: string;
    image_path: string;
    sort_order: number;
};

type LayoutEvent = {
    event_id: string;
    event_name: string;
    primary_layout_image: string | null;
    event_layout_images: LayoutImage[];
};

type BoothRow = {
    booth_id: string;
    booth_name: string;
    occupied: boolean;
    vendor_name: string | null;
    booth_description: string | null;
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
    const [selectedLayoutUrl, setSelectedLayoutUrl] = useState<string>(
        event.primary_layout_image ??
            event.event_layout_images[0]?.image_path ??
            "",
    );

    useEffect(() => {
        setSelectedLayoutUrl(
            event.primary_layout_image ??
                event.event_layout_images[0]?.image_path ??
                "",
        );
    }, [event.event_layout_images, event.primary_layout_image]);

    return (
        <GuestLayout className="container mx-auto max-w-6xl">
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

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-lg border bg-white p-4 col-span-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">
                                Booth Layout Images
                            </div>
                            {selectedLayoutUrl ? (
                                <a
                                    href={selectedLayoutUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Open image
                                </a>
                            ) : null}
                        </div>

                        <div className="mt-3">
                            {selectedLayoutUrl ? (
                                <div className="space-y-3">
                                    <img
                                        src={selectedLayoutUrl}
                                        alt={`${event.event_name} booth layout`}
                                        className="w-full rounded border object-contain"
                                    />

                                    {event.event_layout_images.length > 1 ? (
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {event.event_layout_images.map(
                                                (image) => (
                                                    <button
                                                        key={
                                                            image.event_layout_image_id
                                                        }
                                                        type="button"
                                                        className="overflow-hidden rounded border"
                                                        onClick={() =>
                                                            setSelectedLayoutUrl(
                                                                image.image_path,
                                                            )
                                                        }
                                                    >
                                                        <img
                                                            src={
                                                                image.image_path
                                                            }
                                                            alt="Booth layout thumbnail"
                                                            className="h-24 w-full object-cover"
                                                        />
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No booth layout images uploaded for this
                                    event.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-4 col-span-2">
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
                                                        <th className="px-3 py-2 text-left font-medium">
                                                            Description
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
                                                                <td className="px-3 py-2 whitespace-pre-wrap">
                                                                    {
                                                                        booth.booth_description
                                                                    }
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
