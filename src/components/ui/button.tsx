import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const buttonVariants = ({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
} = {}) =>
  cn(
    "inline-flex items-center justify-center rounded-full font-medium transition-opacity disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" && "bg-foreground text-background hover:opacity-90",
    variant === "secondary" &&
      "border border-foreground/15 bg-transparent hover:bg-foreground/5",
    variant === "ghost" && "bg-transparent hover:bg-foreground/5",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-5 text-base",
    size === "lg" && "h-12 px-6 text-base",
    className,
  );

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
