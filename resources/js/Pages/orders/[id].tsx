import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Order = {
    order_id: string;
    order_no: string;
    application_id: string;
    application_code: string;
    sub_total: number | string;
    total_price: number | string;
    discount_price: number | string;
    charges_total: number | string;
    is_paid: boolean;
    is_active: boolean;
    created_at: string;
};

type Invoice = {
    invoice_id: string;
    invoice_no: string;
    invoice_date: string;
    discount_amount: number | string;
    invoice_amount: number | string;
    invoice_status: string;
} | null;

type OrderItem = {
    order_item_id: string;
    quantity: number;
    price: number | string;
    item_description: string;
};

type OrderCharge = {
    order_charge_id: string;
    charges_name: string;
    charges_type: "F" | "P";
    charges_rate: number | string;
    charges_amount: number | string;
    sort_order: number;
};

type Payment = {
    payment_id: string;
    transaction_id: string;
    payment_amount: number | string;
    payment_date: string;
    payment_method: string | null;
    payment_file: string | null;
} | null;

type OrderShowProps = {
    order: Order;
    invoice: Invoice;
    items: OrderItem[];
    charges: OrderCharge[];
    payment: Payment;
};

export default function OrderShow({
    order,
    invoice,
    items,
    charges,
    payment,
}: OrderShowProps) {
    const [showUpdatePayment, setShowUpdatePayment] = useState(false);
    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n)) return n.toFixed(2);
        return String(value);
    };

    const today = new Date().toISOString().split("T")[0] ?? "";
    const paymentForm = useForm<{
        transaction_id: string;
        payment_amount: string;
        payment_date: string;
        payment_method: string;
        payment_file: File | null;
    }>({
        transaction_id: payment?.transaction_id ?? "",
        payment_amount: String(order?.total_price ?? 0),
        payment_date: today,
        payment_method: payment?.payment_method ?? "",
        payment_file: null,
    });

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Orders</h2>}
        >
            <Head title={`Order ${order.order_no}`} />

            <div className="max-w-5xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">
                            Order No: {order.order_no}
                        </h1>
                        <div className="text-sm text-muted-foreground">
                            Application{" "}
                            <Link
                                className={buttonVariants({
                                    variant: "link",
                                })}
                                href={`/applications/${order.application_id}`}
                            >
                                {order.application_code}
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
                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Total
                        </div>
                        <div className="text-lg font-semibold">
                            {formatAmount(order.total_price)}
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Paid Status
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="mt-1">
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
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={order.is_paid}
                                onClick={() => setShowUpdatePayment(true)}
                            >
                                Update Payment
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Order Date
                        </div>
                        <div className="text-sm">
                            {format(order.created_at, "MMM d, y") ?? "-"}
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

                <div className="rounded-lg border bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Subtotal
                        </div>
                        <div className="text-sm font-medium">
                            {formatAmount(order.sub_total)}
                        </div>
                    </div>

                    {Number(order.discount_price ?? 0) > 0 ? (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Discount
                            </div>
                            <div className="text-sm font-medium">
                                -{formatAmount(order.discount_price)}
                            </div>
                        </div>
                    ) : null}

                    {charges.map((c) => (
                        <div
                            key={c.order_charge_id}
                            className="flex items-center justify-between"
                        >
                            <div className="text-sm text-muted-foreground">
                                {c.charges_name}
                                {c.charges_type === "P" ? (
                                    <span>
                                        {" "}
                                        ({formatAmount(c.charges_rate)}%)
                                    </span>
                                ) : null}
                            </div>
                            <div className="text-sm font-medium">
                                {formatAmount(c.charges_amount)}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm font-semibold">Total</div>
                        <div className="text-sm font-semibold">
                            {formatAmount(order.total_price)}
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-sm font-medium">Invoice</div>
                            <div className="text-sm text-muted-foreground">
                                {invoice ? invoice.invoice_no : "Not generated"}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {invoice ? (
                                <Link
                                    href={`/invoices/${invoice.invoice_id}`}
                                    className={buttonVariants({
                                        variant: "outline",
                                    })}
                                >
                                    View Invoice
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">
                            Payment Information
                        </h2>
                        {payment?.payment_file ? (
                            <a
                                href={payment.payment_file}
                                target="_blank"
                                rel="noreferrer"
                                className={buttonVariants({
                                    variant: "link",
                                    size: "sm",
                                })}
                            >
                                View Payment File
                            </a>
                        ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded border p-3">
                            <div className="text-xs text-muted-foreground">
                                Transaction ID
                            </div>
                            <div className="text-sm font-medium">
                                {payment?.transaction_id ?? "-"}
                            </div>
                        </div>
                        <div className="rounded border p-3">
                            <div className="text-xs text-muted-foreground">
                                Amount
                            </div>
                            <div className="text-sm font-medium">
                                {payment?.payment_amount != null
                                    ? formatAmount(payment.payment_amount)
                                    : "-"}
                            </div>
                        </div>
                        <div className="rounded border p-3">
                            <div className="text-xs text-muted-foreground">
                                Payment Date
                            </div>
                            <div className="text-sm font-medium">
                                {payment?.payment_date
                                    ? format(
                                          new Date(payment.payment_date),
                                          "MMM d, y",
                                      )
                                    : "-"}
                            </div>
                        </div>
                        <div className="rounded border p-3">
                            <div className="text-xs text-muted-foreground">
                                Payment Method
                            </div>
                            <div className="text-sm font-medium">
                                {payment?.payment_method ?? "-"}
                            </div>
                        </div>
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
                            disabled={paymentForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={paymentForm.processing}
                            onClick={() =>
                                paymentForm.post(
                                    `/orders/${order.order_id}/update-payment`,
                                    {
                                        forceFormData: true,
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setShowUpdatePayment(false);
                                            paymentForm.reset();
                                        },
                                        onError: (errors) => {
                                            const first =
                                                errors?.transaction_id ??
                                                errors?.payment_amount ??
                                                errors?.payment_date ??
                                                errors?.payment_method ??
                                                errors?.payment_file ??
                                                errors?.order ??
                                                "Failed to update payment.";
                                            const msg = Array.isArray(first)
                                                ? first[0]
                                                : String(first);
                                            if (
                                                typeof window !== "undefined" &&
                                                typeof window.alert ===
                                                    "function"
                                            ) {
                                                window.alert(msg);
                                            }
                                        },
                                    },
                                )
                            }
                        >
                            {paymentForm.processing ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
