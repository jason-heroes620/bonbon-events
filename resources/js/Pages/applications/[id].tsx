import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import type { Application, Category, Vendor } from "@/types";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import type {
    MultiSelectGroup,
    MultiSelectOption,
} from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

type ApplicationEventBooth = {
    event_booth_id: string;
    event_id: string;
    booth_id: string;
    booth_price: number | string;
    occupied: boolean;
    occupied_by_application_event_id?: string | null;
    booth_name: string;
    booth_type_id: string;
    booth_type_name: string;
};

type ApplicationEventView = {
    application_event_id: string;
    event_id: string;
    event_name: string;
    event_start_date: string | null;
    require_deposit: boolean;
    deposit_amount: number | string;
    participants: number;
    no_of_booths: number;
    requirements: string;
    plug: boolean;
    application_status: "pending" | "approved" | "rejected" | "cancelled";
    event_booths: ApplicationEventBooth[];
    selected_event_booth_ids: string[];
};

type ApplicationOrder = {
    order_id: string;
    order_no: string;
    sub_total: number | string;
    total_price: number | string;
    discount_price: number | string;
    charges_total: number | string;
    is_paid: boolean;
    created_at: string;
};

type ApplicationOrderCharge = {
    order_charge_id: string;
    charges_name: string;
    charges_type: "F" | "P";
    charges_rate: number | string;
    charges_amount: number | string;
    sort_order: number;
};

type ApplicationInvoice = {
    invoice_id: string;
    invoice_no: string;
    invoice_status: string;
    invoice_amount: number | string;
};

type ApplicationActivityLog = {
    id: number;
    application_code: string;
    activity: string;
    description: string;
    name: string | null;
    created_at: string | null;
};

type EditApplicationProps = {
    application: Application;
    vendor: Pick<
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
        | "vendor_bank_account_name"
        | "vendor_bank_account_no"
    >;
    categories: Pick<Category, "category_id" | "category_name">[];
    applicationEvents: ApplicationEventView[];
    order: ApplicationOrder | null;
    charges: ApplicationOrderCharge[];
    amountPaid: number | string;
    invoice: ApplicationInvoice | null;
    activityLogs: ApplicationActivityLog[];
};

export default function EditApplication({
    application,
    vendor,
    categories,
    applicationEvents,
    order,
    charges,
    amountPaid,
    invoice,
    activityLogs,
}: EditApplicationProps) {
    const page = usePage();
    const authUser = (page.props as any)?.auth?.user as
        | { user_id: string; role?: string }
        | undefined;
    const isAdmin = authUser?.role === "admin";

    const [applicationStatus, setApplicationStatus] = useState(
        application.application_status,
    );
    const [discountPrice, setDiscountPrice] = useState<string>(
        order?.discount_price != null ? String(order.discount_price) : "0",
    );
    const [showVendorModal, setShowVendorModal] = useState(false);

    const orderPaid = Boolean(order?.is_paid);
    const applicationApproved = application.application_status === "approved";

    const [selectedByEvent, setSelectedByEvent] = useState<
        Record<string, string[]>
    >(() => {
        const next: Record<string, string[]> = {};
        for (const ae of applicationEvents) {
            next[ae.application_event_id] = ae.selected_event_booth_ids ?? [];
        }
        return next;
    });

    const [boothQtyByEvent, setBoothQtyByEvent] = useState<
        Record<string, string>
    >(() => {
        const next: Record<string, string> = {};
        for (const ae of applicationEvents) {
            next[ae.application_event_id] = String(ae.no_of_booths ?? 0);
        }
        return next;
    });

    const parseAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const formatAmount = (value: number | string) => {
        const n = parseAmount(value);
        if (!Number.isFinite(n)) return String(value);
        return `RM${n.toLocaleString("en-MY", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

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
                    .map((value) => value.trim())
                    .filter(Boolean)
              : [];

        return ids
            .map((id) => categoryLabelById.get(id) ?? id)
            .filter(Boolean)
            .join(", ");
    }, [vendor.category, categoryLabelById]);

    const vendorSocialMedias = useMemo(() => {
        if (!vendor.social_medias || typeof vendor.social_medias !== "object") {
            return [];
        }

        return Object.entries(vendor.social_medias as Record<string, unknown>)
            .filter(
                ([, value]) => typeof value === "string" && value.trim() !== "",
            )
            .map(([key, value]) => ({
                key,
                value: String(value),
            }));
    }, [vendor.social_medias]);

    const calculatedSubtotal = useMemo(() => {
        return applicationEvents.reduce((sum, applicationEvent) => {
            const selectedIds =
                selectedByEvent[applicationEvent.application_event_id] ??
                applicationEvent.selected_event_booth_ids;
            const selectedSet = new Set(selectedIds);

            const boothTotal = applicationEvent.event_booths.reduce(
                (boothSum, booth) =>
                    selectedSet.has(booth.event_booth_id)
                        ? boothSum + parseAmount(booth.booth_price)
                        : boothSum,
                0,
            );

            return (
                sum + parseAmount(applicationEvent.deposit_amount) + boothTotal
            );
        }, 0);
    }, [applicationEvents, selectedByEvent]);

    const calculatedDiscount = parseAmount(discountPrice);
    const baseForCharges = Math.max(0, calculatedSubtotal - calculatedDiscount);

    const calculatedCharges = useMemo(() => {
        const round2 = (n: number) => Math.round(n * 100) / 100;

        return charges.map((c) => {
            const rate = parseAmount(c.charges_rate);
            const amount =
                c.charges_type === "P"
                    ? round2(baseForCharges * (rate / 100))
                    : round2(rate);

            return {
                ...c,
                calculated_amount: amount,
            };
        });
    }, [charges, baseForCharges]);

    const calculatedChargesTotal = useMemo(() => {
        return calculatedCharges.reduce(
            (sum, c) => sum + parseAmount(c.calculated_amount),
            0,
        );
    }, [calculatedCharges]);

    const calculatedTotalAmount = baseForCharges + calculatedChargesTotal;
    const currentTotalAmount = order
        ? parseAmount(order.total_price)
        : calculatedTotalAmount;
    const amountPaidValue = parseAmount(amountPaid);
    const totalPayableAmount = Math.max(
        0,
        currentTotalAmount - amountPaidValue,
    );

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Applications</h2>}
        >
            <Head title={`Edit Application: ${application.application_code}`} />

            <div className="max-w-6xl space-y-4">
                <div className="rounded-lg border bg-white p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-lg font-semibold">
                                Application {application.application_code}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{vendor.vendor_name}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowVendorModal(true)}
                                >
                                    View Vendor
                                </Button>
                            </div>
                        </div>
                        {/* <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button> */}
                    </div>

                    <div className="rounded border p-4">
                        <div className="flex flex-col md:flex-row md:justify-between gap-3">
                            <div className="flex flex-col space-y-1">
                                <div className="text-sm font-medium">
                                    Application Status:{" "}
                                    <span
                                        className={`font-bold ${application.application_status === "pending" ? "text-orange-600" : application.application_status === "approved" ? "text-green-600" : application.application_status === "rejected" ? "text-red-600" : ""}`}
                                    >
                                        {application.application_status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="text-sm font-medium">
                                    Application Date:{" "}
                                    {format(
                                        new Date(application.created_at ?? ""),
                                        "d MMM, y",
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                    <select
                                        value={applicationStatus}
                                        onChange={(e) =>
                                            setApplicationStatus(
                                                e.target
                                                    .value as Application["application_status"],
                                            )
                                        }
                                        className="h-10 min-w-44 rounded-md border px-3 text-sm"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">
                                            Approved
                                        </option>
                                        <option value="rejected">
                                            Rejected
                                        </option>
                                        <option value="cancelled">
                                            Cancelled
                                        </option>
                                    </select>
                                    <Button
                                        type="button"
                                        disabled={
                                            applicationStatus ===
                                            application.application_status
                                        }
                                        onClick={() =>
                                            router.post(
                                                `/applications/${application.application_id}/update-status`,
                                                {
                                                    application_status:
                                                        applicationStatus,
                                                },
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        toast.success(
                                                            "Application status updated successfully.",
                                                        );
                                                    },
                                                    onError: () => {
                                                        toast.error(
                                                            "Failed to update application status.",
                                                        );
                                                    },
                                                },
                                            )
                                        }
                                    >
                                        Save
                                    </Button>
                                </div>

                                {applicationStatus === "approved" ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            application.application_status !==
                                            "approved"
                                        }
                                        onClick={() =>
                                            router.post(
                                                `/applications/${application.application_id}/send-payment-link`,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        toast.success(
                                                            "Payment link sent successfully.",
                                                        );
                                                    },
                                                    onError: () => {
                                                        toast.error(
                                                            "Failed to send payment link.",
                                                        );
                                                    },
                                                },
                                            )
                                        }
                                    >
                                        Send Payment Link
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center justify-between rounded border p-3">
                            <div className="text-xs text-muted-foreground">
                                Order
                            </div>
                            <div className="text-sm font-medium">
                                {order?.order_no ?? "-"}
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded border p-3">
                            <div className="text-xs text-muted-foreground">
                                Invoice
                            </div>
                            <div className="text-sm font-medium">
                                {invoice?.invoice_no ?? "-"}
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded border p-3">
                            <div className="text-xs text-muted-foreground">
                                Order Total
                            </div>
                            <div className="text-sm font-medium">
                                {order ? formatAmount(order.total_price) : "-"}
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded border p-3">
                            <div className="text-xs text-muted-foreground">
                                Payment
                            </div>
                            <div
                                className={`text-sm font-medium ${order?.is_paid ? "text-green-500" : "text-red-500"}`}
                            >
                                {order
                                    ? order.is_paid
                                        ? "PAID"
                                        : "UNPAID"
                                    : "-"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {applicationEvents.map((ae) => {
                        const boothLimit = ae.no_of_booths ?? 0;
                        const selected =
                            selectedByEvent[ae.application_event_id] ??
                            ae.selected_event_booth_ids;
                        const selectedSet = new Set(selected);
                        const groups = new Map<string, MultiSelectOption[]>();

                        for (const booth of ae.event_booths) {
                            const list =
                                groups.get(booth.booth_type_name) ?? [];
                            const occupiedByOther =
                                booth.occupied &&
                                booth.occupied_by_application_event_id &&
                                booth.occupied_by_application_event_id !==
                                    ae.application_event_id;
                            list.push({
                                value: booth.event_booth_id,
                                label: `${booth.booth_name} - ${formatAmount(booth.booth_price)}`,
                                disabled:
                                    orderPaid ||
                                    occupiedByOther ||
                                    (booth.occupied &&
                                        !selectedSet.has(booth.event_booth_id)),
                            });
                            groups.set(booth.booth_type_name, list);
                        }

                        const boothOptions: MultiSelectGroup[] = Array.from(
                            groups.entries(),
                        ).map(([heading, options]) => ({
                            heading,
                            options,
                        }));

                        return (
                            <div
                                key={ae.application_event_id}
                                className="rounded-lg border bg-white p-6 space-y-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3 md:col-span-1">
                                        <div>
                                            <div className="text-base font-semibold">
                                                {ae.event_name}
                                            </div>
                                            <div className="text-sm">
                                                <a
                                                    href={`/events/${ae.event_id}/layout-overview`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Layout overview
                                                </a>
                                            </div>

                                            <div className="text-sm text-muted-foreground">
                                                Deposit:{" "}
                                                {formatAmount(
                                                    ae.deposit_amount,
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-start gap-3 md:col-span-2">
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">
                                                Booths ({boothLimit})
                                            </div>
                                            <MultiSelect
                                                variant="default"
                                                options={boothOptions}
                                                onValueChange={(next) => {
                                                    if (orderPaid) return;
                                                    setSelectedByEvent(
                                                        (prev) => ({
                                                            ...prev,
                                                            [ae.application_event_id]:
                                                                next,
                                                        }),
                                                    );
                                                }}
                                                defaultValue={selected}
                                                placeholder={
                                                    orderPaid
                                                        ? "Order paid"
                                                        : "Select booths"
                                                }
                                                disabled={
                                                    orderPaid ||
                                                    boothLimit <= 0 ||
                                                    ae.event_booths.length === 0
                                                }
                                                maxSelected={boothLimit}
                                                maxCount={boothLimit}
                                                resetOnDefaultValueChange={true}
                                                closeOnSelect={false}
                                            />
                                        </div>

                                        {isAdmin ? (
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium">
                                                    Booth Qty
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={127}
                                                        className="h-10 w-24"
                                                        value={
                                                            boothQtyByEvent[
                                                                ae
                                                                    .application_event_id
                                                            ] ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            setBoothQtyByEvent(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [ae.application_event_id]:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        disabled={orderPaid}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={
                                                            orderPaid ||
                                                            Number(
                                                                boothQtyByEvent[
                                                                    ae
                                                                        .application_event_id
                                                                ] ?? 0,
                                                            ) ===
                                                                (ae.no_of_booths ??
                                                                    0)
                                                        }
                                                        onClick={() =>
                                                            router.post(
                                                                `/applications/${application.application_id}/events/${ae.application_event_id}/update-booth-qty`,
                                                                {
                                                                    no_of_booths:
                                                                        Number(
                                                                            boothQtyByEvent[
                                                                                ae
                                                                                    .application_event_id
                                                                            ] ??
                                                                                0,
                                                                        ),
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess:
                                                                        () => {
                                                                            toast.success(
                                                                                "Booth quantity updated.",
                                                                            );
                                                                        },
                                                                    onError: (
                                                                        errors,
                                                                    ) => {
                                                                        const msg =
                                                                            (
                                                                                errors as any
                                                                            )
                                                                                ?.no_of_booths ??
                                                                            (
                                                                                errors as any
                                                                            )
                                                                                ?.order ??
                                                                            "Failed to update booth quantity.";
                                                                        toast.error(
                                                                            Array.isArray(
                                                                                msg,
                                                                            )
                                                                                ? msg[0]
                                                                                : String(
                                                                                      msg,
                                                                                  ),
                                                                        );
                                                                    },
                                                                },
                                                            )
                                                        }
                                                    >
                                                        Update
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="md:col-span-1 flex flex-wrap items-end gap-2">
                                        <Button
                                            disabled={
                                                orderPaid ||
                                                !applicationApproved ||
                                                !selected.length
                                            }
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        "Are you sure you want to confirm the booths?",
                                                    )
                                                ) {
                                                    router.post(
                                                        `/applications/${application.application_id}/events/${ae.application_event_id}/confirm-booths`,
                                                        {
                                                            event_booth_ids:
                                                                selected,
                                                            discount_price:
                                                                discountPrice,
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                toast.success(
                                                                    "Booths confirmed.",
                                                                );
                                                            },
                                                        },
                                                    );
                                                }
                                            }}
                                        >
                                            Confirm Booths
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={
                                                orderPaid || !selected.length
                                            }
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        "Are you sure you want to release the booths?",
                                                    )
                                                ) {
                                                    router.post(
                                                        `/applications/${application.application_id}/events/${ae.application_event_id}/release-booths`,
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                toast.success(
                                                                    "Booths released.",
                                                                );
                                                                window.location.reload();
                                                            },
                                                        },
                                                    );
                                                }
                                            }}
                                        >
                                            Release Booths
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-col md:grid md:grid-cols-3 md:gap-4 space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Participants: {ae.participants}
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Plug: {ae.plug ? "Yes" : "No"}
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Requirements: {ae.requirements}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                    <div className="rounded-lg border bg-white p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold">
                                Financial Ledger
                            </h2>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between rounded border p-3">
                                <div className="text-xs text-muted-foreground">
                                    Subtotal
                                </div>
                                <div className="text-sm font-medium">
                                    {formatAmount(calculatedSubtotal)}
                                </div>
                            </div>

                            <div className="rounded border p-3 space-y-2">
                                <div className="text-xs text-muted-foreground">
                                    Discount
                                </div>
                                <div className="flex items-end gap-2">
                                    <Input
                                        value={discountPrice}
                                        disabled={
                                            orderPaid || !applicationApproved
                                        }
                                        onChange={(e) =>
                                            setDiscountPrice(e.target.value)
                                        }
                                        inputMode="decimal"
                                        type="number"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            orderPaid ||
                                            !applicationApproved ||
                                            parseAmount(discountPrice) ===
                                                parseAmount(
                                                    order?.discount_price ??
                                                        "0",
                                                )
                                        }
                                        onClick={() =>
                                            router.post(
                                                `/applications/${application.application_id}/update-discount`,
                                                {
                                                    discount_price:
                                                        discountPrice,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded border p-3 space-y-2">
                                <div className="text-xs text-muted-foreground">
                                    Charges
                                </div>
                                {calculatedCharges.length > 0 ? (
                                    <div className="space-y-2">
                                        {calculatedCharges.map((c) => (
                                            <div
                                                key={c.order_charge_id}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="text-sm text-muted-foreground">
                                                    {c.charges_name}
                                                    {c.charges_type === "P" ? (
                                                        <span>
                                                            {" "}
                                                            (
                                                            {parseAmount(
                                                                c.charges_rate,
                                                            ).toFixed(2)}
                                                            %)
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {formatAmount(
                                                        c.calculated_amount,
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        No charges
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded border p-3">
                                <div className="text-xs text-muted-foreground">
                                    Total Amount
                                </div>
                                <div className="text-lg font-semibold">
                                    {formatAmount(calculatedTotalAmount)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold">Payment</h2>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between rounded border p-3">
                                <div className="text-xs text-muted-foreground">
                                    Total
                                </div>
                                <div className="text-sm font-medium">
                                    {formatAmount(currentTotalAmount)}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded border p-3">
                                <div className="text-xs text-muted-foreground">
                                    Amount Paid
                                </div>
                                <div className="text-sm font-medium">
                                    {formatAmount(amountPaidValue)}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded border p-3">
                                <div className="text-xs text-muted-foreground">
                                    Total Payable
                                </div>
                                <div className="text-lg font-semibold">
                                    {formatAmount(totalPayableAmount)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                variant="outline"
                                disabled={!applicationApproved || !order}
                                onClick={() =>
                                    router.post(
                                        `/applications/${application.application_id}/generate-invoice`,
                                        {},
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                toast.success(
                                                    "Invoice generated successfully.",
                                                );
                                            },
                                            onError: (errors) => {
                                                const msg =
                                                    errors?.order ??
                                                    errors?.application_status ??
                                                    "Failed to generate invoice.";
                                                toast.error(
                                                    Array.isArray(msg)
                                                        ? msg[0]
                                                        : String(msg),
                                                );
                                            },
                                        },
                                    )
                                }
                            >
                                {invoice
                                    ? "Regenerate Invoice"
                                    : "Generate Invoice"}
                            </Button>
                            <Button
                                variant="outline"
                                disabled={!order || orderPaid}
                                onClick={() =>
                                    router.post(
                                        `/applications/${application.application_id}/send-payment-reminder`,
                                        {},
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                toast.success(
                                                    "Payment reminder sent successfully.",
                                                );
                                            },
                                            onError: () => {
                                                toast.error(
                                                    "Failed to send payment reminder.",
                                                );
                                            },
                                        },
                                    )
                                }
                            >
                                Send Payment Reminder
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 space-y-4">
                    <div>
                        <h2 className="text-base font-semibold">
                            Activity Logs
                        </h2>
                    </div>

                    <div className="overflow-x-auto rounded border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Created At
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Activity
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        User
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityLogs.length > 0 ? (
                                    activityLogs.map((log) => (
                                        <tr key={log.id} className="border-t">
                                            <td className="px-4 py-3 align-top text-muted-foreground">
                                                {log.created_at
                                                    ? format(
                                                          new Date(
                                                              log.created_at,
                                                          ),
                                                          "d MMM y, h:mm a",
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3 align-top font-medium">
                                                {log.activity || "-"}
                                            </td>
                                            <td className="px-4 py-3 align-top text-muted-foreground">
                                                {log.description || "-"}
                                            </td>
                                            <td className="px-4 py-3 align-top text-muted-foreground">
                                                {log.name || "-"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            className="px-4 py-6 text-center text-muted-foreground"
                                            colSpan={4}
                                        >
                                            No activity logs found for this
                                            application.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={showVendorModal} onOpenChange={setShowVendorModal}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Vendor Information</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <div className="text-sm font-medium">
                                Vendor Name
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {vendor.vendor_name || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">
                                Contact Person
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {vendor.vendor_contact_person || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">Email</div>
                            <div className="text-sm text-muted-foreground">
                                {vendor.vendor_email || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">
                                Contact No.
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {vendor.vendor_contact_no || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">
                                Business Registration No.
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {vendor.business_registration_no || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">Category</div>
                            <div className="text-sm text-muted-foreground">
                                {vendorCategoryText || "-"}
                            </div>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                            <div className="text-sm font-medium">
                                Business Description
                            </div>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {vendor.business_description || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">Bank Name</div>
                            <div className="text-sm text-muted-foreground">
                                {vendor.vendor_bank_name || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">
                                Bank Account Name
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {vendor.vendor_bank_account_name || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">
                                Bank Account No.
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {vendor.vendor_bank_account_no || "-"}
                            </div>
                            {!vendor.vendor_bank_account_no ? (
                                <div className="text-sm text-red-600">
                                    Please contact vendor to provide bank
                                    account no.
                                </div>
                            ) : (
                                ""
                            )}
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                            <div className="text-sm font-medium">
                                Social Medias
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                {vendorSocialMedias.length > 0 ? (
                                    vendorSocialMedias.map((item) => (
                                        <div key={item.key}>
                                            {item.key}: {item.value}
                                        </div>
                                    ))
                                ) : (
                                    <div>-</div>
                                )}
                            </div>
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
        </AuthenticatedLayout>
    );
}
