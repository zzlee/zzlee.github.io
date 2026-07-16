## 2024-05-18 - Async Loading State for API Fetches
**Learning:** For public API fetches (like the TWSE stock API), requests can take varying amounts of time. Without an explicit disabled and visual loading state, users might click the button multiple times, causing race conditions or redundant network requests, or get confused thinking the app is unresponsive.
**Action:** Always wrap asynchronous actions with a clear UI loading state. Disable the trigger element (e.g., button), visually update its text or style (e.g., opacity, cursor), and guarantee restoration of its original state in a `finally` block to handle both success and error cases reliably.
## 2026-06-23 - Interactive Commit History
**Learning:** Implementing an exclusive accordion pattern for commit lists improves navigation by reducing vertical scroll fatigue, and using `white-space: pre-wrap` is essential for displaying multi-line developer insights generated from commit metadata.
**Action:** Applied exclusive toggle logic to commit headers and added `white-space: pre-wrap` to the `.dev-log` class in `zstreamer-commits.html`.
## 2024-05-18 - Client-Side Large Array Data Processing
**Learning:** Client-side conversion operations of large raw byte arrays (e.g. video frames) block the main thread and can crash lower-end devices or show standard browser 'Page Unresponsive' errors. Using standard ArrayBuffer reading via asynchronous file API operations combined with an explicit UI loading state is necessary.
**Action:** Wrapped the file reading and the tight byte parsing loop in `yuv-rgb.html` with disabled states for user actions and an indicator message updating UI text dynamically before the heavy computations run.
