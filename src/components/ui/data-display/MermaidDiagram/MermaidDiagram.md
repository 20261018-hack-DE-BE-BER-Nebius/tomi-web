# MermaidDiagram

Renders a bounded flowchart passed through `source`, with localized `label`, `loading`, and `invalid` props. It does not read application state or call an API.

Uses pinned Mermaid with strict security, HTML labels and callbacks disabled. Configuration directives and click actions are rejected. DOMPurify applies SVG-only sanitization and removes links, embedded HTML, images, and scripts. The result is displayed as an inert Blob SVG image rather than inserted into the application DOM. No CSP weakening or external rendering service is used. Source remains editable in the owning deck feature and provides an accessible text alternative. Blob URLs are revoked on change/unmount.

Validation: `source.test.ts` covers bounded input and configuration/action rejection; browser acceptance verifies rendering with the app's strict CSP.
