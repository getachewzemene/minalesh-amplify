'use client';

import { useEffect, useRef } from 'react';

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import swagger-ui to avoid SSR issues
    import('swagger-ui-dist/swagger-ui-bundle.js').then((SwaggerUIBundle) => {
      import('swagger-ui-dist/swagger-ui-standalone-preset.js').then((SwaggerUIStandalonePreset) => {
        if (containerRef.current) {
          (SwaggerUIBundle as any).default({
            url: '/api/swagger.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              (SwaggerUIBundle as any).default.presets.apis,
              (SwaggerUIStandalonePreset as any).default,
            ],
            plugins: [
              (SwaggerUIBundle as any).default.plugins.DownloadUrl,
            ],
            layout: 'StandaloneLayout',
          });
        }
      });
    });
  }, []);

  return (
    <div className="w-full min-h-screen">
      <div id="swagger-ui" ref={containerRef}></div>
    </div>
  );
}
