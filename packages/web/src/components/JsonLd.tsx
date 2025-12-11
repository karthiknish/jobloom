import Script from "next/script";

interface JsonLdProps {
  data: object | object[];
}

/**
 * Server-side JSON-LD structured data component
 * Renders schema.org structured data in a script tag
 */
export function JsonLd({ data }: JsonLdProps) {
  const jsonLdString = JSON.stringify(
    Array.isArray(data) ? data : data,
    null,
    0
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString }}
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
        __html: JSON.stringify(data),
      }}
    />
  );
}
