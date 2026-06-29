"use client";

import { Suspense } from "react";
import { TopProgressBar } from "./top-progress-bar";

/**
 * Wrapper untuk TopProgressBar yang dibungkus Suspense.
 * Diperlukan karena useSearchParams() membutuhkan Suspense boundary di Next.js 13+.
 */
export function ProgressBarProvider() {
  return (
    <Suspense fallback={null}>
      <TopProgressBar />
    </Suspense>
  );
}
