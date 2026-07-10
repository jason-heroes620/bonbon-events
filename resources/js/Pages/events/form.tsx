import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { format, isSameDay, isSameMonth, parseISO } from "date-fns";
import type {
    Event,
    Location,
    Deposit,
    BoothType,
    Booth,
    EventBooth,
    EventLayoutImage,
} from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";

type EventFormData = {
    event_name: string;
    event_description: string;
    event_date: string;
    event_time: string;
    location_id: string;
    venue: string;
    event_image: File | null;
    event_booth_layouts: File[];
    removed_layout_image_ids: string[];
    event_start_date: string;
    event_end_date: string;
    require_deposit: boolean;
    is_active: boolean;
    deposit_id: string;
    booths: EventBooth[];
};

type EventFormProps = {
    event?: Event;
    locations: Pick<Location, "location_id" | "location_name">[];
    deposits: Pick<
        Deposit,
        "deposit_id" | "deposit_description" | "deposit_amount"
    >[];
    boothTypes: Pick<BoothType, "booth_type_id" | "booth_type_name">[];
    booths: Pick<Booth, "booth_id" | "booth_type_id" | "booth_name">[];
    submitUrl: string;
    submitLabel: string;
    cancelUrl: string;
};

const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function EventForm({
    event,
    locations,
    deposits,
    boothTypes,
    booths,
    submitUrl,
    submitLabel,
    cancelUrl,
}: EventFormProps) {
    const form = useForm<EventFormData>({
        event_name: event?.event_name ?? "",
        event_description: event?.event_description ?? "",
        event_date: event?.event_date ?? "",
        event_time: event?.event_time ?? "",
        location_id: event?.location_id ?? "",
        venue: event?.venue ?? "",
        event_image: null,
        event_booth_layouts: [],
        removed_layout_image_ids: [],
        event_start_date: event?.event_start_date ?? "",
        event_end_date: event?.event_end_date ?? "",
        require_deposit: event?.require_deposit ?? false,
        is_active: event?.is_active ?? true,
        deposit_id: event?.deposit_id ?? "",
        booths: event?.booths ?? [],
    });

    const quillContainerRef = useRef<HTMLDivElement | null>(null);
    const quillRef = useRef<Quill | null>(null);

    const [eventDateTouched, setEventDateTouched] = useState(false);

    useEffect(() => {
        if (!quillContainerRef.current) return;
        if (quillRef.current) return;

        const quill = new Quill(quillContainerRef.current, {
            theme: "snow",
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ align: [] }],
                    [{ indent: "-1" }, { indent: "+1" }],
                    ["link"],
                    ["clean"],
                ],
            },
        });

        quillRef.current = quill;

        quill.root.innerHTML =
            form.data.event_description?.trim() === ""
                ? ""
                : form.data.event_description;

        quill.on("text-change", () => {
            const html = quill.root.innerHTML;
            const normalized = html === "<p><br></p>" ? "" : html;
            form.setData("event_description", normalized);
        });
    }, []);

    useEffect(() => {
        if (event) return;
        if (eventDateTouched) return;
        if (!form.data.event_start_date || !form.data.event_end_date) return;

        const start = parseISO(form.data.event_start_date);
        const end = parseISO(form.data.event_end_date);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
            return;

        let suggested = "";
        if (isSameDay(start, end)) {
            suggested = format(start, "dd, MMM");
        } else if (isSameMonth(start, end)) {
            suggested = `${format(start, "dd")} - ${format(end, "dd")}, ${format(start, "MMM")}`;
        } else {
            suggested = `${format(start, "dd MMM")} - ${format(end, "dd MMM")}`;
        }

        if (suggested !== "" && suggested !== form.data.event_date) {
            form.setData("event_date", suggested);
        }
    }, [
        event,
        eventDateTouched,
        form.data.event_start_date,
        form.data.event_end_date,
        form.data.event_date,
    ]);

    const initialImageUrl = event?.event_image ?? null;
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
        initialImageUrl,
    );

    useEffect(() => {
        if (form.data.event_image instanceof File) {
            const url = URL.createObjectURL(form.data.event_image);
            setImagePreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setImagePreviewUrl(initialImageUrl);
    }, [form.data.event_image, initialImageUrl]);

    const initialLayoutImages = useMemo<EventLayoutImage[]>(() => {
        return event?.layout_images ?? event?.event_layout_images ?? [];
    }, [event?.event_layout_images, event?.layout_images]);
    const [existingLayoutImages, setExistingLayoutImages] =
        useState<EventLayoutImage[]>(initialLayoutImages);
    const [newLayoutPreviewUrls, setNewLayoutPreviewUrls] = useState<string[]>(
        [],
    );

    useEffect(() => {
        const urls = form.data.event_booth_layouts.map((file) =>
            URL.createObjectURL(file),
        );
        setNewLayoutPreviewUrls(urls);

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [form.data.event_booth_layouts]);

    const [selectedBoothType, setSelectedBoothType] = useState<string>("");
    const [selectedBoothIds, setSelectedBoothIds] = useState<string[]>([]);
    const [boothPrice, setBoothPrice] = useState<string>("");

    const availableBoothsForType = useMemo(() => {
        if (!selectedBoothType) return [];
        return booths.filter((b) => b.booth_type_id === selectedBoothType);
    }, [booths, selectedBoothType]);

    const handleAddBooths = () => {
        if (selectedBoothIds.length === 0 || !boothPrice) return;

        const currentBooths = [...form.data.booths];

        selectedBoothIds.forEach((id) => {
            const existingIndex = currentBooths.findIndex(
                (b) => b.booth_id === id,
            );
            if (existingIndex >= 0) {
                currentBooths[existingIndex] = {
                    ...currentBooths[existingIndex],
                    booth_price: boothPrice,
                };
            } else {
                currentBooths.push({ booth_id: id, booth_price: boothPrice });
            }
        });

        form.setData("booths", currentBooths);
        setSelectedBoothIds([]);
        setBoothPrice("");
    };

    const handleRemoveBooth = (booth_id: string) => {
        form.setData(
            "booths",
            form.data.booths.filter((b) => b.booth_id !== booth_id),
        );
    };

    const boothsPerPage = 10;
    const [boothsPage, setBoothsPage] = useState(1);

    const boothTableTotals = useMemo(() => {
        const boothTypeCounts: Record<string, number> = {};

        for (const eventBooth of form.data.booths) {
            const booth = booths.find(
                (b) => b.booth_id === eventBooth.booth_id,
            );
            if (!booth?.booth_type_id) continue;
            boothTypeCounts[booth.booth_type_id] =
                (boothTypeCounts[booth.booth_type_id] ?? 0) + 1;
        }

        const boothsByType = Object.entries(boothTypeCounts)
            .map(([booth_type_id, count]) => {
                const type = boothTypes.find(
                    (t) => t.booth_type_id === booth_type_id,
                );
                return {
                    booth_type_id,
                    booth_type_name: type?.booth_type_name ?? booth_type_id,
                    count,
                };
            })
            .sort((a, b) => a.booth_type_name.localeCompare(b.booth_type_name));

        return {
            boothsByType,
            boothCount: form.data.booths.length,
        };
    }, [boothTypes, booths, form.data.booths]);

    const boothTableTotalPages = useMemo(() => {
        return Math.max(
            1,
            Math.ceil(boothTableTotals.boothCount / boothsPerPage),
        );
    }, [boothTableTotals.boothCount]);

    useEffect(() => {
        if (boothsPage > boothTableTotalPages)
            setBoothsPage(boothTableTotalPages);
        if (boothsPage < 1) setBoothsPage(1);
    }, [boothsPage, boothTableTotalPages]);

    const paginatedEventBooths = useMemo(() => {
        const start = (boothsPage - 1) * boothsPerPage;
        const end = start + boothsPerPage;
        return form.data.booths.slice(start, end);
    }, [boothsPage, form.data.booths]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        form.post(submitUrl, {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Event updated.");
            },
            onError: () => {
                toast.error("Failed to update event.");
            },
        });
    };

    const handleLayoutFilesChange = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        form.setData("event_booth_layouts", [
            ...form.data.event_booth_layouts,
            ...Array.from(files),
        ]);
    };

    const handleRemoveExistingLayoutImage = (imageId: string) => {
        setExistingLayoutImages((prev) =>
            prev.filter((image) => image.event_layout_image_id !== imageId),
        );

        if (!form.data.removed_layout_image_ids.includes(imageId)) {
            form.setData("removed_layout_image_ids", [
                ...form.data.removed_layout_image_ids,
                imageId,
            ]);
        }
    };

    const handleRemoveNewLayoutImage = (index: number) => {
        form.setData(
            "event_booth_layouts",
            form.data.event_booth_layouts.filter((_, i) => i !== index),
        );
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="event_name" className="text-sm font-medium">
                        Event Name
                    </label>
                    <Input
                        id="event_name"
                        value={form.data.event_name}
                        onChange={(e) =>
                            form.setData("event_name", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.event_name)}
                    />
                    {form.errors.event_name ? (
                        <p className="text-sm text-red-600">
                            {form.errors.event_name}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label
                        htmlFor="event_description"
                        className="text-sm font-medium"
                    >
                        Description
                    </label>
                    <div
                        className="rounded-lg border border-input bg-transparent overflow-hidden aria-invalid:border-destructive"
                        aria-invalid={Boolean(form.errors.event_description)}
                    >
                        <div ref={quillContainerRef} />
                    </div>
                    {form.errors.event_description ? (
                        <p className="text-sm text-red-600">
                            {form.errors.event_description}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-row w-full md:grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 w-full md:col-span-1">
                        <label
                            htmlFor="event_start_date"
                            className="text-sm font-medium"
                        >
                            Start Date
                        </label>
                        <Input
                            id="event_start_date"
                            type="date"
                            value={form.data.event_start_date}
                            onChange={(e) =>
                                form.setData("event_start_date", e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.event_start_date)}
                            min={new Date().toISOString().split("T")[0]}
                        />
                        {form.errors.event_start_date ? (
                            <p className="text-sm text-red-600">
                                {form.errors.event_start_date}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2 w-full md:col-span-1">
                        <label
                            htmlFor="event_end_date"
                            className="text-sm font-medium"
                        >
                            End Date
                        </label>
                        <Input
                            id="event_end_date"
                            type="date"
                            value={form.data.event_end_date}
                            onChange={(e) =>
                                form.setData("event_end_date", e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.event_end_date)}
                            min={form.data.event_start_date}
                        />
                        {form.errors.event_end_date ? (
                            <p className="text-sm text-red-600">
                                {form.errors.event_end_date}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-row w-full md:grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 w-full md:col-span-1">
                        <label
                            htmlFor="event_date"
                            className="text-sm font-medium"
                        >
                            Event Date
                        </label>
                        <Input
                            id="event_date"
                            value={form.data.event_date}
                            onChange={(e) => {
                                setEventDateTouched(true);
                                form.setData("event_date", e.target.value);
                            }}
                            aria-invalid={Boolean(form.errors.event_date)}
                        />
                        {form.errors.event_date ? (
                            <p className="text-sm text-red-600">
                                {form.errors.event_date}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2 w-full md:col-span-1">
                        <label
                            htmlFor="event_time"
                            className="text-sm font-medium"
                        >
                            Event Time
                        </label>
                        <Input
                            id="event_time"
                            value={form.data.event_time}
                            onChange={(e) =>
                                form.setData("event_time", e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.event_time)}
                        />
                        {form.errors.event_time ? (
                            <p className="text-sm text-red-600">
                                {form.errors.event_time}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label
                        htmlFor="location_id"
                        className="text-sm font-medium"
                    >
                        Location
                    </label>
                    <select
                        id="location_id"
                        className={selectClassName}
                        value={form.data.location_id}
                        onChange={(e) =>
                            form.setData("location_id", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.location_id)}
                    >
                        <option value="" disabled>
                            Select a location
                        </option>
                        {locations.map((location) => (
                            <option
                                key={location.location_id}
                                value={location.location_id}
                            >
                                {location.location_name}
                            </option>
                        ))}
                    </select>
                    {form.errors.location_id ? (
                        <p className="text-sm text-red-600">
                            {form.errors.location_id}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="venue" className="text-sm font-medium">
                        Venue
                    </label>
                    <Input
                        id="venue"
                        value={form.data.venue}
                        onChange={(e) => form.setData("venue", e.target.value)}
                        aria-invalid={Boolean(form.errors.venue)}
                    />
                    {form.errors.venue ? (
                        <p className="text-sm text-red-600">
                            {form.errors.venue}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label
                        htmlFor="event_image"
                        className="text-sm font-medium"
                    >
                        Event Image
                    </label>
                    <Input
                        id="event_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            form.setData("event_image", file);
                        }}
                        aria-invalid={Boolean(form.errors.event_image)}
                    />
                    {form.errors.event_image ? (
                        <p className="text-sm text-red-600">
                            {form.errors.event_image}
                        </p>
                    ) : null}
                    {imagePreviewUrl ? (
                        <div className="rounded-md border bg-muted/20 p-2">
                            <img
                                src={imagePreviewUrl}
                                alt="Event image preview"
                                className="max-h-80 w-full rounded object-contain"
                            />
                        </div>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label
                        htmlFor="event_booth_layouts"
                        className="text-sm font-medium"
                    >
                        Booth Layout Images
                    </label>
                    <Input
                        id="event_booth_layouts"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                            handleLayoutFilesChange(e.target.files);
                            e.currentTarget.value = "";
                        }}
                        aria-invalid={Boolean(form.errors.event_booth_layouts)}
                    />
                    {form.errors.event_booth_layouts ? (
                        <p className="text-sm text-red-600">
                            {form.errors.event_booth_layouts}
                        </p>
                    ) : null}
                    {existingLayoutImages.length > 0 ? (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                Existing Layout Images
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {existingLayoutImages.map((image) => (
                                    <div
                                        key={image.event_layout_image_id}
                                        className="rounded-md border bg-muted/20 p-2"
                                    >
                                        <img
                                            src={image.image_path}
                                            alt="Booth layout preview"
                                            className="h-36 w-full rounded object-cover"
                                        />
                                        <div className="mt-2 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleRemoveExistingLayoutImage(
                                                        image.event_layout_image_id,
                                                    )
                                                }
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    {newLayoutPreviewUrls.length > 0 ? (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                New Layout Images
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {newLayoutPreviewUrls.map((url, index) => (
                                    <div
                                        key={`${url}-${index}`}
                                        className="rounded-md border bg-muted/20 p-2"
                                    >
                                        <img
                                            src={url}
                                            alt={`Booth layout preview ${index + 1}`}
                                            className="h-36 w-full rounded object-cover"
                                        />
                                        <div className="mt-2 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleRemoveNewLayoutImage(
                                                        index,
                                                    )
                                                }
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                    <input
                        id="require_deposit"
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={form.data.require_deposit}
                        onChange={(e) =>
                            form.setData("require_deposit", e.target.checked)
                        }
                    />
                    <span className="text-sm">Require deposit</span>
                </label>
            </div>
            {form.data.require_deposit && (
                <div>
                    <label className="flex items-center gap-2">Deposit</label>
                    <select
                        name="deposit_id"
                        id="deposit_id"
                        className={selectClassName}
                        value={form.data.deposit_id}
                        onChange={(e) =>
                            form.setData("deposit_id", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.deposit_id)}
                    >
                        <option value="" disabled>
                            Select a deposit amount
                        </option>
                        {deposits.map((deposit) => (
                            <option
                                key={deposit.deposit_id}
                                value={deposit.deposit_id}
                            >
                                {deposit.deposit_description} | RM
                                {deposit.deposit_amount}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <hr />

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Event Booths</h3>
                <div className="grid gap-4 md:grid-cols-4 items-end">
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-medium">
                            Booth Type
                        </label>
                        <select
                            className={selectClassName}
                            value={selectedBoothType}
                            onChange={(e) => {
                                setSelectedBoothType(e.target.value);
                                setSelectedBoothIds([]);
                            }}
                        >
                            <option value="" disabled>
                                Select a type
                            </option>
                            {boothTypes.map((type) => (
                                <option
                                    key={type.booth_type_id}
                                    value={type.booth_type_id}
                                >
                                    {type.booth_type_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2 md:flex md:flex-col md:col-span-2">
                        <label className="text-sm font-medium">
                            Select Booths
                        </label>
                        <MultiSelect
                            className={selectClassName}
                            options={availableBoothsForType
                                .sort((a, b) =>
                                    a.booth_name.localeCompare(
                                        b.booth_name,
                                        undefined,
                                        {
                                            numeric: true,
                                            sensitivity: "base",
                                        },
                                    ),
                                )
                                .map((b) => ({
                                    label: b.booth_name,
                                    value: b.booth_id,
                                }))}
                            onValueChange={setSelectedBoothIds}
                            defaultValue={selectedBoothIds}
                            placeholder="Select booths"
                            variant="default"
                            maxSelected={availableBoothsForType.length}
                            maxCount={3}
                        />
                    </div>

                    <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-medium">
                            Price (RM)
                        </label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={boothPrice}
                            onChange={(e) => setBoothPrice(e.target.value)}
                        />
                    </div>

                    <div className="md:col-span-4 flex justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddBooths}
                            disabled={
                                selectedBoothIds.length === 0 || !boothPrice
                            }
                        >
                            Add to List
                        </Button>
                    </div>
                </div>

                {form.data.booths.length > 0 && (
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-2 font-medium">
                                        Type
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        Booth
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        Price
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedEventBooths.map((eventBooth) => {
                                    const booth = booths.find(
                                        (b) =>
                                            b.booth_id === eventBooth.booth_id,
                                    );
                                    const boothType = boothTypes.find(
                                        (t) =>
                                            t.booth_type_id ===
                                            booth?.booth_type_id,
                                    );
                                    return (
                                        <tr
                                            key={eventBooth.booth_id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-2">
                                                {boothType?.booth_type_name ??
                                                    "-"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {booth?.booth_name ?? "-"}
                                            </td>
                                            <td className="px-4 py-2">
                                                RM{" "}
                                                {Number(
                                                    eventBooth.booth_price,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() =>
                                                        handleRemoveBooth(
                                                            eventBooth.booth_id,
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    Booth Types:
                                </span>{" "}
                                {boothTableTotals.boothsByType.length > 0
                                    ? boothTableTotals.boothsByType
                                          .map(
                                              (t) =>
                                                  `${t.booth_type_name}: ${t.count}`,
                                          )
                                          .join(" • ")
                                    : "-"}{" "}
                                |{" "}
                                <span className="font-medium text-foreground">
                                    Total Booths:
                                </span>{" "}
                                {boothTableTotals.boothCount}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setBoothsPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={boothsPage <= 1}
                                >
                                    Previous
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                    Page {boothsPage} of {boothTableTotalPages}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setBoothsPage((p) =>
                                            Math.min(
                                                boothTableTotalPages,
                                                p + 1,
                                            ),
                                        )
                                    }
                                    disabled={
                                        boothsPage >= boothTableTotalPages
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <hr />
            <div>
                <label className="flex items-center gap-2">
                    <input
                        id="is_active"
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={form.data.is_active}
                        onChange={(e) =>
                            form.setData("is_active", e.target.checked)
                        }
                    />
                    <span className="text-sm">Active</span>
                </label>
            </div>

            <div className="flex justify-end items-center gap-2">
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
