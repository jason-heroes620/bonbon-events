import type { Event } from "@/types";
import "../../../css/home.css";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import axios from "axios";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import DOMPurify from "dompurify";
import PublicSiteLayout from "@/components/PublicSiteLayout";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type BoothStats = {
    totalBooths: number;
    occupiedBooths: number;
    unoccupiedBooths: number;
};

type EventDetailProps = {
    event: Event & { location?: { location_name?: string } | null };
    events: Pick<
        Event,
        | "event_id"
        | "event_name"
        | "event_date"
        | "event_time"
        | "venue"
        | "event_image"
        | "event_start_date"
        | "event_end_date"
        | "event_description"
    >[];
    images: string[];
    boothStats: BoothStats;
};

type DraftRow = {
    event_id: string;
    participants: number;
    no_of_booths: number;
    requirements: string;
    plug: boolean;
};

const selectClassName =
    "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm";

export default function EventDetail({
    event,
    events,
    images,
    boothStats,
}: EventDetailProps) {
    const page = usePage();
    const authUser = (page.props as any)?.auth?.user as
        | { user_id: string; name?: string; role?: string }
        | undefined;

    const isLoggedIn = useMemo(() => Boolean(authUser), [authUser]);
    const isVendorLoggedIn = !!authUser?.user_id && authUser?.role === "vendor";

    const [carouselIndex, setCarouselIndex] = useState(0);
    const [applyOpen, setApplyOpen] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [draft, setDraft] = useState<DraftRow>({
        event_id: event.event_id,
        participants: 1,
        no_of_booths: 1,
        requirements: "",
        plug: false,
    });
    const [rows, setRows] = useState<DraftRow[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const selectedEvent = useMemo(() => {
        return events.find((e) => e.event_id === draft.event_id) ?? null;
    }, [events, draft.event_id]);

    const sanitizedDescriptionHtml = useMemo(() => {
        const raw = event.event_description ?? "";
        if (raw.trim() === "") return "";
        return DOMPurify.sanitize(raw);
    }, [event.event_description]);

    const canSubmit = rows.length > 0 && agreeTerms && !submitting;

    const currentImage =
        images[carouselIndex] ?? images[0] ?? "/empty_image.png";

    const goPrev = () => {
        setCarouselIndex((prev) => {
            const count = images.length || 1;
            return (prev - 1 + count) % count;
        });
    };

    const goNext = () => {
        setCarouselIndex((prev) => {
            const count = images.length || 1;
            return (prev + 1) % count;
        });
    };

    const handleAdd = () => {
        if (!draft.event_id) return;
        if (draft.participants < 1 || draft.no_of_booths < 1) return;

        const exists = rows.some((r) => r.event_id === draft.event_id);
        if (exists) {
            toast.error("This event is already in the table.");
            return;
        }

        setRows((prev) => [
            ...prev,
            {
                ...draft,
                requirements: draft.requirements.trim(),
            },
        ]);
    };

    const handleRemove = (eventId: string) => {
        setRows((prev) => prev.filter((r) => r.event_id !== eventId));
    };

    const handleSubmit = async () => {
        if (!isVendorLoggedIn) {
            toast.error("Please log in with a vendor account to apply.");
            return;
        }

        if (!canSubmit) return;

        const confirmed = window.confirm(
            `Confirm submit application for ${rows.length} event(s)?`,
        );
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const payload = {
                events: rows.map((r) => ({
                    event_id: r.event_id,
                    participants: r.participants,
                    no_of_booths: r.no_of_booths,
                    requirements:
                        r.requirements.trim() === ""
                            ? null
                            : r.requirements.trim(),
                    plug: r.plug,
                })),
                agree_terms: true,
            };

            const result = await axios.post(
                "/events/participate-multi",
                payload,
            );
            const applicationCode = result?.data?.application_code as
                | string
                | undefined;

            setApplyOpen(false);
            setRows([]);
            setAgreeTerms(false);
            router.visit(`/payments/${applicationCode}`);
        } catch (err: any) {
            const status = err?.response?.status;
            const validationErrors = err?.response?.data?.errors as
                | Record<string, string[]>
                | undefined;
            const firstValidationMessage = validationErrors
                ? Object.values(validationErrors)
                      .flat()
                      .find((value) => typeof value === "string")
                : undefined;
            const message =
                firstValidationMessage ??
                err?.response?.data?.message ??
                "Failed to submit application.";

            if (status === 401 || status === 403) {
                toast.error("Please log in with a vendor account to apply.");
                router.visit("/vendor/login");
            } else if (status === 409 || status === 422) {
                toast.error(message);
            } else {
                toast.error(message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const locationName = (event as any)?.location?.location_name ?? "-";

    return (
        <>
            <Head title={event.event_name} />
            <Toaster />

            <PublicSiteLayout loginDescription="Please log in before applying to events.">
                {({ openLoginModal }) => (
                    <div className="mx-auto max-w-3xl p-4 space-y-4">
                        <div className="flex flex-col space-y-6">
                            <div>
                                <Link
                                    type="button"
                                    href="/"
                                    className={buttonVariants({
                                        variant: "default",
                                        size: "sm",
                                    })}
                                >
                                    Back
                                </Link>
                            </div>
                            <div className="flex rounded-lg bg-white">
                                <div className="relative h-auto w-full">
                                    <img
                                        src={currentImage}
                                        alt={event.event_name}
                                        className="h-full w-full object-cover"
                                    />
                                    {images.length > 1 ? (
                                        <div className="absolute inset-0 flex items-center justify-between px-3">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={goPrev}
                                            >
                                                Prev
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={goNext}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
                                <div className="gap-4 rounded-lg border bg-white p-4 md:col-span-2">
                                    <div className="flex flex-col md:grid md:grid-cols-2">
                                        <div className="col-span-2 items-start justify-between gap-3">
                                            <span className="text-xl font-semibold">
                                                {event.event_name}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="font-medium">
                                                Date:
                                            </span>{" "}
                                            {event.event_date}
                                        </div>
                                        <div>
                                            <span className="font-medium">
                                                Time:
                                            </span>{" "}
                                            {event.event_time}
                                        </div>
                                        <div>
                                            <span className="font-medium">
                                                Location:
                                            </span>{" "}
                                            {locationName}
                                        </div>
                                        <div>
                                            <span className="font-medium">
                                                Venue:
                                            </span>{" "}
                                            {event.venue ?? "-"}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <a
                                                href={`/events/${event.event_id}/layout-overview`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={buttonVariants({
                                                    variant: "default",
                                                    size: "sm",
                                                })}
                                            >
                                                View layout
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-3 rounded-lg border bg-white p-4 md:col-span-1">
                                    <div className="text-sm text-muted-foreground">
                                        Booths
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Total</span>
                                            <span className="font-semibold">
                                                {boothStats.totalBooths}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Available</span>
                                            <span className="font-semibold">
                                                {boothStats.unoccupiedBooths}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Occupied</span>
                                            <span className="font-semibold">
                                                {boothStats.occupiedBooths}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex overflow-hidden rounded-lg border bg-white">
                            <div className="space-y-3 p-4">
                                <div>
                                    <span className="text-lg font-medium">
                                        Description
                                    </span>
                                </div>
                                {sanitizedDescriptionHtml !== "" ? (
                                    <div
                                        className="rich-text text-sm"
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizedDescriptionHtml,
                                        }}
                                    />
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        -
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <Button
                                type="button"
                                onClick={() => {
                                    if (!isLoggedIn) {
                                        openLoginModal();
                                        return;
                                    }
                                    setApplyOpen(true);
                                }}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                )}
            </PublicSiteLayout>

            <Dialog
                open={applyOpen}
                onOpenChange={(next) => {
                    if (submitting) return;
                    setApplyOpen(next);
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Apply for Events</DialogTitle>
                        <div className="text-sm text-muted-foreground">
                            Add one or more events into the table, then apply.
                        </div>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="space-y-3 rounded-lg border bg-white p-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">
                                    Event
                                </label>
                                <select
                                    className={selectClassName}
                                    value={draft.event_id}
                                    disabled={submitting}
                                    onChange={(e) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            event_id: e.target.value,
                                        }))
                                    }
                                >
                                    {events.map((e) => (
                                        <option
                                            key={e.event_id}
                                            value={e.event_id}
                                        >
                                            {e.event_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        No. of Participants
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={selectClassName}
                                        value={draft.participants}
                                        disabled={submitting}
                                        onChange={(e) =>
                                            setDraft((prev) => ({
                                                ...prev,
                                                participants: Number(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        No. of Booths
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={selectClassName}
                                        value={draft.no_of_booths}
                                        disabled={submitting}
                                        onChange={(e) =>
                                            setDraft((prev) => ({
                                                ...prev,
                                                no_of_booths: Number(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">
                                    Requirements
                                </label>
                                <textarea
                                    className={cn(selectClassName, "h-20")}
                                    value={draft.requirements}
                                    disabled={submitting}
                                    onChange={(e) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            requirements: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={draft.plug}
                                    disabled={submitting}
                                    onChange={(e) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            plug: e.target.checked,
                                        }))
                                    }
                                />
                                Require Plug Point
                            </label>

                            <div className="flex items-center justify-between gap-2">
                                <div className="text-xs text-muted-foreground">
                                    Selected: {selectedEvent?.event_name ?? "-"}
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleAdd}
                                    disabled={submitting}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3 rounded-lg border bg-white p-3">
                            <div className="text-sm font-medium">
                                Application Table
                            </div>
                            <div className="overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="py-2 pr-2">Event</th>
                                            <th className="py-2 pr-2">
                                                Participants
                                            </th>
                                            <th className="py-2 pr-2">
                                                Booths
                                            </th>
                                            <th className="py-2 pr-2">Plug</th>
                                            <th className="py-2 pr-2">
                                                Requirements
                                            </th>
                                            <th className="py-2 pr-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-3 text-muted-foreground"
                                                >
                                                    No rows added yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((r) => {
                                                const rowEvent =
                                                    events.find(
                                                        (e) =>
                                                            e.event_id ===
                                                            r.event_id,
                                                    ) ?? null;
                                                return (
                                                    <tr
                                                        key={r.event_id}
                                                        className="border-b"
                                                    >
                                                        <td className="py-2 pr-2">
                                                            {rowEvent?.event_name ??
                                                                "-"}
                                                        </td>
                                                        <td className="py-2 pr-2">
                                                            {r.participants}
                                                        </td>
                                                        <td className="py-2 pr-2">
                                                            {r.no_of_booths}
                                                        </td>
                                                        <td className="py-2 pr-2">
                                                            {r.plug
                                                                ? "Yes"
                                                                : "No"}
                                                        </td>
                                                        <td className="py-2 pr-2">
                                                            {r.requirements.trim() ===
                                                            ""
                                                                ? "-"
                                                                : r.requirements}
                                                        </td>
                                                        <td className="py-2 pr-2 text-right">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemove(
                                                                        r.event_id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    submitting
                                                                }
                                                            >
                                                                Remove
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={agreeTerms}
                                    disabled={submitting}
                                    onChange={(e) =>
                                        setAgreeTerms(e.target.checked)
                                    }
                                />
                                I agree to the{" "}
                                <a href="/terms-of-service">terms of service</a>
                                .
                            </label>
                        </div>
                    </div>

                    {submitting ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Submitting application...
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setApplyOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                        >
                            {submitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Submitting...
                                </span>
                            ) : (
                                "Apply"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
