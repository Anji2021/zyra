/**
 * Consistent content width and vertical rhythm for all authenticated /app pages.
 * ~1280px max on large screens; single column, no horizontal overflow from shell.
 */
export function AppPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[min(100%,80rem)] space-y-5 pb-1 sm:space-y-8 sm:pb-2">
      {children}
    </div>
  );
}
