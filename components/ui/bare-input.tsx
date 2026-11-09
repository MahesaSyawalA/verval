"use client";

import { Input as HeroInput } from "@heroui/react";
import { forwardRef, type ComponentProps } from "react";

/**
 * Input HeroUI tanpa label/pesan error, untuk kotak pencarian atau sel kode
 * yang sudah punya pembungkus dan label sendiri. Wajib diberi `aria-label`.
 */
export const BareInput = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof HeroInput>
>((props, ref) => <HeroInput ref={ref} {...props} />);

BareInput.displayName = "BareInput";
