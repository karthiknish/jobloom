import Script from "next/script";

interface JsonLdProps {
  data: object | object[];
}

/**
 * Safely stringify JSON-LD data to prevent XSS.
 * Specifically handles </script> tags which could be used to break out of the script block.
 */
function safeJsonLd(data: object | object[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

/**
 * Server-side JSON-LD structured data component
 * Renders schema.org structured data in a script tag
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

/**
 * Alternative using next/script for client-side insertion
 */
export function JsonLdScript({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(data),
      }}
    />
  );
}
