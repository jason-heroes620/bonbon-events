import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useMemo, useState } from "react";

type Invoice = {
    invoice_id: string;
    invoice_no: string;
    invoice_date: string;
    discount_amount: number | string;
    invoice_amount: number | string;
    invoice_status: string;
    order_id: string;
    subtotal: number | string;
    discount: number | string;
    total: number | string;
    created_at?: string;
};

type Order = {
    order_id: string;
    order_no: string;
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

type InvoiceCharge = {
    invoice_charge_id: string;
    charges_name: string;
    charges_type: "F" | "P";
    charges_rate: number | string;
    charges_amount: number | string;
    sort_order: number;
};

type Vendor = {
    vendor_id: string;
    vendor_name: string;
};

type Payment = {
    payment_id: string;
    transaction_id: string;
    payment_amount: number | string;
    payment_date: string;
    payment_method: string | null;
    payment_file: string | null;
} | null;

type InvoiceShowProps = {
    invoice: Invoice;
    order: Order;
    items: OrderItem[];
    charges: InvoiceCharge[];
    subtotal: number | string;
    discount: number | string;
    total: number | string;
    eventName: string | string;
    vendor: Vendor;
    payment: Payment;
};

export default function InvoiceShow({
    invoice,
    order,
    items,
    charges,
    subtotal,
    discount,
    total,
    eventName,
    vendor,
    payment,
}: InvoiceShowProps) {
    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n))
            return n.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        return String(value);
    };

    const [showUpdatePayment, setShowUpdatePayment] = useState(false);

    const invoiceStatusLower = useMemo(
        () => String(invoice.invoice_status ?? "").toLowerCase(),
        [invoice.invoice_status],
    );

    const today = new Date().toISOString().split("T")[0] ?? "";

    const paymentForm = useForm<{
        transaction_id: string;
        payment_amount: string;
        payment_date: string;
        payment_method: string;
        payment_file: File | null;
    }>({
        transaction_id: payment?.transaction_id ?? "",
        payment_amount: String(
            invoice.invoice_amount ?? order?.total_price ?? 0,
        ),
        payment_date: today,
        payment_method: payment?.payment_method ?? "",
        payment_file: null,
    });

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Invoices</h2>}
        >
            <Head title={`Invoice ${invoice.invoice_no}`} />

            <div className="max-w-5xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">
                            Invoice {invoice.invoice_no}
                        </h1>
                        <div>
                            <span className="text-sm text-muted-foreground">
                                Order No:
                            </span>
                            <Link
                                href={`/orders/${order?.order_id}`}
                                className={buttonVariants({
                                    variant: "link",
                                })}
                            >
                                {order?.order_no ? ` ${order.order_no}` : ""}
                            </Link>
                        </div>
                    </div>
                    <Link
                        href="#"
                        onClick={() => window.history.back()}
                        className={buttonVariants({ variant: "outline" })}
                    >
                        Back
                    </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="flex flex-row items-center justify-between rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Status
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                    invoiceStatusLower === "paid"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : invoiceStatusLower === "canceled"
                                          ? "bg-gray-100 text-gray-800"
                                          : "bg-amber-100 text-amber-800",
                                )}
                            >
                                {invoice.invoice_status}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowUpdatePayment(true)}
                            >
                                Update Payment
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-row items-center justify-between rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Invoice Amount
                        </div>
                        <div className="text-lg font-semibold">
                            {formatAmount(invoice.invoice_amount)}
                        </div>
                    </div>
                    <div className="flex flex-row items-center justify-between rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Invoice Date
                        </div>
                        <div className="text-sm">
                            {formatDate(invoice.invoice_date, "MMM d, yyyy")}
                        </div>
                    </div>
                </div>

                {payment?.payment_file ? (
                    <div className="rounded-lg border bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm text-muted-foreground">
                                Payment File
                            </div>
                            <a
                                href={payment.payment_file}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                View file
                            </a>
                        </div>
                    </div>
                ) : null}

                <div className="rounded-lg border bg-white p-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Vendor:
                            </span>{" "}
                            {vendor.vendor_name}
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Event Name:
                            </span>{" "}
                            {eventName}
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-white">
                    <div className="border-b px-4 py-3">
                        <div className="text-sm font-medium">Items</div>
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
                                        Price
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No items.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div>
                        <span className="text-sm font-semibold">
                            Sub Total: {formatAmount(subtotal)}
                        </span>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Discount:</span>{" "}
                        {formatAmount(discount)}
                    </div>
                </div>
                {charges.map((c) => (
                    <div key={c.invoice_charge_id} className="flex justify-end">
                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                {c.charges_name}
                                {c.charges_type === "P" ? (
                                    <span>
                                        {" "}
                                        ({formatAmount(c.charges_rate)}%)
                                    </span>
                                ) : null}
                                :
                            </span>{" "}
                            {formatAmount(c.charges_amount)}
                        </div>
                    </div>
                ))}
                <div className="flex justify-end">
                    <div className="text-base font-semibold">
                        Total: {formatAmount(total)}
                    </div>
                </div>
            </div>

            <Dialog
                open={showUpdatePayment}
                onOpenChange={setShowUpdatePayment}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Update Payment</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Transaction ID
                            </label>
                            <Input
                                value={paymentForm.data.transaction_id}
                                onChange={(e) =>
                                    paymentForm.setData(
                                        "transaction_id",
                                        e.target.value,
                                    )
                                }
                            />
                            {paymentForm.errors.transaction_id ? (
                                <p className="text-sm text-destructive">
                                    {paymentForm.errors.transaction_id}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Payment Amount
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={paymentForm.data.payment_amount}
                                onChange={(e) =>
                                    paymentForm.setData(
                                        "payment_amount",
                                        e.target.value,
                                    )
                                }
                            />
                            {paymentForm.errors.payment_amount ? (
                                <p className="text-sm text-destructive">
                                    {paymentForm.errors.payment_amount}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Payment Date
                            </label>
                            <Input
                                type="date"
                                value={paymentForm.data.payment_date}
                                onChange={(e) =>
                                    paymentForm.setData(
                                        "payment_date",
                                        e.target.value,
                                    )
                                }
                            />
                            {paymentForm.errors.payment_date ? (
                                <p className="text-sm text-destructive">
                                    {paymentForm.errors.payment_date}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Payment Method
                            </label>
                            <Input
                                value={paymentForm.data.payment_method}
                                onChange={(e) =>
                                    paymentForm.setData(
                                        "payment_method",
                                        e.target.value,
                                    )
                                }
                            />
                            {paymentForm.errors.payment_method ? (
                                <p className="text-sm text-destructive">
                                    {paymentForm.errors.payment_method}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Payment File
                            </label>
                            <Input
                                type="file"
                                onChange={(e) =>
                                    paymentForm.setData(
                                        "payment_file",
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            {paymentForm.errors.payment_file ? (
                                <p className="text-sm text-destructive">
                                    {paymentForm.errors.payment_file}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowUpdatePayment(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={paymentForm.processing}
                            onClick={() =>
                                paymentForm.post(
                                    `/invoices/${invoice.invoice_id}/update-payment`,
                                    {
                                        forceFormData: true,
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setShowUpdatePayment(false);
                                            paymentForm.reset("payment_file");
                                        },
                                    },
                                )
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
