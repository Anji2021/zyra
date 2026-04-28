/**
 * Consistent content width and vertical rhythm for all authenticated /app pages.
 */
export function AppPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-0 sm:space-y-8 sm:pb-2 lg:max-w-4xl">
      {children}
    </div>
  );
}
