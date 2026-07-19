Here is the technical Markdown specification ready to be fed directly into Cursor. I have completely removed all framework, library, and database-specific references so Cursor can seamlessly apply it to your existing workspace tech stack.

You can save this as `PROMPT_BUILD_CHRONICLE_APP.md` in your project folder.

# Project Specification: Panachickal Family Digital Chronicle

## 1. System Overview

**Objective:** Build a subdomain-hosted, interactive digital chronicle companion app. The application must render hierarchical genealogical data as an immersive, page-turning digital book, dynamically assembling complete family profiles in generational order.

## 2. Architecture & Data Flow



### 2.1 Subdomain & Shared Database Integration

- The application must operate as an independent frontend/subdomain entity but securely query the existing primary database.
- **Data Source:** Read directly from the `Person` and `Relationships` entities established in the main family tree architecture.



### 2.2 Query Engine & Sequencing Logic

- **Ordering Pattern:** Data must be fetched and sequenced alphanumerically based on the `Genealogy Notation` key (e.g., `A` $\rightarrow$ `A1` $\rightarrow$ `A1.1` $\rightarrow$ `A1.2` $\rightarrow$ `B`). This depth-first structural mapping dictates the physical page order of the book.
- **Not-Null Rendering Enforcement:** The query and layout engine must aggressively filter null fields to prevent empty layout blocks. Fields like `ancestral_place`, `notes_bio`, and `profile_picture_url` must dictate conditional UI rendering.
- **Family Unit Grouping:** The engine must group data into "Family Cells" (Main Node + Spouse + Direct Children) to populate a single page or a two-page spread before flipping to the next generation or sibling branch.



## 3. UI/UX: The Digital Book Engine



### 3.1 Core Navigation & Canvas

- **Page-Flip Mechanism:** Implement a hardware-accelerated 3D page-flipping canvas. It must support drag-to-turn and click-to-turn gestures.
- **Responsive Layout:**
  - **Desktop/Tablet Landscape:** Render a classic dual-page spread (even pages on left, odd pages on right).
  - **Mobile/Portrait:** Gracefully collapse into a single-page swipeable magazine view.
- **Aesthetic Theme:** Apply a warm, heritage-inspired parchment background, high-contrast serif typography, and elegant borders. Support dual-language text rendering (English and Malayalam).



### 3.2 Dynamic Template Variants

The layout engine must programmatically select a layout variant based on the data payload of the current Family Cell:

- **Variant Alpha (Media-Rich):** Triggered when `profile_picture_url` and `notes_bio` exist. Renders the image inside a styled vintage frame, applies text-wrap for the biography, and highlights names/spouses in callout banners.
- **Variant Beta (Text-Centric):** Triggered when `profile_picture_url` is null. Expands typographic scale, centers historical notes, and uses decorative SVG dividers to emphasize location and profession data.
- **Variant Gamma (Index/Sub-Tree):** Triggered for nodes with large numbers of children. Displays the parent node details at the top and generates a clean, multi-column directory of children below, anchoring links to their respective future pages.



## 4. Interactive Components & Features



### 4.1 Indexing & Navigation Tools

- **Interactive Table of Contents (TOC):** A dynamically generated index on the first few pages, categorized by Root Branch (`A`, `B`, `C`) and Generation Depth. TOC entries must act as direct anchor links that trigger the page-flip animation to the exact target page.
- **Generation Ribbon:** A persistent UI overlay (outside the book canvas) acting as a bookmark slider. Allows users to instantly jump across generational depths without manually flipping through hundreds of pages.
- **Global Search:** A persistent search overlay. Users can query by Name or Notation Key. Selecting a result must trigger an automatic flip to the corresponding page.



### 4.2 Media Handling

- **Lightbox Feature:** Any rendered profile image or embedded document must support click-to-zoom, opening in a high-resolution lightbox overlay without disrupting the underlying book state or page position.



## 5. Execution Directives for AI

1. Scaffold the core page-flipping layout and responsive constraints first using mock data.
2. Build the data-fetching utility that correctly sorts the database rows by the `Genealogy Notation` alphanumeric logic.
3. Implement the dynamic template renderer (Alpha, Beta, Gamma) driven by the presence or absence of data fields.
4. Finalize the interactive routing (TOC, Generation Ribbon, Search).

