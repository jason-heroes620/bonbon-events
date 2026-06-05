import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Application, Category, Event, Vendor } from "@/types";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import type {
    MultiSelectGroup,
    MultiSelectOption,
} from "@/components/ui/multi-select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled";

type ApplicationFormData = {
    event_id: string;
    participants: number;
    no_of_booths: number;
    requirements: string;
    plug: boolean;
    monday_id: number;
    application_status: ApplicationStatus;
};

type ApplicationEventBooth = {
    event_booth_id: string;
    booth_id: string;
    booth_price: number | string;
    occupied: boolean;
    booth_name: string;
    booth_type_id: string;
    booth_type_name: string;
};

type ApplicationOrder = {
    order_id: string;
    order_no: string;
    total_price: number | string;
    discount_price: number | string;
    is_paid: boolean;
    created_at: Date;
};

type ApplicationInvoice = {
    invoice_id: string;
    invoice_no: string;
    invoice_status: string;
    invoice_amount: number | string;
};

type ApplicationFormProps = {
    application?: Application;
    event: Pick<Event, "event_id" | "event_name" | "require_deposit">;
    vendor: Pick<
        Vendor,
        | "vendor_id"
        | "vendor_name"
        | "vendor_contact_person"
        | "vendor_contact_no"
        | "vendor_email"
        | "business_description"
        | "category"
        | "social_medias"
    >;
    categories?: Pick<Category, "category_id" | "category_name">[];
    eventBooths?: ApplicationEventBooth[];
    selectedEventBoothIds?: string[];
    order?: ApplicationOrder | null;
    invoice?: ApplicationInvoice | null;
    confirmBoothsUrl?: string;
    releaseBoothsUrl?: string;
    generateInvoiceUrl?: string;
    sendPaymentReminderUrl?: string;
    updateStatusUrl?: string;
    depositAmount?: number | string;
    submitUrl: string;
    method: "post" | "put";
    submitLabel: string;
    cancelUrl: string;
};

const textareaClassName =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function ApplicationForm({
    application,
    event,
    vendor,
    categories = [],
    eventBooths = [],
    selectedEventBoothIds = [],
    order = null,
    invoice = null,
    confirmBoothsUrl,
    releaseBoothsUrl,
    generateInvoiceUrl,
    sendPaymentReminderUrl,
    updateStatusUrl,
    depositAmount = 0,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: ApplicationFormProps) {
    const [showVendorModal, setShowVendorModal] = useState(false);

    const categoryLabelById = useMemo(() => {
        const map = new Map<string, string>();
        for (const category of categories) {
            map.set(category.category_id, category.category_name);
        }
        return map;
    }, [categories]);

    const vendorCategoryText = useMemo(() => {
        const raw = vendor.category;
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
    }, [vendor.category, categoryLabelById]);

    const vendorSocialMedias = useMemo(() => {
        const raw = vendor.social_medias;
        if (!raw || typeof raw !== "object") return null;
        return raw as Record<string, unknown>;
    }, [vendor.social_medias]);

    const form = useForm<ApplicationFormData>({
        event_id: application?.event_id ?? "",
        participants: application?.participants ?? 1,
        no_of_booths: application?.no_of_booths ?? 1,
        requirements: application?.requirements ?? "",
        plug: application?.plug ?? false,
        monday_id: application?.monday_id ?? 0,
        application_status: application?.application_status ?? "pending",
    });

    const boothsForm = useForm<{
        event_booth_ids: string[];
        discount_price: number;
    }>({
        event_booth_ids: selectedEventBoothIds,
        discount_price:
            typeof order?.discount_price === "number"
                ? order.discount_price
                : Number(order?.discount_price ?? 0),
    });

    const statusForm = useForm<{ application_status: ApplicationStatus }>({
        application_status: form.data.application_status,
    });

    const isApproved = form.data.application_status === "approved";

    const selectedEventBoothsById = useMemo(() => {
        const map = new Map<string, ApplicationEventBooth>();
        for (const booth of eventBooths) {
            map.set(booth.event_booth_id, booth);
        }
        return map;
    }, [eventBooths]);

    const boothOptions = useMemo(() => {
        const selectedSet = new Set(boothsForm.data.event_booth_ids);
        const groupsByType = new Map<string, MultiSelectOption[]>();

        for (const booth of eventBooths) {
            const options = groupsByType.get(booth.booth_type_name) ?? [];
            const disabled =
                booth.occupied && !selectedSet.has(booth.event_booth_id);
            options.push({
                value: booth.event_booth_id,
                label: `${booth.booth_name} - $${booth.booth_price}`,
                disabled,
            });
            groupsByType.set(booth.booth_type_name, options);
        }

        const groups: MultiSelectGroup[] = Array.from(
            groupsByType.entries(),
        ).map(([heading, options]) => ({
            heading,
            options,
        }));

        return groups;
    }, [eventBooths, boothsForm.data.event_booth_ids]);

    const selectedBoothRows = useMemo(() => {
        return boothsForm.data.event_booth_ids
            .map((id) => selectedEventBoothsById.get(id))
            .filter((v): v is ApplicationEventBooth => Boolean(v));
    }, [boothsForm.data.event_booth_ids, selectedEventBoothsById]);

    const selectedBoothTotal = useMemo(() => {
        return selectedBoothRows.reduce((sum, booth) => {
            const price =
                typeof booth.booth_price === "number"
                    ? booth.booth_price
                    : Number(booth.booth_price);
            return sum + (Number.isFinite(price) ? price : 0);
        }, 0);
    }, [selectedBoothRows]);

    const boothLimit = Math.max(0, Number(form.data.no_of_booths || 0));
    const boothSelectionDisabled = Boolean(order?.is_paid);
    const canConfirmBooths =
        Boolean(confirmBoothsUrl) &&
        Boolean(application?.application_id) &&
        isApproved &&
        !boothSelectionDisabled &&
        boothLimit > 0 &&
        boothsForm.data.event_booth_ids.length === boothLimit;

    const depositTotal = useMemo(() => {
        if (!event.require_deposit) return 0;
        const v =
            typeof depositAmount === "number"
                ? depositAmount
                : Number(depositAmount);
        return Number.isFinite(v) ? v : 0;
    }, [depositAmount, event.require_deposit]);

    const discountTotal = useMemo(() => {
        const v = Number(boothsForm.data.discount_price);
        return Number.isFinite(v) ? Math.max(0, v) : 0;
    }, [boothsForm.data.discount_price]);

    const applicationTotal = useMemo(() => {
        return depositTotal + selectedBoothTotal - discountTotal;
    }, [depositTotal, discountTotal, selectedBoothTotal]);

    const confirmBooths = () => {
        if (!confirmBoothsUrl) return;
        if (window.confirm("Confirm the booth selection?")) {
            boothsForm.post(confirmBoothsUrl, {
                onSuccess: () => {
                    toast.success("Booth updated.");
                },
                onError: () => {
                    toast.error("Error updating booth.");
                },
                preserveScroll: true,
            });
        }
    };

    const updateStatus = () => {
        if (!updateStatusUrl) return;
        statusForm.setData("application_status", form.data.application_status);

        if (
            window.confirm(
                `Confirm to update the application status to ${form.data.application_status}?`,
            )
        ) {
            statusForm.post(updateStatusUrl, {
                onSuccess: () => {
                    toast.success("Application updated.");
                },
                onError: () => {
                    toast.error("Error updating application.");
                },
                preserveScroll: true,
            });
        }
    };

    const generateInvoice = () => {
        if (!generateInvoiceUrl) return;

        if (Boolean(invoice)) {
            if (
                !window.confirm(
                    "An invoice already exists. Are you sure you want to update the invoice?",
                )
            )
                return;
        }
        router.post(
            generateInvoiceUrl,
            {},
            {
                onSuccess: () => {
                    toast.success("Invoice generated successfully.");
                },
                onError: () => {
                    toast.error("Failed to generate invoice.");
                },
                preserveScroll: true,
            },
        );
    };

    const sendPaymentReminder = () => {
        if (!sendPaymentReminderUrl) return;
        router.post(
            sendPaymentReminderUrl,
            {},
            {
                onSuccess: () => {
                    toast.success("Payment reminder sent.");
                },
                onError: () => {
                    toast.error("Failed to send payment reminder.");
                },
                preserveScroll: true,
            },
        );
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (method === "post") {
            form.post(submitUrl);
            return;
        }

        form.put(submitUrl, {
            onSuccess: () => {
                toast.success("Application updated.");
            },
            onError: () => {
                toast.error("Error updating application.");
            },
            preserveScroll: true,
        });
    };

    const releaseBooths = () => {
        if (!releaseBoothsUrl) return;
        if (window.confirm("Release all booths for this application?")) {
            router.post(
                releaseBoothsUrl,
                {},
                {
                    onSuccess: () => {
                        boothsForm.setData("event_booth_ids", []);
                        toast.success("Booths released.");
                    },
                    onError: () => {
                        toast.error("Failed to release booths.");
                    },
                    preserveScroll: true,
                },
            );
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className=" gap-6 flex flex-col md:grid md:gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="event_id" className="text-sm font-medium">
                        Event
                    </label>
                    <input
                        id="event_id"
                        className={selectClassName}
                        value={event.event_name}
                        disabled
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label
                        htmlFor="organization"
                        className="text-sm font-medium"
                    >
                        Organization / Brand Name
                    </label>
                    <Input
                        id="organization"
                        value={vendor.vendor_name}
                        disabled
                    />
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="contact_person"
                        className="text-sm font-medium"
                    >
                        Contact Person
                    </label>
                    <Input
                        id="contact_person"
                        value={vendor.vendor_contact_person}
                        disabled
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                        Email
                    </label>
                    <Input
                        id="email"
                        type="email"
                        value={vendor.vendor_email}
                        disabled
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="contact_no" className="text-sm font-medium">
                        Contact No
                    </label>
                    <Input
                        id="contact_no"
                        value={vendor.vendor_contact_no}
                        disabled
                    />
                </div>
                <div className="space-y-2 flex items-center pt-6">
                    <Button
                        type="button"
                        variant="default"
                        onClick={() => setShowVendorModal(true)}
                    >
                        Show More
                    </Button>
                </div>

                <div className="space-y-2 col-span-2">
                    <hr />
                </div>

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
                        value={form.data.participants}
                        onChange={(e) =>
                            form.setData(
                                "participants",
                                Number(e.target.value || 0),
                            )
                        }
                        aria-invalid={Boolean(form.errors.participants)}
                    />
                    {form.errors.participants ? (
                        <p className="text-sm text-red-600">
                            {form.errors.participants}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="no_of_booths"
                        className="text-sm font-medium"
                    >
                        Booths Requested
                    </label>
                    <select
                        name=""
                        id="no_of_booths"
                        onChange={(e) =>
                            form.setData(
                                "no_of_booths",
                                Number(e.target.value || 1),
                            )
                        }
                        className={selectClassName}
                    >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                    {form.errors.no_of_booths ? (
                        <p className="text-sm text-red-600">
                            {form.errors.no_of_booths}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="application_status"
                        className="text-sm font-medium"
                    >
                        Status
                    </label>
                    <div className="flex items-center gap-2">
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
                            aria-invalid={Boolean(
                                form.errors.application_status,
                            )}
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <Button
                            type="button"
                            onClick={updateStatus}
                            disabled={!updateStatusUrl || statusForm.processing}
                        >
                            Update
                        </Button>
                    </div>
                    {form.errors.application_status ? (
                        <p className="text-sm text-red-600">
                            {form.errors.application_status}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label
                        htmlFor="requirements"
                        className="text-sm font-medium"
                    >
                        Requirements
                    </label>
                    <textarea
                        id="requirements"
                        className={textareaClassName}
                        rows={3}
                        value={form.data.requirements}
                        onChange={(e) =>
                            form.setData("requirements", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.requirements)}
                    />
                    {form.errors.requirements ? (
                        <p className="text-sm text-red-600">
                            {form.errors.requirements}
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="plug"
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={form.data.plug}
                        onChange={(e) => form.setData("plug", e.target.checked)}
                    />
                    <label htmlFor="plug" className="text-sm">
                        Requires plug
                    </label>
                </div>
            </div>

            <div className="flex justify-end items-center gap-2">
                <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.visit(cancelUrl)}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {submitLabel}
                </Button>
            </div>

            <hr />
            {application?.application_id && isApproved ? (
                <div className="space-y-4">
                    {event.require_deposit ? (
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Deposit
                                </div>
                                <div className="text-sm font-medium">
                                    ${depositTotal.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="space-y-3">
                        <div className="text-sm font-medium">Booths</div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">
                                    Select {boothLimit} booth
                                    {boothLimit === 1 ? "" : "s"} for this
                                    application.
                                </div>
                                <MultiSelect
                                    options={boothOptions}
                                    onValueChange={(next) => {
                                        if (boothSelectionDisabled) return;
                                        boothsForm.setData(
                                            "event_booth_ids",
                                            next,
                                        );
                                    }}
                                    defaultValue={
                                        boothsForm.data.event_booth_ids
                                    }
                                    placeholder={
                                        boothSelectionDisabled
                                            ? "Order paid"
                                            : "Select booths"
                                    }
                                    disabled={
                                        boothSelectionDisabled ||
                                        boothLimit <= 0 ||
                                        eventBooths.length === 0
                                    }
                                    maxSelected={boothLimit}
                                    maxCount={boothLimit}
                                />
                                {boothsForm.errors.event_booth_ids ? (
                                    <p className="text-sm text-red-600">
                                        {boothsForm.errors.event_booth_ids}
                                    </p>
                                ) : null}
                                <div className="flex flex-row justify-between items-center gap-2">
                                    <div className="text-sm text-muted-foreground">
                                        Selected{" "}
                                        {boothsForm.data.event_booth_ids.length}
                                        /{boothLimit}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={releaseBooths}
                                        disabled={
                                            !releaseBoothsUrl ||
                                            boothsForm.processing ||
                                            selectedBoothRows.length === 0 ||
                                            Boolean(order?.is_paid)
                                        }
                                    >
                                        Release Booths
                                    </Button>
                                </div>
                            </div>

                            {selectedBoothRows.length > 0 ? (
                                <div className="rounded-lg border pt-2">
                                    <div className="grid grid-cols-3 gap-2 border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
                                        <div>Booth Type</div>
                                        <div>Booth</div>
                                        <div className="text-right">Price</div>
                                    </div>
                                    <div className="divide-y">
                                        {selectedBoothRows.map((b) => (
                                            <div
                                                key={b.event_booth_id}
                                                className="grid grid-cols-3 gap-2 px-3 py-2 text-sm"
                                            >
                                                <div>{b.booth_type_name}</div>
                                                <div>{b.booth_name}</div>
                                                <div className="text-right">
                                                    $
                                                    {(typeof b.booth_price ===
                                                    "number"
                                                        ? b.booth_price
                                                        : Number(b.booth_price)
                                                    ).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-3 md:col-span-2">
                                <div className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="text-muted-foreground">
                                            Booth total
                                        </div>
                                        <div className="font-medium">
                                            ${selectedBoothTotal.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <label
                                            htmlFor="discount_price"
                                            className="text-muted-foreground"
                                        >
                                            Discount
                                        </label>
                                        <Input
                                            id="discount_price"
                                            type="number"
                                            inputMode="decimal"
                                            step="1"
                                            min="0"
                                            className="h-8 w-32 text-right"
                                            value={
                                                boothsForm.data.discount_price
                                            }
                                            onChange={(e) =>
                                                boothsForm.setData(
                                                    "discount_price",
                                                    Number(e.target.value || 0),
                                                )
                                            }
                                            disabled={boothSelectionDisabled}
                                        />
                                    </div>
                                    {boothsForm.errors.discount_price ? (
                                        <p className="mt-2 text-sm text-red-600">
                                            {boothsForm.errors.discount_price}
                                        </p>
                                    ) : null}

                                    {event.require_deposit ? (
                                        <div className="mt-2 flex items-center justify-between text-sm">
                                            <div className="text-muted-foreground">
                                                Deposit
                                            </div>
                                            <div className="font-medium">
                                                ${depositTotal.toFixed(2)}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                                        <div className="text-muted-foreground">
                                            Total
                                        </div>
                                        <div className="text-base font-semibold">
                                            ${applicationTotal.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row w-full md:justify-between gap-2">
                                    <div>
                                        {order?.order_no ? (
                                            <div className="text-sm text-muted-foreground">
                                                Order {order.order_no}
                                                {invoice?.invoice_no
                                                    ? ` • Invoice ${invoice.invoice_no}`
                                                    : ""}
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-end gap-2">
                                        <Button
                                            type="button"
                                            onClick={generateInvoice}
                                            disabled={
                                                !generateInvoiceUrl ||
                                                !order ||
                                                boothsForm.processing
                                            }
                                        >
                                            Generate Invoice
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={confirmBooths}
                                            disabled={
                                                !canConfirmBooths ||
                                                boothsForm.processing
                                            }
                                        >
                                            Confirm
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <hr />

            <div className="space-y-2">
                <div className="text-sm font-medium">Order Payment Status</div>
                {order ? (
                    <div className="rounded-lg border bg-white p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">
                                        Order No:
                                    </span>{" "}
                                    <span className="font-medium">
                                        {order.order_no}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Order Created Date:{" "}
                                    {format(order?.created_at, "MMM d, yyyy") ??
                                        "-"}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span
                                    className={[
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                        order.is_paid
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800",
                                    ].join(" ")}
                                >
                                    {order.is_paid ? "Paid" : "Unpaid"}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={sendPaymentReminder}
                                    disabled={
                                        !sendPaymentReminderUrl || order.is_paid
                                    }
                                >
                                    Send Reminder
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        No order created yet.
                    </div>
                )}
            </div>

            <Dialog open={showVendorModal} onOpenChange={setShowVendorModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Vendor Information</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="text-sm font-medium">
                                Business Description
                            </div>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {vendor.business_description ?? "-"}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-sm font-medium">Category</div>
                            <div className="text-sm text-muted-foreground">
                                {vendorCategoryText || "-"}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                Social Medias
                            </div>
                            {vendorSocialMedias ? (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {[
                                        "instagram",
                                        "facebook",
                                        "youtube",
                                        "tiktok",
                                        "xiaohongshu",
                                    ].map((key) => {
                                        const value = vendorSocialMedias[key];
                                        const display =
                                            typeof value === "string"
                                                ? value.trim()
                                                : "";
                                        if (!display) return null;
                                        return (
                                            <div
                                                key={key}
                                                className="space-y-0.5"
                                            >
                                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                                    {key}
                                                </div>
                                                <div className="text-sm break-all">
                                                    {display}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    -
                                </div>
                            )}
                        </div>
                    </div>

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
