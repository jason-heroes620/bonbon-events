import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type EventOption = {
    event_id: string;
    event_name: string;
    event_start_date: string | null;
};

type DepositRefundRow = {
    application_id: string;
    application_event_id: string;
    application_code: string;
    vendor_id: string;
    vendor_name: string | null;
    vendor_email?: string | null;
    order_id: string | null;
    is_paid: boolean;
    payment_amount: number | string;
    vendor_bank_name: string | null;
    vendor_bank_account_name: string | null;
    vendor_bank_account_no: string | null;
    refund_status?: "refunded" | "forfeited" | "pending" | null;
    refund_amount?: number | string | null;
    refund_date?: string | null;
    refund_file?: string | null;
    refund_comment?: string | null;
};

type DepositRefundPageProps = {
    events: EventOption[];
    selectedEventId: string | null;
    depositAmount: number | string;
    applications: DepositRefundRow[];
};

const selectClassName =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const inputClassName =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type RefundFormData = {
    application_code: string;
    refund_status: "refunded" | "forfeited" | "pending";
    refund_amount: string;
    refund_date: string;
    refund_file: File | null;
    refund_comment: string;
};

export default function DepositRefund({
    events,
    selectedEventId,
    depositAmount,
    applications,
}: DepositRefundPageProps) {
    const [eventId, setEventId] = useState(selectedEventId ?? "");
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [activeRow, setActiveRow] = useState<DepositRefundRow | null>(null);
    const [selectedApplicationCodes, setSelectedApplicationCodes] = useState<
        Set<string>
    >(new Set());

    const selectedEvent = useMemo(() => {
        return events.find((e) => e.event_id === eventId) ?? null;
    }, [events, eventId]);

    const exportUrl = eventId
        ? `/deposit-refund/export?event_id=${encodeURIComponent(eventId)}`
        : "";

    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n))
            return n.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        return String(value);
    };

    const today = new Date().toISOString().split("T")[0] ?? "";

    const refundForm = useForm<RefundFormData>({
        application_code: "",
        refund_status: "refunded",
        refund_amount: String(depositAmount ?? "0"),
        refund_date: today,
        refund_file: null,
        refund_comment: "",
    });

    const refundStatus = refundForm.data.refund_status;
    const refundDetailsRequired = refundStatus !== "forfeited";

    useEffect(() => {
        setSelectedApplicationCodes(new Set());
    }, [applications]);

    const openRefundModal = (row: DepositRefundRow) => {
        setActiveRow(row);
        refundForm.clearErrors();
        refundForm.setData({
            application_code: row.application_code,
            refund_status:
                (row.refund_status as RefundFormData["refund_status"]) ??
                "refunded",
            refund_amount:
                row.refund_amount != null
                    ? String(row.refund_amount)
                    : String(depositAmount ?? "0"),
            refund_date: row.refund_date ?? today,
            refund_file: null,
            refund_comment: row.refund_comment ?? "",
        });
        setShowRefundModal(true);
    };

    const selectableApplicationCodes = useMemo(
        () =>
            applications
                .filter((r) => r.is_paid)
                .map((r) => r.application_code),
        [applications],
    );

    const selectAllChecked =
        selectableApplicationCodes.length > 0 &&
        selectedApplicationCodes.size === selectableApplicationCodes.length;

    const toggleSelectAll = () => {
        setSelectedApplicationCodes(() => {
            if (selectAllChecked) {
                return new Set();
            }
            return new Set(selectableApplicationCodes);
        });
    };

    const toggleRow = (applicationCode: string) => {
        setSelectedApplicationCodes((prev) => {
            const next = new Set(prev);
            if (next.has(applicationCode)) {
                next.delete(applicationCode);
            } else {
                next.add(applicationCode);
            }
            return next;
        });
    };

    const bulkRequestBankInfo = () => {
        const selectedRows = applications.filter((row) =>
            selectedApplicationCodes.has(row.application_code),
        );

        if (selectedRows.length === 0) {
            toast.error("Select at least one row.");
            return;
        }

        const missingEmailCount = selectedRows.filter(
            (row) => !row.vendor_email,
        ).length;
        if (missingEmailCount > 0) {
            toast.error("Some selected rows are missing vendor email.");
            return;
        }

        const uniqueEmails = new Set(
            selectedRows
                .map((r) =>
                    String(r.vendor_email ?? "")
                        .trim()
                        .toLowerCase(),
                )
                .filter(Boolean),
        );

        const ok = window.confirm(
            `Send bank information request email to ${uniqueEmails.size} vendor email(s)?`,
        );
        if (!ok) return;

        router.post(
            "/deposit-refund/request-bank-info",
            {
                application_codes: selectedRows.map((r) => r.application_code),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Bank information request emails sent.");
                },
                onError: (errors) => {
                    const msg =
                        (errors as any)?.vendor ??
                        (errors as any)?.application_code ??
                        "Failed to send bank information request email.";
                    toast.error(Array.isArray(msg) ? msg[0] : String(msg));
                },
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Deposit Refund</h2>}
        >
            <Head title="Deposit Refund" />

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
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                disabled={!eventId}
                                onClick={() => {
                                    router.get(
                                        "/deposit-refund",
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

                    {selectedEvent && (
                        <div className="text-sm text-muted-foreground">
                            Deposit amount for this event:{" "}
                            <span className="font-medium text-foreground">
                                {formatAmount(depositAmount)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="rounded-lg border bg-white">
                    <div className="flex justify-between items-center">
                        <div className="border-b px-4 py-3 text-sm font-semibold">
                            Approved Applications
                        </div>
                        <div className="px-4 py-3">
                            {applications.length > 0 ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            selectedApplicationCodes.size === 0
                                        }
                                        onClick={bulkRequestBankInfo}
                                    >
                                        Request Bank Info
                                    </Button>
                                    <a
                                        href={exportUrl || "#"}
                                        className={cn(
                                            buttonVariants({
                                                variant: "outline",
                                            }),
                                            !eventId &&
                                                "pointer-events-none opacity-50",
                                        )}
                                    >
                                        Export
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectAllChecked}
                                                disabled={
                                                    selectableApplicationCodes.length ===
                                                    0
                                                }
                                                onChange={toggleSelectAll}
                                            />
                                            <span>Select all</span>
                                        </label>
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Application Code
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Vendor
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Payment Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Payment Amount
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Bank Name
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Account Name
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Account No
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Refund Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            {selectedEventId
                                                ? "No approved applications found."
                                                : "Select an event to view results."}
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((row) => (
                                        <tr
                                            key={row.application_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedApplicationCodes.has(
                                                        row.application_code,
                                                    )}
                                                    disabled={!row.is_paid}
                                                    onChange={() =>
                                                        toggleRow(
                                                            row.application_code,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                <Link
                                                    href={`/applications/${row.application_id}`}
                                                    className="underline"
                                                >
                                                    {row.application_code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.vendor_name ?? "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                        row.is_paid
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-amber-100 text-amber-800",
                                                    )}
                                                >
                                                    {row.is_paid
                                                        ? "PAID"
                                                        : "UNPAID"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatAmount(
                                                    row.payment_amount,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.vendor_bank_name ?? "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.vendor_bank_account_name ??
                                                    "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.vendor_bank_account_no ??
                                                    "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.refund_status
                                                    ? row.refund_status.toUpperCase()
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!row.is_paid}
                                                    onClick={() =>
                                                        openRefundModal(row)
                                                    }
                                                >
                                                    Refund
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Refund</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Application:{" "}
                            <span className="font-medium text-foreground">
                                {activeRow?.application_code ?? "-"}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Refund Status
                            </label>
                            <select
                                className={selectClassName}
                                value={refundForm.data.refund_status}
                                onChange={(e) =>
                                    refundForm.setData(
                                        "refund_status",
                                        e.target
                                            .value as RefundFormData["refund_status"],
                                    )
                                }
                            >
                                <option value="refunded">Refunded</option>
                                <option value="forfeited">Forfeited</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Refund Amount
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className={inputClassName}
                                value={refundForm.data.refund_amount}
                                onChange={(e) =>
                                    refundForm.setData(
                                        "refund_amount",
                                        e.target.value,
                                    )
                                }
                                disabled={!refundDetailsRequired}
                            />
                            {refundForm.errors.refund_amount ? (
                                <p className="text-sm text-destructive">
                                    {refundForm.errors.refund_amount}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Refund Date
                            </label>
                            <input
                                type="date"
                                className={inputClassName}
                                value={refundForm.data.refund_date}
                                onChange={(e) =>
                                    refundForm.setData(
                                        "refund_date",
                                        e.target.value,
                                    )
                                }
                                disabled={!refundDetailsRequired}
                            />
                            {refundForm.errors.refund_date ? (
                                <p className="text-sm text-destructive">
                                    {refundForm.errors.refund_date}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Refund File
                            </label>
                            <input
                                type="file"
                                className={inputClassName}
                                onChange={(e) =>
                                    refundForm.setData(
                                        "refund_file",
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                disabled={!refundDetailsRequired}
                            />
                            {refundForm.errors.refund_file ? (
                                <p className="text-sm text-destructive">
                                    {refundForm.errors.refund_file}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Comment
                            </label>
                            <textarea
                                className={inputClassName}
                                rows={4}
                                value={refundForm.data.refund_comment}
                                onChange={(e) =>
                                    refundForm.setData(
                                        "refund_comment",
                                        e.target.value,
                                    )
                                }
                            />
                            {refundForm.errors.refund_comment ? (
                                <p className="text-sm text-destructive">
                                    {refundForm.errors.refund_comment}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowRefundModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={refundForm.processing}
                            onClick={() =>
                                refundForm.post("/deposit-refund", {
                                    preserveScroll: true,
                                    forceFormData: true,
                                    onSuccess: () => {
                                        setShowRefundModal(false);
                                    },
                                })
                            }
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
