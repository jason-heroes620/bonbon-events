import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Invoice = {
    invoice_id: string;
    invoice_no: string;
    invoice_date: string;
    discount_amount: number | string;
    invoice_amount: number | string;
    invoice_status: string;
    order_id: string;
    application_id: string;
    created_at?: string;
};

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

type InvoiceShowProps = {
    invoice: Invoice;
    order: Order;
    items: OrderItem[];
};

export default function InvoiceShow({ invoice, order, items }: InvoiceShowProps) {
    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n)) return n.toFixed(2);
        return String(value);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Invoices</h2>}>
            <Head title={`Invoice ${invoice.invoice_no}`} />

            <div className="max-w-5xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">
                            Invoice {invoice.invoice_no}
                        </h1>
                        <div className="text-sm text-muted-foreground">
                            {order?.order_no ? `Order ${order.order_no}` : ""}
                        </div>
                    </div>
                    <Link
                        href="/invoices"
                        className={buttonVariants({ variant: "outline" })}
                    >
                        Back
                    </Link>
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
                                    invoice.invoice_status === "paid"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : invoice.invoice_status === "canceled"
                                          ? "bg-gray-100 text-gray-800"
                                          : "bg-amber-100 text-amber-800",
                                )}
                            >
                                {invoice.invoice_status}
                            </span>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Invoice Amount
                        </div>
                        <div className="text-lg font-semibold">
                            {formatAmount(invoice.invoice_amount)}
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Invoice Date
                        </div>
                        <div className="text-sm">{invoice.invoice_date}</div>
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Application ID:
                            </span>{" "}
                            {invoice.application_id}
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">
                                Discount:
                            </span>{" "}
                            {formatAmount(invoice.discount_amount)}
                        </div>
                    </div>

                    {order?.order_id ? (
                        <div className="mt-3">
                            <Link
                                href={`/orders/${order.order_id}`}
                                className={buttonVariants({ variant: "outline" })}
                            >
                                View Order
                            </Link>
                        </div>
                    ) : null}
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
            </div>
        </AuthenticatedLayout>
    );
}

