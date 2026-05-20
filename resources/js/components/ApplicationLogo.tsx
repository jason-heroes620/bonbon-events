import type { HTMLProps } from "react";

export default function ApplicationLogo(
    props: HTMLProps<HTMLImageElement> & { width?: number; height?: number },
) {
    return (
        <img
            src="/bonbon-logo.png"
            alt=""
            width={props.width}
            height={props.height}
            {...props}
        />
    );
}
