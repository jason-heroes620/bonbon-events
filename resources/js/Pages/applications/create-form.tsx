import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import type { Category, Event, Vendor } from "@/types";
import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Delete, DeleteIcon, X } from "lucide-react";

type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled";

type CreateApplicationEventRow = {
    event_id: string;
    participants: number;
    no_of_booths: number;
    requirements: string;
    plug: boolean;
};

type CreateApplicationFormData = {
    vendor_id: string;
    category: string;
    application_status: ApplicationStatus;
    events: CreateApplicationEventRow[];
};

type CreateApplicationFormProps = {
    events: Pick<Event, "event_id" | "event_name" | "require_deposit">[];
    vendors: Pick<
        Vendor,
        | "vendor_id"
        | "vendor_name"
        | "vendor_contact_person"
        | "vendor_contact_no"
        | "vendor_email"
        | "business_registration_no"
        | "business_description"
        | "category"
        | "social_medias"
        | "vendor_bank_name"
        | "vendor_bank_account_no"
        | "vendor_bank_account_name"
    >[];
    categories: Pick<Category, "category_id" | "category_name">[];
    submitUrl: string;
    cancelUrl: string;
};

const textareaClassName =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function CreateApplicationForm({
    events,
    vendors,
    categories,
    submitUrl,
    cancelUrl,
}: CreateApplicationFormProps) {
    const [showVendorModal, setShowVendorModal] = useState(false);

    const eventById = useMemo(() => {
        const map = new Map<string, CreateApplicationFormProps["events"][0]>();
        for (const event of events) {
            map.set(event.event_id, event);
        }
        return map;
    }, [events]);

    const categoryLabelById = useMemo(() => {
        const map = new Map<string, string>();
        for (const category of categories) {
            map.set(category.category_id, category.category_name);
        }
        return map;
    }, [categories]);

    const vendorById = useMemo(() => {
        const map = new Map<string, CreateApplicationFormProps["vendors"][0]>();
        for (const vendor of vendors) {
            map.set(vendor.vendor_id, vendor);
        }
        return map;
    }, [vendors]);

    const form = useForm<CreateApplicationFormData>({
        vendor_id: "",
        category: "",
        application_status: "pending",
        events: [],
    });

    const selectedVendor = useMemo(() => {
        return vendorById.get(form.data.vendor_id) ?? null;
    }, [form.data.vendor_id, vendorById]);

    const selectedEventIds = useMemo(() => {
        return form.data.events.map((row) => row.event_id);
    }, [form.data.events]);

    const vendorCategoryText = useMemo(() => {
        const raw = selectedVendor?.category;
        const ids = Array.isArray(raw)
            ? raw
            : typeof raw === "string" && raw !== ""
              ? raw
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean)
              : [];
        const labels = ids.map((id) => categoryLabelById.get(id) ?? id);
        return labels.join(", ");
    }, [selectedVendor?.category, categoryLabelById]);

    const vendorSocialMedias = useMemo(() => {
        const raw = selectedVendor?.social_medias;
        if (!raw || typeof raw !== "object") return null;
        return raw as Record<string, unknown>;
    }, [selectedVendor?.social_medias]);

    const onVendorChange = (vendorId: string) => {
        form.setData("vendor_id", vendorId);
        const v = vendorById.get(vendorId);
        const raw = v?.category;
        const categoryValue = Array.isArray(raw)
            ? raw.join(",")
            : typeof raw === "string"
              ? raw
              : "";
        form.setData("category", categoryValue);
    };

    const onEventsChange = (eventIds: string[]) => {
        const existingByEventId = new Map(
            form.data.events.map((row) => [row.event_id, row] as const),
        );

        const nextRows: CreateApplicationEventRow[] = eventIds.map(
            (eventId) => {
                const existing = existingByEventId.get(eventId);
                if (existing) return existing;
                return {
                    event_id: eventId,
                    participants: 1,
                    no_of_booths: 1,
                    requirements: "",
                    plug: true,
                };
            },
        );

        form.setData("events", nextRows);
    };

    const getRowIndexByEventId = (eventId: string) => {
        return form.data.events.findIndex((row) => row.event_id === eventId);
    };

    const getRowError = (
        eventId: string,
        field: keyof Omit<CreateApplicationEventRow, "event_id">,
    ) => {
        const index = getRowIndexByEventId(eventId);
        if (index < 0) return null;
        const key = `events.${index}.${field}`;
        return (form.errors as Record<string, string | undefined>)[key] ?? null;
    };

    const updateRow = (
        eventId: string,
        patch: Partial<Omit<CreateApplicationEventRow, "event_id">>,
    ) => {
        form.setData(
            "events",
            form.data.events.map((row) =>
                row.event_id === eventId ? { ...row, ...patch } : row,
            ),
        );
    };

    const removeRow = (eventId: string) => {
        const nextIds = selectedEventIds.filter((id) => id !== eventId);
        onEventsChange(nextIds);
    };

    const submit = (e: any) => {
        e.preventDefault();
        form.clearErrors();

        form.post(submitUrl, {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 md:items-end">
                <div className="space-y-2">
                    <label htmlFor="vendor_id" className="text-sm font-medium">
                        Vendor
                    </label>
                    <select
                        id="vendor_id"
                        className={selectClassName}
                        value={form.data.vendor_id}
                        onChange={(e) => onVendorChange(e.target.value)}
                    >
                        <option value="" disabled>
                            Select a vendor
                        </option>
                        {vendors.map((vendor) => (
                            <option
                                key={vendor.vendor_id}
                                value={vendor.vendor_id}
                            >
                                {vendor.vendor_name}
                            </option>
                        ))}
                    </select>
                    {form.errors.vendor_id ? (
                        <p className="text-sm text-destructive">
                            {form.errors.vendor_id}
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!selectedVendor}
                        onClick={() => setShowVendorModal(true)}
                    >
                        View vendor
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Events</label>
                <MultiSelect
                    options={events.map((event) => ({
                        label: event.event_name,
                        value: event.event_id,
                    }))}
                    onValueChange={onEventsChange}
                    defaultValue={selectedEventIds}
                    placeholder={
                        selectedVendor
                            ? "Select events"
                            : "Select a vendor first"
                    }
                    variant="default"
                    maxSelected={events.length}
                    maxCount={3}
                    disabled={!selectedVendor}
                    aria-invalid={Boolean((form.errors as any).events)}
                />
                {(form.errors as any).events ? (
                    <p className="text-sm text-destructive">
                        {(form.errors as any).events}
                    </p>
                ) : null}
            </div>

            <div className="space-y-2">
                <div className="text-sm font-medium">Event Details</div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">
                                    Event
                                </th>
                                <th className="px-3 py-2 text-left font-medium">
                                    Participants
                                </th>
                                <th className="px-3 py-2 text-left font-medium">
                                    No. of Booths
                                </th>
                                <th className="px-3 py-2 text-left font-medium">
                                    Requirements
                                </th>
                                <th className="px-3 py-2 text-left font-medium">
                                    Plug
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {form.data.events.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-3 py-4 text-muted-foreground"
                                        colSpan={6}
                                    >
                                        Select one or more events to fill in the
                                        details.
                                    </td>
                                </tr>
                            ) : (
                                form.data.events.map((row) => {
                                    const eventName =
                                        eventById.get(row.event_id)
                                            ?.event_name ?? row.event_id;
                                    const participantsError = getRowError(
                                        row.event_id,
                                        "participants",
                                    );
                                    const boothsError = getRowError(
                                        row.event_id,
                                        "no_of_booths",
                                    );
                                    const requirementsError = getRowError(
                                        row.event_id,
                                        "requirements",
                                    );
                                    const plugError = getRowError(
                                        row.event_id,
                                        "plug",
                                    );

                                    return (
                                        <tr
                                            key={row.event_id}
                                            className="border-t"
                                        >
                                            <td className="px-3 py-2 align-top">
                                                <div className="font-medium">
                                                    {eventName}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={127}
                                                    value={row.participants}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            row.event_id,
                                                            {
                                                                participants:
                                                                    Number(
                                                                        e.target
                                                                            .value ||
                                                                            0,
                                                                    ),
                                                            },
                                                        )
                                                    }
                                                />
                                                {participantsError ? (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {participantsError}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={127}
                                                    value={row.no_of_booths}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            row.event_id,
                                                            {
                                                                no_of_booths:
                                                                    Number(
                                                                        e.target
                                                                            .value ||
                                                                            0,
                                                                    ),
                                                            },
                                                        )
                                                    }
                                                />
                                                {boothsError ? (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {boothsError}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <textarea
                                                    className={
                                                        textareaClassName
                                                    }
                                                    value={row.requirements}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            row.event_id,
                                                            {
                                                                requirements:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    rows={2}
                                                />
                                                {requirementsError ? (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {requirementsError}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <select
                                                    className={selectClassName}
                                                    value={row.plug ? "1" : "0"}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            row.event_id,
                                                            {
                                                                plug:
                                                                    e.target
                                                                        .value ===
                                                                    "1",
                                                            },
                                                        )
                                                    }
                                                >
                                                    <option value="0">
                                                        No
                                                    </option>
                                                    <option value="1">
                                                        Yes
                                                    </option>
                                                </select>
                                                {plugError ? (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {plugError}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2 align-top text-right">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeRow(row.event_id)
                                                    }
                                                >
                                                    <X color="red" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end">
                {/* <div className="space-y-2 md:col-span-2">
                    <label
                        htmlFor="application_status"
                        className="text-sm font-medium"
                    >
                        Status
                    </label>
                    <select
                        id="application_status"
                        className={selectClassName}
                        value={form.data.application_status}
                        onChange={(e) =>
                            form.setData(
                                "application_status",
                                e.target.value as ApplicationStatus,
                            )
                        }
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div> */}

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.get(cancelUrl)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={
                            form.processing ||
                            !selectedVendor ||
                            form.data.events.length === 0
                        }
                    >
                        Create
                    </Button>
                </div>
            </div>

            <Dialog open={showVendorModal} onOpenChange={setShowVendorModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Vendor Detail</DialogTitle>
                    </DialogHeader>

                    {!selectedVendor ? (
                        <div className="text-sm text-muted-foreground">
                            No vendor selected.
                        </div>
                    ) : (
                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="font-medium">
                                    {selectedVendor.vendor_name}
                                </div>
                                <div className="text-muted-foreground">
                                    {selectedVendor.business_registration_no ??
                                        "-"}
                                </div>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                                <div>
                                    <div className="text-muted-foreground">
                                        Contact Person
                                    </div>
                                    <div>
                                        {selectedVendor.vendor_contact_person ??
                                            "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Contact No
                                    </div>
                                    <div>
                                        {selectedVendor.vendor_contact_no ??
                                            "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Email
                                    </div>
                                    <div>
                                        {selectedVendor.vendor_email ?? "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Category
                                    </div>
                                    <div>{vendorCategoryText || "-"}</div>
                                </div>
                            </div>

                            <div>
                                <div className="text-muted-foreground">
                                    Business Description
                                </div>
                                <div>
                                    {selectedVendor.business_description ?? "-"}
                                </div>
                            </div>

                            {vendorSocialMedias ? (
                                <div>
                                    <div className="text-muted-foreground">
                                        Social Medias
                                    </div>
                                    <div className="space-y-1">
                                        {Object.entries(vendorSocialMedias).map(
                                            ([k, v]) => (
                                                <div key={k}>
                                                    <span className="font-medium">
                                                        {k}:
                                                    </span>{" "}
                                                    {String(v)}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            <div className="grid gap-2 md:grid-cols-2">
                                <div>
                                    <div className="text-muted-foreground">
                                        Bank Name
                                    </div>
                                    <div>
                                        {selectedVendor.vendor_bank_name ?? "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Account Name
                                    </div>
                                    <div>
                                        {selectedVendor.vendor_bank_account_name ??
                                            "-"}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="text-muted-foreground">
                                        Account No
                                    </div>
                                    <div>
                                        {selectedVendor.vendor_bank_account_no ??
                                            "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowVendorModal(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    );
}
