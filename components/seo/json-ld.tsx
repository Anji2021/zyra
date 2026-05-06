type SeoJsonLdProps = {
  /** Structured data payload; must be JSON-serializable. */
  data: Record<string, unknown>;
};

/**
 * Lightweight JSON-LD renderer for structured data.
 * Keeps script generation centralized without pulling new dependencies.
 */
export function SeoJsonLd({ data }: SeoJsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
