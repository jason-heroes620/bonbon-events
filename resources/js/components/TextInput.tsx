import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { InputHTMLAttributes } from "react";

export type TextInputHandle = {
    focus: () => void;
};

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
    isFocused?: boolean;
};

export default forwardRef<TextInputHandle, TextInputProps>(function TextInput(
    { type = "text", className = "", isFocused = false, ...props },
    ref,
) {
    const localRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                "h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" +
                className
            }
            ref={localRef}
        />
    );
});
