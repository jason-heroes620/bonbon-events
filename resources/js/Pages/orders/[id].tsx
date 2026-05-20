import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Order = {
    order_id: string;
    order_no: string;
    application_id: string;
    application_code: string;
    total_price: number | string;
    discount_price: number | string;
    is_paid: boolean;
    is_active: boolean;
    created_at?: string;
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

type OrderShowProps = {
    order: Order;
    invoice: Invoice;
    items: OrderItem[];
};

export default function OrderShow({ order, invoice, items }: OrderShowProps) {
    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n)) return n.toFixed(2);
        return String(value);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Orders</h2>}>
            <Head title={`Order ${order.order_no}`} />

            <div className="max-w-5xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">
                            Order {order.order_no}
                        </h1>
                        <div className="text-sm text-muted-foreground">
                            Application {order.application_code}
                        </div>
                    </div>
                    <Link
                        href="/orders"
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
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                        <div className="text-sm text-muted-foreground">
                            Order Date
                        </div>
                        <div className="text-sm">{order.created_at ?? "-"}</div>
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

                <div className="rounded-lg border bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-sm font-medium">Invoice</div>
                            <div className="text-sm text-muted-foreground">
                                {invoice ? invoice.invoice_no : "Not generated"}
                            </div>
                        </div>
                        {invoice ? (
                            <Link
                                href={`/invoices/${invoice.invoice_id}`}
                                className={buttonVariants({ variant: "outline" })}
                            >
                                View Invoice
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

