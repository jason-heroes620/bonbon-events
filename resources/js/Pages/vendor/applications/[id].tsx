import PublicSiteLayout from "@/components/PublicSiteLayout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Head, Link, router } from "@inertiajs/react";
import { format } from "date-fns";

type Application = {
    application_id: string;
    application_code: string;
    application_status: string;
    created_at: string;
};

type Vendor = {
    vendor_id: string;
    vendor_name: string | null;
    vendor_contact_person: string | null;
    vendor_contact_no: string | null;
    vendor_email: string | null;
    business_name: string | null;
    business_registration_no: string | null;
} | null;

type ApplicationEventRow = {
    application_event_id: string;
    event_id: string;
    event_name: string;
    event_date: string | null;
    event_time: string | null;
    venue: string | null;
    participants: number;
    no_of_booths: number;
    requirements: string | null;
    plug: boolean;
    application_status: string;
};

type Order = {
    order_id: string;
    order_no: string;
    application_code: string;
    sub_total: number | string;
    discount_price: number | string;
    charges_total: number | string;
    total_price: number | string;
    is_paid: boolean;
    created_at: string;
} | null;

type Invoice = {
    invoice_id: string;
    invoice_no: string;
    invoice_status: string;
    invoice_amount: number | string;
    invoice_date: string | null;
} | null;

type Payment = {
    payment_id: string;
    transaction_id: string;
    payment_amount: number | string;
    payment_date: string;
    payment_method: string | null;
    payment_file: string | null;
} | null;

type VendorApplicationShowProps = {
    application: Application;
    vendor: Vendor;
    applicationEvents: ApplicationEventRow[];
    order: Order;
    invoice: Invoice;
    payment: Payment;
};

export default function VendorApplicationShow({
    application,
    vendor,
    applicationEvents,
    order,
    invoice,
    payment,
}: VendorApplicationShowProps) {
    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n)) return n.toFixed(2);
        return String(value);
    };

    return (
        <PublicSiteLayout>
            <Head title={`Application ${application.application_code}`} />

            <div className="mx-auto max-w-6xl p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Application {application.application_code}
                        </h2>
                        <div className="text-sm text-muted-foreground">
                            Created{" "}
                            {application.created_at
                                ? format(
                                      new Date(application.created_at),
                                      "MMM d, y",
                                  )
                                : "-"}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/vendor/applications"
                            className={buttonVariants({ variant: "outline" })}
                        >
                            Back
                        </Link>
                        {order?.order_id ? (
                            <Link
                                href={`/vendor/orders/${order.order_id}`}
                                className={buttonVariants()}
                            >
                                View Order
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Status
                        </div>
                        <div className="mt-1">
                            <span
                                className={cn(
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                    application.application_status ===
                                        "approved"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : application.application_status ===
                                            "rejected"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-amber-100 text-amber-800",
                                )}
                            >
                                {application.application_status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Order
                        </div>
                        <div className="text-sm font-medium">
                            {order?.order_no ?? "-"}
                        </div>
                        <div className="mt-1">
                            {order ? (
                                <span
                                    className={cn(
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                        order.is_paid
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800",
                                    )}
                                >
                                    {order.is_paid ? "Paid" : "Unpaid"}
                                </span>
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    Not generated
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Invoice
                        </div>
                        <div className="text-sm font-medium">
                            {invoice?.invoice_no ?? "-"}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {invoice?.invoice_status ?? "Not generated"}
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-white">
                    <div className="border-b px-4 py-3">
                        <div className="text-sm font-semibold">
                            Application Event
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Event
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Participants
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Booths
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Plug
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Requirements
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {applicationEvents.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No events.
                                        </td>
                                    </tr>
                                ) : (
                                    applicationEvents.map((row) => (
                                        <tr
                                            key={row.application_event_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {row.event_name}
                                                <div className="text-xs text-muted-foreground">
                                                    {row.venue ?? "-"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {row.event_date ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {row.participants}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {row.no_of_booths}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.plug ? "Yes" : "No"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.requirements?.trim() === ""
                                                    ? "-"
                                                    : row.requirements}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {order ? (
                    <div className="rounded-lg border bg-white p-4 space-y-2">
                        <div className="text-sm font-semibold">
                            Order Summary
                        </div>
                        <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span className="font-medium">
                                    {formatAmount(order.sub_total)}
                                </span>
                            </div>
                            {Number(order.discount_price ?? 0) > 0 ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Discount
                                    </span>
                                    <span className="font-medium">
                                        -{formatAmount(order.discount_price)}
                                    </span>
                                </div>
                            ) : null}
                            {Number(order.charges_total ?? 0) > 0 ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Charges
                                    </span>
                                    <span className="font-medium">
                                        {formatAmount(order.charges_total)}
                                    </span>
                                </div>
                            ) : null}
                            <div className="flex items-center justify-between border-t pt-2">
                                <span className="font-semibold">Total</span>
                                <span className="font-semibold">
                                    {formatAmount(order.total_price)}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : null}

                {payment ? (
                    <div className="rounded-lg border bg-white p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <div className="text-sm font-semibold">
                                    Payment
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Transaction ID: {payment.transaction_id}
                                </div>
                            </div>
                            {payment.payment_file ? (
                                <a
                                    href={payment.payment_file}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    })}
                                >
                                    View File
                                </a>
                            ) : null}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3 text-sm">
                            <div>
                                <span className="text-muted-foreground">
                                    Amount:
                                </span>{" "}
                                {formatAmount(payment.payment_amount)}
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Method:
                                </span>{" "}
                                {payment.payment_method ?? "-"}
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Date:
                                </span>{" "}
                                {payment.payment_date
                                    ? format(
                                          new Date(payment.payment_date),
                                          "MMM d, y",
                                      )
                                    : "-"}
                            </div>
                        </div>
                    </div>
                ) : null}

                {!order?.is_paid ? (
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            onClick={() => {
                                router.visit(
                                    `/payments/${application.application_code}`,
                                );
                            }}
                        >
                            Open Payment Page
                        </Button>
                    </div>
                ) : null}
            </div>
        </PublicSiteLayout>
    );
}
