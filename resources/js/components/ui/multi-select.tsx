import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronDown, XCircle, XIcon } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const isDev = import.meta.env.DEV;

export interface AnimationConfig {
    badgeAnimation?: "bounce" | "pulse" | "wiggle" | "fade" | "slide" | "none";
    popoverAnimation?: "scale" | "slide" | "fade" | "flip" | "none";
    optionHoverAnimation?: "highlight" | "scale" | "glow" | "none";
    duration?: number;
    delay?: number;
}

const multiSelectVariants = cva(
    "transition-all duration-300 ease-in-out py-3 items-center",
    {
        variants: {
            variant: {
                default:
                    "border-foreground/10 text-foreground bg-card hover:bg-card/80",
                secondary:
                    "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                inverted: "inverted",
            },
            badgeAnimation: {
                bounce: "hover:-translate-y-1 hover:scale-110",
                pulse: "hover:animate-pulse",
                wiggle: "hover:animate-wiggle",
                fade: "hover:opacity-80",
                slide: "hover:translate-x-1",
                none: "",
            },
        },
        defaultVariants: {
            variant: "default",
            badgeAnimation: "bounce",
        },
    },
);

interface MultiSelectOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
    style?: {
        badgeColor?: string;
        iconColor?: string;
        gradient?: string;
    };
}

interface MultiSelectGroup {
    heading: string;
    options: MultiSelectOption[];
}

interface MultiSelectProps
    extends
        Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "animationConfig">,
        VariantProps<typeof multiSelectVariants> {
    options: MultiSelectOption[] | MultiSelectGroup[];
    onValueChange: (value: string[]) => void;
    defaultValue?: string[];
    placeholder?: string;
    animation?: number;
    animationConfig?: AnimationConfig;
    maxCount?: number;
    maxSelected?: number;
    modalPopover?: boolean;
    asChild?: boolean;
    className?: string;
    hideSelectAll?: boolean;
    searchable?: boolean;
    emptyIndicator?: React.ReactNode;
    autoSize?: boolean;
    singleLine?: boolean;
    popoverClassName?: string;
    disabled?: boolean;
    responsive?:
        | boolean
        | {
              mobile?: {
                  maxCount?: number;
                  hideIcons?: boolean;
                  compactMode?: boolean;
              };
              tablet?: {
                  maxCount?: number;
                  hideIcons?: boolean;
                  compactMode?: boolean;
              };
              desktop?: {
                  maxCount?: number;
                  hideIcons?: boolean;
                  compactMode?: boolean;
              };
          };
    minWidth?: string;
    maxWidth?: string;
    deduplicateOptions?: boolean;
    resetOnDefaultValueChange?: boolean;
    closeOnSelect?: boolean;
}

export interface MultiSelectRef {
    reset: () => void;
    getSelectedValues: () => string[];
    setSelectedValues: (values: string[]) => void;
    clear: () => void;
    focus: () => void;
}

export const MultiSelect = React.forwardRef<MultiSelectRef, MultiSelectProps>(
    (
        {
            options,
            onValueChange,
            variant,
            defaultValue = [],
            placeholder = "Select options",
            animation = 0,
            animationConfig,
            maxCount = 3,
            maxSelected = 1,
            modalPopover = false,
            asChild = false,
            className,
            hideSelectAll = false,
            searchable = true,
            emptyIndicator,
            autoSize = false,
            singleLine = false,
            popoverClassName,
            disabled = false,
            responsive,
            minWidth,
            maxWidth,
            deduplicateOptions = false,
            resetOnDefaultValueChange = true,
            closeOnSelect = false,
            ...props
        },
        ref,
    ) => {
        const [selectedValues, setSelectedValues] =
            React.useState<string[]>(defaultValue);
        const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
        const [searchValue, setSearchValue] = React.useState("");

        const [politeMessage, setPoliteMessage] = React.useState("");
        const [assertiveMessage, setAssertiveMessage] = React.useState("");
        const prevSelectedCount = React.useRef(selectedValues.length);
        const prevIsOpen = React.useRef(isPopoverOpen);
        const prevSearchValue = React.useRef(searchValue);

        const announce = React.useCallback(
            (message: string, priority: "polite" | "assertive" = "polite") => {
                if (priority === "assertive") {
                    setAssertiveMessage(message);
                    setTimeout(() => setAssertiveMessage(""), 100);
                } else {
                    setPoliteMessage(message);
                    setTimeout(() => setPoliteMessage(""), 100);
                }
            },
            [],
        );

        const multiSelectId = React.useId();
        const listboxId = `${multiSelectId}-listbox`;
        const triggerDescriptionId = `${multiSelectId}-description`;
        const selectedCountId = `${multiSelectId}-count`;

        const prevDefaultValueRef = React.useRef<string[]>(defaultValue);

        const isGroupedOptions = React.useCallback(
            (
                opts: MultiSelectOption[] | MultiSelectGroup[],
            ): opts is MultiSelectGroup[] => {
                return opts.length > 0 && "heading" in opts[0];
            },
            [],
        );

        const arraysEqual = React.useCallback(
            (a: string[], b: string[]): boolean => {
                if (a.length !== b.length) return false;
                return [...a]
                    .sort()
                    .every((val, index) => val === [...b].sort()[index]);
            },
            [],
        );

        const resetToDefault = React.useCallback(() => {
            setSelectedValues(defaultValue);
            setIsPopoverOpen(false);
            setSearchValue("");
            onValueChange(defaultValue);
        }, [defaultValue, onValueChange]);

        const buttonRef = React.useRef<HTMLButtonElement>(null);

        React.useImperativeHandle(
            ref,
            () => ({
                reset: resetToDefault,
                getSelectedValues: () => selectedValues,
                setSelectedValues: (values: string[]) => {
                    setSelectedValues(values);
                    onValueChange(values);
                },
                clear: () => {
                    setSelectedValues([]);
                    onValueChange([]);
                },
                focus: () => {
                    buttonRef.current?.focus();
                },
            }),
            [resetToDefault, selectedValues, onValueChange],
        );

        const [screenSize, setScreenSize] = React.useState<
            "mobile" | "tablet" | "desktop"
        >("desktop");

        React.useEffect(() => {
            if (typeof window === "undefined") return;
            const handleResize = () => {
                const width = window.innerWidth;
                if (width < 640) setScreenSize("mobile");
                else if (width < 1024) setScreenSize("tablet");
                else setScreenSize("desktop");
            };
            handleResize();
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }, []);

        const getResponsiveSettings = () => {
            if (!responsive)
                return { maxCount, hideIcons: false, compactMode: false };

            const defaultResponsive = {
                mobile: { maxCount: 2, hideIcons: false, compactMode: true },
                tablet: { maxCount: 4, hideIcons: false, compactMode: false },
                desktop: { maxCount: 6, hideIcons: false, compactMode: false },
            };

            const currentSettings =
                responsive === true
                    ? defaultResponsive[screenSize]
                    : responsive[screenSize];
            return {
                maxCount: currentSettings?.maxCount ?? maxCount,
                hideIcons: currentSettings?.hideIcons ?? false,
                compactMode: currentSettings?.compactMode ?? false,
            };
        };

        const responsiveSettings = getResponsiveSettings();

        const getAllOptions = React.useCallback((): MultiSelectOption[] => {
            if (options.length === 0) return [];
            const allOptions = isGroupedOptions(options)
                ? options.flatMap((g) => g.options)
                : options;

            const valueSet = new Set<string>();
            const uniqueOptions: MultiSelectOption[] = [];

            allOptions.forEach((option) => {
                if (!valueSet.has(option.value)) {
                    valueSet.add(option.value);
                    uniqueOptions.push(option);
                }
            });
            return deduplicateOptions ? uniqueOptions : allOptions;
        }, [options, deduplicateOptions, isGroupedOptions]);

        const getOptionByValue = React.useCallback(
            (value: string): MultiSelectOption | undefined => {
                return getAllOptions().find((option) => option.value === value);
            },
            [getAllOptions],
        );

        // Filter engine mapped to work flawlessly alongside shadcn `<Command shouldFilter={false}>`
        const filteredOptions = React.useMemo(() => {
            if (!searchable || !searchValue) return options;
            if (options.length === 0) return [];

            if (isGroupedOptions(options)) {
                return options
                    .map((group) => ({
                        ...group,
                        options: group.options.filter(
                            (o) =>
                                o.label
                                    .toLowerCase()
                                    .includes(searchValue.toLowerCase()) ||
                                o.value
                                    .toLowerCase()
                                    .includes(searchValue.toLowerCase()),
                        ),
                    }))
                    .filter((group) => group.options.length > 0);
            }
            return options.filter(
                (o) =>
                    o.label.toLowerCase().includes(searchValue.toLowerCase()) ||
                    o.value.toLowerCase().includes(searchValue.toLowerCase()),
            );
        }, [options, searchValue, searchable, isGroupedOptions]);

        const effectiveMaxSelected = React.useMemo(() => {
            if (
                typeof maxSelected !== "number" ||
                !Number.isFinite(maxSelected)
            )
                return 1;
            return Math.max(1, Math.floor(maxSelected));
        }, [maxSelected]);

        const toggleOption = (optionValue: string) => {
            if (disabled) return;
            const option = getOptionByValue(optionValue);
            if (option?.disabled) return;

            const isSelected = selectedValues.includes(optionValue);
            let newSelectedValues: string[];

            if (isSelected) {
                newSelectedValues = selectedValues.filter(
                    (v) => v !== optionValue,
                );
            } else if (selectedValues.length >= effectiveMaxSelected) {
                if (effectiveMaxSelected === 1) {
                    newSelectedValues = [optionValue];
                } else {
                    return;
                }
            } else {
                newSelectedValues = [...selectedValues, optionValue];
            }

            setSelectedValues(newSelectedValues);
            onValueChange(newSelectedValues);
            if (closeOnSelect) setIsPopoverOpen(false);
        };

        const handleClear = (e: React.MouseEvent) => {
            e.stopPropagation(); // Stop popover toggling open/close unexpectedly
            if (disabled) return;
            setSelectedValues([]);
            onValueChange([]);
        };

        const clearExtraOptions = () => {
            if (disabled) return;
            const newSelectedValues = selectedValues.slice(
                0,
                responsiveSettings.maxCount,
            );
            setSelectedValues(newSelectedValues);
            onValueChange(newSelectedValues);
        };

        React.useEffect(() => {
            if (!resetOnDefaultValueChange) return;
            if (!arraysEqual(prevDefaultValueRef.current, defaultValue)) {
                if (!arraysEqual(selectedValues, defaultValue)) {
                    setSelectedValues(defaultValue);
                }
                prevDefaultValueRef.current = [...defaultValue];
            }
        }, [
            defaultValue,
            selectedValues,
            arraysEqual,
            resetOnDefaultValueChange,
        ]);

        React.useEffect(() => {
            if (!isPopoverOpen) setSearchValue("");
        }, [isPopoverOpen]);

        // Accessibility ARIA Broadcasts
        React.useEffect(() => {
            const selectedCount = selectedValues.length;
            const allOptions = getAllOptions();
            const totalOptions = allOptions.filter((o) => !o.disabled).length;

            if (selectedCount !== prevSelectedCount.current) {
                const diff = selectedCount - prevSelectedCount.current;
                if (diff > 0) {
                    const addedLabels = selectedValues
                        .slice(-diff)
                        .map(
                            (v) => allOptions.find((o) => o.value === v)?.label,
                        )
                        .filter(Boolean);

                    announce(
                        addedLabels.length === 1
                            ? `${addedLabels[0]} selected. ${selectedCount} of ${totalOptions} options selected.`
                            : `${addedLabels.length} options selected. ${selectedCount} of ${totalOptions} total selected.`,
                    );
                } else {
                    announce(
                        `Option removed. ${selectedCount} of ${totalOptions} options selected.`,
                    );
                }
                prevSelectedCount.current = selectedCount;
            }
        }, [selectedValues, announce, getAllOptions]);

        return (
            <>
                <div className="sr-only">
                    <div aria-live="polite" aria-atomic="true" role="status">
                        {politeMessage}
                    </div>
                    <div aria-live="assertive" aria-atomic="true" role="alert">
                        {assertiveMessage}
                    </div>
                </div>

                <Popover
                    open={isPopoverOpen}
                    onOpenChange={setIsPopoverOpen}
                    modal={modalPopover}
                >
                    <div id={triggerDescriptionId} className="sr-only">
                        Multi-select dropdown. Use arrow keys to navigate, Enter
                        to select, and Escape to close.
                    </div>
                    <div
                        id={selectedCountId}
                        className="sr-only"
                        aria-live="polite"
                    >
                        {selectedValues.length === 0
                            ? "No options selected"
                            : `${selectedValues.length} options selected.`}
                    </div>

                    {/* FIX: added asChild to clean up nesting bugs */}
                    <PopoverTrigger
                        render={
                            <Button
                                ref={buttonRef}
                                variant="outline"
                                role="combobox"
                                aria-expanded={isPopoverOpen}
                                aria-controls={
                                    isPopoverOpen ? listboxId : undefined
                                }
                                aria-describedby={`${triggerDescriptionId} ${selectedCountId}`}
                                // disabled={disabled}
                                className={cn(
                                    "flex h-auto min-h-10 items-center justify-between rounded-md border bg-inherit p-1 hover:bg-inherit",
                                    autoSize ? "w-auto" : "w-full",
                                    responsiveSettings.compactMode &&
                                        "min-h-8 text-sm",
                                    screenSize === "mobile" &&
                                        "min-h-12 text-base",
                                    className,
                                )}
                                {...props}
                            >
                                {selectedValues.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1">
                                        {selectedValues
                                            .slice(
                                                0,
                                                responsiveSettings.maxCount,
                                            )
                                            .map((value) => {
                                                const option =
                                                    getOptionByValue(value);
                                                const IconComponent =
                                                    option?.icon;
                                                return (
                                                    <Badge
                                                        key={value}
                                                        className={cn(
                                                            multiSelectVariants(
                                                                {
                                                                    variant,
                                                                    badgeAnimation:
                                                                        animationConfig?.badgeAnimation,
                                                                },
                                                            ),
                                                        )}
                                                        style={
                                                            option?.style
                                                                ?.badgeColor
                                                                ? {
                                                                      backgroundColor:
                                                                          option
                                                                              .style
                                                                              .badgeColor,
                                                                  }
                                                                : undefined
                                                        }
                                                    >
                                                        {IconComponent && (
                                                            <IconComponent className="mr-2 h-4 w-4" />
                                                        )}
                                                        {option?.label}
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                toggleOption(
                                                                    value,
                                                                );
                                                            }}
                                                            onKeyDown={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    event.key ===
                                                                        "Enter" ||
                                                                    event.key ===
                                                                        " "
                                                                ) {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                    toggleOption(
                                                                        value,
                                                                    );
                                                                }
                                                            }}
                                                            className="-m-0.5 ml-2 h-4 w-4 cursor-pointer rounded-sm p-0.5 hover:bg-white/20 focus:ring-1 focus:ring-white/50 focus:outline-none"
                                                        >
                                                            <XCircle
                                                                className={cn(
                                                                    "h-3 w-3",
                                                                    responsiveSettings.compactMode &&
                                                                        "h-2.5 w-2.5",
                                                                )}
                                                            />
                                                        </div>
                                                    </Badge>
                                                );
                                            })}
                                        {selectedValues.length >
                                            responsiveSettings.maxCount && (
                                            <Badge
                                                variant="secondary"
                                                className="m-1"
                                            >
                                                +
                                                {selectedValues.length -
                                                    responsiveSettings.maxCount}{" "}
                                                more
                                            </Badge>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground px-2">
                                        {placeholder}
                                    </span>
                                )}
                                <div className="flex items-center gap-1 pr-2">
                                    {selectedValues.length > 0 && (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleClear(event);
                                            }}
                                            aria-label={`Clear all ${selectedValues.length} selected options`}
                                            className="text-muted-foreground hover:text-foreground focus:ring-ring mx-2 flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm focus:ring-2 focus:ring-offset-1 focus:outline-none"
                                        >
                                            <XIcon className="h-4 w-4" />
                                        </div>
                                    )}
                                    <Separator
                                        orientation="vertical"
                                        className="h-4"
                                    />
                                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                </div>
                            </Button>
                        }
                    />

                    <PopoverContent
                        className={cn(
                            "w-[var(--radix-popover-trigger-width)] p-0",
                            popoverClassName,
                        )}
                        align="start"
                    >
                        {/* FIX: set shouldFilter to false to avoid conflicting with manual memo filters */}
                        <Command shouldFilter={false}>
                            {searchable && (
                                <CommandInput
                                    placeholder="Search options..."
                                    value={searchValue}
                                    onValueChange={setSearchValue}
                                />
                            )}
                            <CommandList
                                id={listboxId}
                                role="listbox"
                                aria-multiselectable="true"
                            >
                                <CommandEmpty>
                                    {emptyIndicator ?? "No results found."}
                                </CommandEmpty>
                                <CommandGroup>
                                    {isGroupedOptions(filteredOptions)
                                        ? filteredOptions.map((group) => (
                                              <CommandGroup
                                                  key={group.heading}
                                                  heading={group.heading}
                                              >
                                                  {group.options.map(
                                                      (option) => {
                                                          const isSelected =
                                                              selectedValues.includes(
                                                                  option.value,
                                                              );
                                                          return (
                                                              <CommandItem
                                                                  key={
                                                                      option.value
                                                                  }
                                                                  value={
                                                                      option.value
                                                                  }
                                                                  disabled={
                                                                      option.disabled
                                                                  }
                                                                  onSelect={() =>
                                                                      toggleOption(
                                                                          option.value,
                                                                      )
                                                                  }
                                                              >
                                                                  <CheckIcon
                                                                      className={cn(
                                                                          "mr-2 h-4 w-4",
                                                                          isSelected
                                                                              ? "opacity-100"
                                                                              : "opacity-0",
                                                                      )}
                                                                  />
                                                                  {option.label}
                                                              </CommandItem>
                                                          );
                                                      },
                                                  )}
                                              </CommandGroup>
                                          ))
                                        : (
                                              filteredOptions as MultiSelectOption[]
                                          ).map((option) => {
                                              const isSelected =
                                                  selectedValues.includes(
                                                      option.value,
                                                  );
                                              return (
                                                  <CommandItem
                                                      key={option.value}
                                                      value={option.value}
                                                      disabled={option.disabled}
                                                      onSelect={() =>
                                                          toggleOption(
                                                              option.value,
                                                          )
                                                      }
                                                  >
                                                      <CheckIcon
                                                          className={cn(
                                                              "mr-2 h-4 w-4",
                                                              isSelected
                                                                  ? "opacity-100"
                                                                  : "opacity-0",
                                                          )}
                                                      />
                                                      {option.label}
                                                  </CommandItem>
                                              );
                                          })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </>
        );
    },
);

MultiSelect.displayName = "MultiSelect";

export type { MultiSelectGroup, MultiSelectOption, MultiSelectProps };
