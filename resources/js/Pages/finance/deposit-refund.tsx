import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Head, Link, router } from "@inertiajs/react";
import { format } from "date-fns";
import { useMemo, useState } from "react";

type EventOption = {
    event_id: string;
    event_name: string;
    event_start_date: string | null;
};

type DepositRefundRow = {
    application_id: string;
    application_code: string;
    vendor_id: string;
    vendor_name: string | null;
    order_id: string | null;
    is_paid: boolean;
    payment_amount: number | string;
    vendor_bank_name: string | null;
    vendor_bank_account_name: string | null;
    vendor_bank_account_no: string | null;
};

type DepositRefundPageProps = {
    events: EventOption[];
    selectedEventId: string | null;
    depositAmount: number | string;
    applications: DepositRefundRow[];
};

const selectClassName =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function DepositRefund({
    events,
    selectedEventId,
    depositAmount,
    applications,
}: DepositRefundPageProps) {
    const [eventId, setEventId] = useState(selectedEventId ?? "");

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
                            {applications.length > 0 && (
                                <a
                                    href={exportUrl || "#"}
                                    className={cn(
                                        buttonVariants({ variant: "outline" }),
                                        !eventId &&
                                            "pointer-events-none opacity-50",
                                    )}
                                >
                                    Export
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
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
                                </tr>
                            </thead>
                            <tbody>
                                {applications.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
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
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
