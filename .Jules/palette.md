## 2024-05-18 - Async Loading State for API Fetches
**Learning:** For public API fetches (like the TWSE stock API), requests can take varying amounts of time. Without an explicit disabled and visual loading state, users might click the button multiple times, causing race conditions or redundant network requests, or get confused thinking the app is unresponsive.
**Action:** Always wrap asynchronous actions with a clear UI loading state. Disable the trigger element (e.g., button), visually update its text or style (e.g., opacity, cursor), and guarantee restoration of its original state in a `finally` block to handle both success and error cases reliably.

## 2024-05-18 - Client-Side Large Array Data Processing
**Learning:** Client-side conversion operations of large raw byte arrays (e.g. video frames) block the main thread and can crash lower-end devices or show standard browser 'Page Unresponsive' errors. Using standard ArrayBuffer reading via asynchronous file API operations combined with an explicit UI loading state is necessary.
**Action:** Wrapped the file reading and the tight byte parsing loop in `yuv-rgb.html` with disabled states for user actions and an indicator message updating UI text dynamically before the heavy computations run.

## 2024-06-23 - Interactive Technical Explainer Synced State
**Learning:** Interactive technical explainers (like color space and matrix conversions) benefit significantly from real-time syncing between visual controls (sliders), numeric outputs, and mathematical formulas. Isolating the core computational logic (e.g., matrix operations and color space clamping) from the UI bindings allows for seamless switching between predefined specifications (BT.601, BT.709, etc.) and custom inputs.
**Action:** Implemented a real-time YCbCr/RGB bidirectional converter in `yuv-rgb.html` that dynamically updates a visual color swatch and matrix formula inputs whenever sliders or spec dropdowns are adjusted.

## 2026-06-23 - Interactive Commit History
**Learning:** Implementing an exclusive accordion pattern for commit lists improves navigation by reducing vertical scroll fatigue, and using `white-space: pre-wrap` is essential for displaying multi-line developer insights generated from commit metadata.
**Action:** Applied exclusive toggle logic to commit headers and added `white-space: pre-wrap` to the `.dev-log` class in `zstreamer-commits.html`.
## 2024-12-07 - EDID Viewer UX Enhancements
 **Learning:** Native `<details>` and `<summary>` elements provide a lightweight, accessible way to create interactive tree structures for nested data like JSON without relying on heavy external libraries.
 **Action:** Implemented a recursive `createJsonTree` function that wraps JSON objects and arrays in `<details>` elements, creating a collapsible, styled tree view for raw EDID parsed data. Also added recursive formatting for Base/Extension block data.
## 2026-07-16 - [Interactive Tree UI with native details element]
 **Learning:** Native HTML `<details>` and `<summary>` elements provide a lightweight, accessible way to create interactive tree structures without relying on heavy JavaScript libraries.
 **Action:** Replaced static `<div>` containers with `<details>` and `<summary>` to implement a collapsible tree UI for complex data structures like EDID viewer JSON, leaving them collapsed by default by omitting the `open` attribute.

## 2024-05-18 - Interactive Tree UI for JSON Data
**Learning:** For rendering complex nested data objects (like EDID parsing results), a flat key-value list can be overwhelming. Native HTML `<details>` and `<summary>` elements offer an effective, lightweight way to create interactive tree views without relying on external UI frameworks. CSS pseudo-elements (like `::before`) can be leveraged for dynamic tree indicators (e.g., rotating arrows).
**Action:** Implemented a recursive function (`buildTreeUI`) that generates nested `<details>` structures for objects and arrays in `edid-viewer.html`. All nodes default to a closed state, keeping the initial interface clean while allowing users to explore deep structural properties as needed. Data rendering always employs `escapeHtml()` for XSS protection.

## 2026-07-16 - Dynamic Empty State Handling
**Learning:** Automatically hiding empty data sections enhances the UX of data viewers, avoiding confusion when features aren't present.
**Action:** Added conditional DOM logic checking feature counts and applying 'display: none' dynamically in `edid-viewer.html`.
## 2026-07-16 - [EDID Viewer Hex Dump Output]
 **Learning:** Handling raw byte arrays (like Uint8Array) in a UI tree often causes browser freezes if blindly converted to nested DOM elements, and it is usually illegible for users.
 **Action:** Implemented a safe `formatHexDump` formatter with a byte limit (4096 bytes) that detects byte array types and renders them inside a `<pre>` block as structured hex dumps with offsets, improving performance and readability.
## 2026-07-16 - Add Expand All / Collapse All functionality to Tree Viewer
 **Learning:** Standard HTML `<details>` elements can be dynamically expanded and collapsed across a tree hierarchy by toggling the `open` attribute on all elements within a specified container.
 **Action:** Implemented `window.toggleTree(containerId, expand)` function in vanilla JS and added inline toggle buttons (`+`/`-`) to section headers in EDID viewer to improve usability.

## 2024-05-18 - Web-based JS Execution Sandbox
**Learning:** For a web-based JavaScript execution engine, a hidden iframe (`sandbox="allow-same-origin allow-scripts"`) is an effective and lightweight way to evaluate user scripts cleanly. To safely render outputs directly in vanilla JavaScript without an XSS vulnerability, using `textContent` for appending nodes is preferred over `innerHTML`.
**Action:** Implemented a dark-themed, xterm-like UI in `js-playground.html` featuring custom print functions injected into an iframe sandbox, with text displayed via `textContent` creation.
