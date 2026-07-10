import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category, User, Vendor } from "@/types";
import type { FormEvent } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import axios from "axios";
import { toast } from "sonner";

type VendorFormData = {
    user_id: string;
    vendor_name: string;
    vendor_email: string;
    vendor_contact_person: string;
    vendor_contact_no: string;
    business_name: string;
    business_registration_no: string;
    business_description: string;
    category: string[];
    social_medias: {
        instagram: string;
        facebook: string;
        youtube: string;
        tiktok: string;
        xiaohongshu: string;
    };
    vendor_bank_name?: string;
    vendor_bank_account_no?: string;
    vendor_bank_account_name?: string;
    is_active: boolean;
    vendor_status: string;
};

type VendorFormProps = {
    vendor?: Vendor;
    users: Pick<User, "user_id" | "name" | "email">[];
    categories: Pick<Category, "category_id" | "category_name">[];
    submitUrl: string;
    method: "post" | "put";
    submitLabel: string;
    cancelUrl: string;
};

const textareaClassName =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function VendorForm({
    vendor,
    users,
    categories,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: VendorFormProps) {
    const defaultCategory = Array.isArray(vendor?.category)
        ? vendor?.category
        : typeof vendor?.category === "string" && vendor.category.trim() !== ""
          ? vendor.category.split(",").map((s) => s.trim())
          : [];

    const vendorSocial = (vendor?.social_medias ?? {}) as Partial<
        VendorFormData["social_medias"]
    >;

    const form = useForm<VendorFormData>({
        user_id: vendor?.user_id ?? "",
        vendor_name: vendor?.vendor_name ?? "",
        vendor_email: vendor?.vendor_email ?? "",
        vendor_contact_person: vendor?.vendor_contact_person ?? "",
        vendor_contact_no: vendor?.vendor_contact_no ?? "",
        business_name: vendor?.business_name ?? "",
        business_registration_no: vendor?.business_registration_no ?? "",
        business_description: vendor?.business_description ?? "",
        category: defaultCategory,
        social_medias: {
            instagram: vendorSocial.instagram ?? "",
            facebook: vendorSocial.facebook ?? "",
            youtube: vendorSocial.youtube ?? "",
            tiktok: vendorSocial.tiktok ?? "",
            xiaohongshu: vendorSocial.xiaohongshu ?? "",
        },
        vendor_bank_name: vendor?.vendor_bank_name ?? "",
        vendor_bank_account_no: vendor?.vendor_bank_account_no ?? "",
        vendor_bank_account_name: vendor?.vendor_bank_account_name ?? "",
        is_active: vendor?.is_active ?? true,
        vendor_status: vendor?.vendor_status ?? "",
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (method === "post") {
            form.post(submitUrl);
            return;
        }

        form.put(submitUrl);
    };

    const handleApprove = async () => {
        if (!confirm("Are you sure you want to approve this vendor?")) {
            return;
        }
        router.post(`${submitUrl}/approve`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Vendor approved successfully");
                router.reload();
            },
            onError: () => {
                toast.error("Failed to approve vendor");
            },
        });
    };

    const handleReject = async () => {
        if (!confirm("Are you sure you want to reject this vendor?")) {
            return;
        }
        router.post(`${submitUrl}/reject`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Vendor rejected successfully");
                router.reload();
            },
            onError: () => {
                toast.error("Failed to reject vendor");
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="user_id" className="text-sm font-medium">
                        User
                    </label>
                    <select
                        id="user_id"
                        className={selectClassName}
                        value={form.data.user_id}
                        onChange={(e) =>
                            form.setData("user_id", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.user_id)}
                        disabled={method === "put"}
                    >
                        <option value="" disabled>
                            Select a user
                        </option>
                        {users.map((user) => (
                            <option key={user.user_id} value={user.user_id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>
                    {form.errors.user_id ? (
                        <p className="text-sm text-red-600">
                            {form.errors.user_id}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label
                        htmlFor="vendor_name"
                        className="text-sm font-medium"
                    >
                        Vendor Name
                    </label>
                    <Input
                        id="vendor_name"
                        value={form.data.vendor_name}
                        onChange={(e) =>
                            form.setData("vendor_name", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.vendor_name)}
                    />
                    {form.errors.vendor_name ? (
                        <p className="text-sm text-red-600">
                            {form.errors.vendor_name}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="vendor_email"
                        className="text-sm font-medium"
                    >
                        Vendor Email
                    </label>
                    <Input
                        id="vendor_email"
                        type="email"
                        value={form.data.vendor_email}
                        onChange={(e) =>
                            form.setData("vendor_email", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.vendor_email)}
                    />
                    {form.errors.vendor_email ? (
                        <p className="text-sm text-red-600">
                            {form.errors.vendor_email}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="vendor_contact_no"
                        className="text-sm font-medium"
                    >
                        Contact No
                    </label>
                    <Input
                        id="vendor_contact_no"
                        value={form.data.vendor_contact_no}
                        onChange={(e) =>
                            form.setData("vendor_contact_no", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.vendor_contact_no)}
                    />
                    {form.errors.vendor_contact_no ? (
                        <p className="text-sm text-red-600">
                            {form.errors.vendor_contact_no}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="vendor_contact_person"
                        className="text-sm font-medium"
                    >
                        Contact Person
                    </label>
                    <Input
                        id="vendor_contact_person"
                        value={form.data.vendor_contact_person}
                        onChange={(e) =>
                            form.setData(
                                "vendor_contact_person",
                                e.target.value,
                            )
                        }
                        aria-invalid={Boolean(
                            form.errors.vendor_contact_person,
                        )}
                    />
                    {form.errors.vendor_contact_person ? (
                        <p className="text-sm text-red-600">
                            {form.errors.vendor_contact_person}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="business_name"
                        className="text-sm font-medium"
                    >
                        Company Name
                    </label>
                    <Input
                        id="business_name"
                        value={form.data.business_name}
                        onChange={(e) =>
                            form.setData("business_name", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.business_name)}
                    />
                    {form.errors.business_name ? (
                        <p className="text-sm text-red-600">
                            {form.errors.business_name}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="business_registration_no"
                        className="text-sm font-medium"
                    >
                        Business Registration No
                    </label>
                    <Input
                        id="business_registration_no"
                        value={form.data.business_registration_no}
                        onChange={(e) =>
                            form.setData(
                                "business_registration_no",
                                e.target.value,
                            )
                        }
                        aria-invalid={Boolean(
                            form.errors.business_registration_no,
                        )}
                    />
                    {form.errors.business_registration_no ? (
                        <p className="text-sm text-red-600">
                            {form.errors.business_registration_no}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label
                        htmlFor="business_description"
                        className="text-sm font-medium"
                    >
                        Business Description
                    </label>
                    <textarea
                        id="business_description"
                        className={textareaClassName}
                        rows={4}
                        value={form.data.business_description}
                        onChange={(e) =>
                            form.setData("business_description", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.business_description)}
                    />
                    {form.errors.business_description ? (
                        <p className="text-sm text-red-600">
                            {form.errors.business_description}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="category" className="text-sm font-medium">
                        Category
                    </label>
                    <MultiSelect
                        options={categories.map((category) => ({
                            label: category.category_name,
                            value: category.category_id,
                        }))}
                        onValueChange={(value) =>
                            form.setData("category", value)
                        }
                        defaultValue={form.data.category}
                        placeholder="Select categories"
                        variant="default"
                        maxSelected={categories.length}
                        maxCount={3}
                        aria-invalid={Boolean(form.errors.category)}
                    />
                    {form.errors.category ? (
                        <p className="text-sm text-red-600">
                            {form.errors.category}
                        </p>
                    ) : null}
                </div>

                <hr className="md:col-span-2" />
                <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">Social Medias</div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label
                                htmlFor="social_instagram"
                                className="text-sm"
                            >
                                Instagram
                            </label>
                            <Input
                                id="social_instagram"
                                value={form.data.social_medias.instagram}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        instagram: e.target.value,
                                    })
                                }
                                aria-invalid={Boolean(
                                    (form.errors as any)[
                                        "social_medias.instagram"
                                    ],
                                )}
                            />
                            {(form.errors as any)["social_medias.instagram"] ? (
                                <p className="text-sm text-red-600">
                                    {
                                        (form.errors as any)[
                                            "social_medias.instagram"
                                        ]
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="social_facebook"
                                className="text-sm"
                            >
                                Facebook
                            </label>
                            <Input
                                id="social_facebook"
                                value={form.data.social_medias.facebook}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        facebook: e.target.value,
                                    })
                                }
                                aria-invalid={Boolean(
                                    (form.errors as any)[
                                        "social_medias.facebook"
                                    ],
                                )}
                            />
                            {(form.errors as any)["social_medias.facebook"] ? (
                                <p className="text-sm text-red-600">
                                    {
                                        (form.errors as any)[
                                            "social_medias.facebook"
                                        ]
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="social_youtube" className="text-sm">
                                YouTube
                            </label>
                            <Input
                                id="social_youtube"
                                value={form.data.social_medias.youtube}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        youtube: e.target.value,
                                    })
                                }
                                aria-invalid={Boolean(
                                    (form.errors as any)[
                                        "social_medias.youtube"
                                    ],
                                )}
                            />
                            {(form.errors as any)["social_medias.youtube"] ? (
                                <p className="text-sm text-red-600">
                                    {
                                        (form.errors as any)[
                                            "social_medias.youtube"
                                        ]
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="social_tiktok" className="text-sm">
                                TikTok
                            </label>
                            <Input
                                id="social_tiktok"
                                value={form.data.social_medias.tiktok}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        tiktok: e.target.value,
                                    })
                                }
                                aria-invalid={Boolean(
                                    (form.errors as any)[
                                        "social_medias.tiktok"
                                    ],
                                )}
                            />
                            {(form.errors as any)["social_medias.tiktok"] ? (
                                <p className="text-sm text-red-600">
                                    {
                                        (form.errors as any)[
                                            "social_medias.tiktok"
                                        ]
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1 ">
                            <label
                                htmlFor="social_xiaohongshu"
                                className="text-sm"
                            >
                                Xiaohongshu
                            </label>
                            <Input
                                id="social_xiaohongshu"
                                value={form.data.social_medias.xiaohongshu}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        xiaohongshu: e.target.value,
                                    })
                                }
                                aria-invalid={Boolean(
                                    (form.errors as any)[
                                        "social_medias.xiaohongshu"
                                    ],
                                )}
                            />
                            {(form.errors as any)[
                                "social_medias.xiaohongshu"
                            ] ? (
                                <p className="text-sm text-red-600">
                                    {
                                        (form.errors as any)[
                                            "social_medias.xiaohongshu"
                                        ]
                                    }
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <hr />

            <div className="space-y-1 gap-4 flex flex-col md:grid md:grid-cols-2">
                <div className="md:col-span-2">
                    <span>
                        Bank Account Information (for deposit refund purpose)
                    </span>
                </div>
                <div>
                    <label htmlFor="vendor_bank_name" className="text-sm">
                        Bank Name
                    </label>
                    <Input
                        id="vendor_bank_name"
                        value={form.data.vendor_bank_name}
                        onChange={(e) =>
                            form.setData("vendor_bank_name", e.target.value)
                        }
                        aria-invalid={Boolean(
                            (form.errors as any)["vendor_bank_name"],
                        )}
                    />
                    {(form.errors as any)["vendor_bank_name"] ? (
                        <p className="text-sm text-red-600">
                            {(form.errors as any)["vendor_bank_name"]}
                        </p>
                    ) : null}
                </div>
                <div>
                    <label htmlFor="vendor_bank_account_no" className="text-sm">
                        Bank Account No
                    </label>
                    <Input
                        id="vendor_bank_account_no"
                        value={form.data.vendor_bank_account_no}
                        onChange={(e) =>
                            form.setData(
                                "vendor_bank_account_no",
                                e.target.value,
                            )
                        }
                        aria-invalid={Boolean(
                            (form.errors as any)["vendor_bank_account_no"],
                        )}
                    />
                    {(form.errors as any)["vendor_bank_account_no"] ? (
                        <p className="text-sm text-red-600">
                            {(form.errors as any)["vendor_bank_account_no"]}
                        </p>
                    ) : null}
                </div>
                <div>
                    <label
                        htmlFor="vendor_bank_account_name"
                        className="text-sm"
                    >
                        Bank Account Name
                    </label>
                    <Input
                        id="vendor_bank_account_name"
                        value={form.data.vendor_bank_account_name}
                        onChange={(e) =>
                            form.setData(
                                "vendor_bank_account_name",
                                e.target.value,
                            )
                        }
                        aria-invalid={Boolean(
                            (form.errors as any)["vendor_bank_account_name"],
                        )}
                    />
                    {(form.errors as any)["vendor_bank_account_name"] ? (
                        <p className="text-sm text-red-600">
                            {(form.errors as any)["vendor_bank_account_name"]}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    id="is_active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={form.data.is_active}
                    onChange={(e) =>
                        form.setData("is_active", e.target.checked)
                    }
                />
                <label htmlFor="is_active" className="text-sm">
                    Active
                </label>
            </div>

            <hr />
            {method === "put" && vendor?.vendor_status === "pending" ? (
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="vendor_status"
                        className="text-sm font-medium"
                    >
                        Status
                    </label>
                    <Button
                        variant="default"
                        type="button"
                        onClick={handleApprove}
                    >
                        Approve
                    </Button>
                    <Button
                        variant="destructive"
                        type="button"
                        onClick={handleReject}
                    >
                        Reject
                    </Button>
                    {/* <label
                        htmlFor="vendor_status"
                        className="text-sm font-medium"
                    >
                        Status
                    </label>
                    <select
                        id="vendor_status"
                        value={form.data.vendor_status}
                        className={selectClassName}
                        onChange={(e) =>
                            form.setData("vendor_status", e.target.value)
                        }
                        aria-invalid={Boolean(
                            (form.errors as any)["vendor_status"],
                        )}
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    {(form.errors as any)["vendor_status"] ? (
                        <p className="text-sm text-red-600">
                            {(form.errors as any)["vendor_status"]}
                        </p>
                    ) : null} */}
                </div>
            ) : vendor?.vendor_status === "approved" ? (
                <div className="bg-green-600 px-2 py-1 rounded-full text-center">
                    <p className="text-sm font-medium text-white">Approved</p>
                </div>
            ) : (
                <div className="bg-red-500 px-2 py-1 rounded-full text-center">
                    <p className="text-sm font-medium text-white">Rejected</p>
                </div>
            )}

            <div className="flex items-center justify-end gap-2">
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
        </form>
    );
}
