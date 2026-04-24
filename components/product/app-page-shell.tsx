/**
 * Consistent content width and vertical rhythm for all authenticated /app pages.
 */
export function AppPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-2 lg:max-w-4xl">{children}</div>
  );
}
