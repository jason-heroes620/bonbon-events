import GuestLayout from "@/Layouts/GuestLayout";
import { Head, router } from "@inertiajs/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import type {
    MultiSelectGroup,
    MultiSelectOption,
} from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import PublicSiteLayout from "@/components/PublicSiteLayout";

type Application = {
    application_id: string;
    application_code: string;
    application_status: string;
    vendor_name: string;
};

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
    event_booths: ApplicationEventBooth[];
    selected_event_booth_ids: string[];
};

type Invoice = {
    invoice_id: string;
    invoice_no: string;
    invoice_status: string;
    invoice_amount: number | string;
    invoice_date: string;
} | null;

type Order = {
    order_id: string;
    order_no: string;
    application_id: string;
    application_code: string;
    total_price: number | string;
    discount_price: number | string;
    is_paid: boolean;
    created_at?: string;
} | null;

type OrderItem = {
    order_item_id: string;
    quantity: number;
    price: number | string;
    item_description: string;
};

type Charge = {
    charges_id: string;
    charges_name: string;
    charges_type: "F" | "P";
    charges_rate: number | string;
    sort_order: number;
};

type PaymentsPageProps = {
    application: Application;
    order: Order;
    invoice: Invoice;
    items: OrderItem[];
    charges: Charge[];
    applicationEvents: ApplicationEventView[];
    ipay88: {
        enabled: boolean;
    };
};

export default function PaymentsShow({
    application,
    order,
    items,
    charges,
    applicationEvents,
    ipay88,
}: PaymentsPageProps) {
    useEffect(() => {
        if (order?.is_paid) toast.success("Payment successful");
    }, [order?.is_paid]);

    const [selectedByEvent, setSelectedByEvent] = useState<
        Record<string, string[]>
    >(() => {
        const next: Record<string, string[]> = {};
        for (const ae of applicationEvents) {
            next[ae.application_event_id] = ae.selected_event_booth_ids ?? [];
        }
        return next;
    });

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [requestInvoiceOpen, setRequestInvoiceOpen] = useState(false);
    const [requestingInvoice, setRequestingInvoice] = useState(false);

    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n)) return n.toFixed(2);
        return String(value);
    };

    const parseAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const formatMoney = (value: number | string) => {
        const n = parseAmount(value);
        return `RM ${n.toLocaleString("en-MY", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

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

    const calculatedDiscount = useMemo(() => {
        return order ? parseAmount(order.discount_price) : 0;
    }, [order]);

    const baseForCharges = useMemo(() => {
        return Math.max(0, calculatedSubtotal - calculatedDiscount);
    }, [calculatedSubtotal, calculatedDiscount]);

    const calculatedCharges = useMemo(() => {
        const round2 = (n: number) => Math.round(n * 100) / 100;

        return charges
            .slice()
            .sort((a, b) => (a.sort_order ?? 1) - (b.sort_order ?? 1))
            .map((c) => {
                const rate = parseAmount(c.charges_rate);
                const amount =
                    c.charges_type === "P"
                        ? round2(baseForCharges * (rate / 100))
                        : round2(rate);
                return { ...c, calculated_amount: amount };
            })
            .filter((c) => c.calculated_amount > 0);
    }, [charges, baseForCharges]);

    const calculatedChargesTotal = useMemo(() => {
        return calculatedCharges.reduce(
            (sum, c) => sum + c.calculated_amount,
            0,
        );
    }, [calculatedCharges]);

    const calculatedTotal = useMemo(() => {
        return baseForCharges + calculatedChargesTotal;
    }, [baseForCharges, calculatedChargesTotal]);

    const allBoothsChosen = useMemo(() => {
        if (!applicationEvents.length) return false;
        return applicationEvents.every((ae) => {
            const selected = selectedByEvent[ae.application_event_id] ?? [];
            return selected.length === (ae.no_of_booths ?? 0);
        });
    }, [applicationEvents, selectedByEvent]);

    const canProceedToPay =
        ipay88.enabled &&
        !order?.is_paid &&
        application.application_status === "approved" &&
        allBoothsChosen;

    const selectionsPayload = useMemo(() => {
        return applicationEvents.map((ae) => ({
            application_event_id: ae.application_event_id,
            event_booth_ids: selectedByEvent[ae.application_event_id] ?? [],
        }));
    }, [applicationEvents, selectedByEvent]);

    const handleBoothChange = (applicationEventId: string, next: string[]) => {
        if (order?.is_paid) return;
        setSelectedByEvent((prev) => ({
            ...prev,
            [applicationEventId]: next,
        }));
    };

    return (
        <PublicSiteLayout>
            <Head title={`Payment ${application.application_code}`} />

            <div className="container mx-auto md:max-w-3xl px-4 py-8">
                <div className="space-y-4">
                    <div>
                        <h2 className="font-semibold">Make Payment</h2>
                        <div className="text-sm text-muted-foreground">
                            Application Code {application.application_code}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Order No
                            </div>
                            <div className="text-sm font-medium">
                                {order?.order_no ?? "-"}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Vendor Name
                            </div>
                            <div className="text-sm font-medium">
                                {application?.vendor_name ?? "-"}
                            </div>
                        </div>

                        {/* <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Total Amount
                        </div>
                        <div className="text-sm font-medium">
                            {order
                                ? `RM ${formatAmount(order.total_price)}`
                                : "-"}
                        </div>
                    </div> */}

                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Payment Status
                            </div>
                            <div>
                                <span
                                    className={cn(
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                        order?.is_paid
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800",
                                    )}
                                >
                                    {order?.is_paid ? "Paid" : "Unpaid"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {items.length ? (
                        <div className="rounded-lg border bg-white">
                            <div className="border-b px-4 py-3">
                                <div className="text-sm font-medium">
                                    Order Items
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/40">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Description
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Qty
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium">
                                                Price (RM)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr
                                                key={item.order_item_id}
                                                className="border-b last:border-b-0"
                                            >
                                                <td className="px-4 py-3">
                                                    {item.item_description}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatAmount(item.price)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    {applicationEvents.length ? (
                        <div className="space-y-3">
                            {applicationEvents.map((ae) => {
                                const boothLimit = ae.no_of_booths ?? 0;
                                const selected =
                                    selectedByEvent[ae.application_event_id] ??
                                    ae.selected_event_booth_ids;
                                const selectedSet = new Set(selected);

                                const groups = new Map<
                                    string,
                                    MultiSelectOption[]
                                >();
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
                                        label: `${booth.booth_name} - ${formatMoney(booth.booth_price)}`,
                                        disabled:
                                            Boolean(order?.is_paid) ||
                                            occupiedByOther ||
                                            (booth.occupied &&
                                                !selectedSet.has(
                                                    booth.event_booth_id,
                                                )),
                                    });
                                    groups.set(booth.booth_type_name, list);
                                }

                                const boothOptions: MultiSelectGroup[] =
                                    Array.from(groups.entries()).map(
                                        ([heading, options]) => ({
                                            heading,
                                            options,
                                        }),
                                    );

                                return (
                                    <div
                                        key={ae.application_event_id}
                                        className="rounded-lg border bg-white p-4 space-y-3"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm font-semibold">
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
                                            <div className="text-xs text-muted-foreground">
                                                Deposit:{" "}
                                                {formatMoney(ae.deposit_amount)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Booths required: {boothLimit}
                                            </div>
                                        </div>

                                        <MultiSelect
                                            variant="default"
                                            options={boothOptions}
                                            onValueChange={(next) => {
                                                handleBoothChange(
                                                    ae.application_event_id,
                                                    next,
                                                );
                                            }}
                                            defaultValue={selected}
                                            placeholder="Select booths"
                                            disabled={
                                                Boolean(order?.is_paid) ||
                                                boothLimit <= 0 ||
                                                ae.event_booths.length === 0
                                            }
                                            maxSelected={boothLimit}
                                            maxCount={boothLimit}
                                            resetOnDefaultValueChange={true}
                                            closeOnSelect={false}
                                        />

                                        {selected.length !== boothLimit ? (
                                            <div className="text-xs text-amber-700">
                                                Please select {boothLimit}{" "}
                                                booth(s) for this event.
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}

                    <div className="rounded-lg border bg-white p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Subtotal
                            </div>
                            <div className="text-sm font-medium">
                                {formatMoney(calculatedSubtotal)}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Discount
                            </div>
                            <div className="text-sm font-medium">
                                {formatMoney(calculatedDiscount)}
                            </div>
                        </div>
                        {calculatedCharges.map((c) => (
                            <div
                                key={c.charges_id}
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
                                    {formatMoney(c.calculated_amount)}
                                </div>
                            </div>
                        ))}
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Total
                            </div>
                            <div className="text-sm font-semibold">
                                {formatMoney(calculatedTotal)}
                            </div>
                        </div>
                    </div>

                    {/* {order?.discount_price && (
                    <div className="rounded-lg border bg-white p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Discount
                            </div>
                            <div className="text-sm font-medium">
                                RM {order?.discount_price ?? "-"}
                            </div>
                        </div>
                    </div>
                )} */}
                    {/* <div className="rounded-lg border bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Invoice
                        </div>
                        <div className="text-sm font-medium">
                            {invoice?.invoice_no ?? "-"}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Invoice Status
                        </div>
                        <div className="text-sm font-medium">
                            {invoice?.invoice_status ?? "-"}
                        </div>
                    </div>
                </div> */}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                Boolean(order?.is_paid) ||
                                application.application_status !== "approved" ||
                                !allBoothsChosen ||
                                requestingInvoice
                            }
                            onClick={() => {
                                if (!allBoothsChosen) {
                                    toast.error(
                                        "Please select the required booths for all events before proceeding.",
                                    );
                                    return;
                                }
                                setRequestInvoiceOpen(true);
                            }}
                        >
                            Request Invoice
                        </Button>

                        <div className="flex justify-end gap-2">
                            {/* check if has history, back to history page else go to home page */}
                            {history.length > 0 ? (
                                <a
                                    href="/"
                                    className={buttonVariants({
                                        variant: "outline",
                                    })}
                                >
                                    Back
                                </a>
                            ) : (
                                <a
                                    href="/"
                                    className={buttonVariants({
                                        variant: "outline",
                                    })}
                                >
                                    Back
                                </a>
                            )}

                            <Button
                                type="button"
                                disabled={
                                    !ipay88.enabled ||
                                    Boolean(order?.is_paid) ||
                                    application.application_status !==
                                        "approved" ||
                                    !allBoothsChosen
                                }
                                onClick={() => {
                                    if (!allBoothsChosen) {
                                        toast.error(
                                            "Please select the required booths for all events before proceeding.",
                                        );
                                        return;
                                    }
                                    setConfirmOpen(true);
                                }}
                            >
                                Make Payment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Payment</DialogTitle>
                        <DialogDescription>
                            Please confirm the payment amount before proceeding.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 text-sm">
                        {/* <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                Current Order Total
                            </div>
                            <div className="font-medium">
                                {order
                                    ? `RM ${formatAmount(order.total_price)}`
                                    : "-"}
                            </div>
                        </div> */}
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                Payment Total
                            </div>
                            <div className="font-semibold">
                                {formatMoney(calculatedTotal)}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={!canProceedToPay}
                            onClick={() => {
                                router.post(
                                    `/payments/${application.application_code}/prepare`,
                                    {
                                        selections: selectionsPayload,
                                    },
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setConfirmOpen(false);
                                        },
                                        onError: () => {
                                            toast.error(
                                                "Failed to prepare payment. Please try again.",
                                            );
                                        },
                                    },
                                );
                            }}
                        >
                            Confirm & Proceed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={requestInvoiceOpen}
                onOpenChange={setRequestInvoiceOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Request Invoice</DialogTitle>
                        <DialogDescription>
                            Confirm to generate and send the invoice to your
                            email.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                Invoice Amount
                            </div>
                            <div className="font-semibold">
                                {formatMoney(calculatedTotal)}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRequestInvoiceOpen(false)}
                            disabled={requestingInvoice}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={
                                requestingInvoice ||
                                !allBoothsChosen ||
                                Boolean(order?.is_paid)
                            }
                            onClick={() => {
                                setRequestingInvoice(true);
                                router.post(
                                    `/payments/${application.application_code}/request-invoice`,
                                    { selections: selectionsPayload },
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setRequestingInvoice(false);
                                            setRequestInvoiceOpen(false);
                                            toast.success(
                                                "Invoice requested. Please check your email.",
                                            );
                                        },
                                        onError: () => {
                                            setRequestingInvoice(false);
                                            toast.error(
                                                "Failed to request invoice. Please try again.",
                                            );
                                        },
                                    },
                                );
                            }}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PublicSiteLayout>
    );
}
