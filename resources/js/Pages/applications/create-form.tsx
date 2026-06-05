import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category, Event, Vendor } from "@/types";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled";

type CreateApplicationFormData = {
    event_id: string;
    vendor_id: string;
    participants: number;
    no_of_booths: number;
    category: string;
    requirements: string;
    plug: boolean;
    application_status: ApplicationStatus;
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
        event_id: "",
        vendor_id: "",
        participants: 1,
        no_of_booths: 1,
        category: "",
        requirements: "",
        plug: false,
        application_status: "pending",
    });

    const selectedVendor = useMemo(() => {
        return vendorById.get(form.data.vendor_id) ?? null;
    }, [form.data.vendor_id, vendorById]);

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

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.clearErrors();

        form.post(submitUrl, {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="event_id" className="text-sm font-medium">
                        Event
                    </label>
                    <select
                        id="event_id"
                        className={selectClassName}
                        value={form.data.event_id}
                        onChange={(e) =>
                            form.setData("event_id", e.target.value)
                        }
                    >
                        <option value="" disabled>
                            Select an event
                        </option>
                        {events.map((event) => (
                            <option key={event.event_id} value={event.event_id}>
                                {event.event_name}
                            </option>
                        ))}
                    </select>
                    {form.errors.event_id ? (
                        <p className="text-sm text-destructive">
                            {form.errors.event_id}
                        </p>
                    ) : null}
                </div>

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
                    {form.errors.vendor_id ? (
                        <p className="text-sm text-destructive">
                            {form.errors.vendor_id}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label
                        htmlFor="participants"
                        className="text-sm font-medium"
                    >
                        Participants
                    </label>
                    <Input
                        id="participants"
                        type="number"
                        min={1}
                        max={127}
                        value={form.data.participants}
                        onChange={(e) =>
                            form.setData(
                                "participants",
                                Number(e.target.value || 0),
                            )
                        }
                    />
                    {form.errors.participants ? (
                        <p className="text-sm text-destructive">
                            {form.errors.participants}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="no_of_booths"
                        className="text-sm font-medium"
                    >
                        No. of Booths
                    </label>
                    <Input
                        id="no_of_booths"
                        type="number"
                        min={1}
                        max={127}
                        value={form.data.no_of_booths}
                        onChange={(e) =>
                            form.setData(
                                "no_of_booths",
                                Number(e.target.value || 0),
                            )
                        }
                    />
                    {form.errors.no_of_booths ? (
                        <p className="text-sm text-destructive">
                            {form.errors.no_of_booths}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="requirements" className="text-sm font-medium">
                    Requirements
                </label>
                <textarea
                    id="requirements"
                    className={textareaClassName}
                    value={form.data.requirements}
                    onChange={(e) =>
                        form.setData("requirements", e.target.value)
                    }
                    rows={4}
                />
                {form.errors.requirements ? (
                    <p className="text-sm text-destructive">
                        {form.errors.requirements}
                    </p>
                ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:items-end">
                <div className="space-y-2">
                    <label htmlFor="plug" className="text-sm font-medium">
                        Plug
                    </label>
                    <select
                        id="plug"
                        className={selectClassName}
                        value={form.data.plug ? "1" : "0"}
                        onChange={(e) =>
                            form.setData("plug", e.target.value === "1")
                        }
                    >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                    </select>
                </div>

                <div className="space-y-2">
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
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.get(cancelUrl)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={form.processing}>
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
