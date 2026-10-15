# PROMPTS.md — Book Tracker Development Log

This file documents each development prompt, the expected behavior, the actual test results, and any bugs discovered along the way.

---

## Step 1: Build the Initial Book Tracker Website

### Prompt Summary

Build the foundational Book Tracker page with:
- A header displaying the app title and description.
- A form with inputs for book title, author, and a reading-status dropdown (To read / Reading / Finished).
- Validation that rejects empty or whitespace-only title and author fields, showing error messages near the relevant field.
- An in-memory JavaScript array to store book objects.
- A book list that displays each book as a card (title, author, status badge), with the newest book shown first.
- An empty-state message when no books have been added.
- Safe DOM rendering (createElement / textContent — no innerHTML with user data).
- Technology: HTML + CSS + vanilla JavaScript only. No frameworks, no localStorage yet.

### Files Created

| File         | Purpose                                   |
|--------------|-------------------------------------------|
| index.html   | Page structure — header, form, book list  |
| style.css    | Visual design — colors, layout, badges    |
| app.js       | Application logic — validation, rendering |
| PROMPTS.md   | This development log                      |

### Expected Behavior

1. Page loads with header, form, and an empty-state message.
2. Submitting a valid title + author adds a book card at the top of the list.
3. The empty-state message disappears once a book is added.
4. Submitting an empty or whitespace-only title shows "Please enter a book title."
5. Submitting an empty or whitespace-only author shows "Please enter the author's name."
6. Both errors can show at the same time if both fields are invalid.
7. After a successful add, the form resets (title cleared, author cleared, status back to "To read").
8. The page does not reload on submit.
9. Each book card shows its title, author (prefixed with "by"), and a colored status badge.
10. Newest books appear first in the list.

### Actual Test Results

- Automated logic tests: **PASSED** (automated suite executed in Step 5 confirmed validation, empty state display, newest-first ordering, and error clearing).
- Browser visual testing: ⏳ **Pending manual testing by user**.

### Bugs Discovered

_None observed in automated logic tests._

---

## Step 2: Save Books Using Browser localStorage

### Prompt Summary

Add persistent storage so books survive a page refresh:
- Store the books array in `localStorage` under the key `booktracker_books`.
- Use `JSON.stringify()` when saving and `JSON.parse()` when loading.
- Load saved books automatically when the page starts.
- Save the updated array every time a new valid book is added.
- Handle corrupt or invalid localStorage data gracefully (log a warning and start fresh).
- Handle localStorage write errors (e.g., storage full) gracefully with a try/catch.
- No changes to HTML or CSS. Only `app.js` was modified.

### Files Modified

| File       | Change                                                       |
|------------|--------------------------------------------------------------|
| app.js     | Added `STORAGE_KEY`, `loadBooks()`, `saveBooks()` functions. Changed `books` initialization to call `loadBooks()`. Added `saveBooks()` call after a book is added. |
| PROMPTS.md | Added this Step 2 entry.                                     |

### Expected Behavior

1. Adding a book still works exactly as in Step 1.
2. After adding a book and **refreshing the page**, the book is still displayed.
3. Adding multiple books and refreshing preserves all of them in the correct order (newest first).
4. Each book's title, author, and status are preserved correctly.
5. If localStorage contains invalid JSON, the app starts with an empty list and logs a warning (does not crash).
6. If localStorage is unavailable or full, the app still works in-memory and logs a warning.
7. Form validation from Step 1 still works unchanged.

### Actual Test Results

- Automated logic tests: **PASSED** (automated suite executed in Step 5 confirmed localStorage storage, JSON stringification, parsing, simulated page refresh retention, and corrupt data recovery).
- Browser visual testing: ⏳ **Pending manual testing by user**.

### Bugs Discovered

_None observed in automated logic tests._

---

## Step 3: Add Search to the Book Tracker

### Prompt Summary

Add a search input above the book list that lets users filter books by title or author:
- Search is case-insensitive and matches partial words.
- Filtering happens live as the user types (on the `input` event).
- Leading/trailing whitespace in the query is trimmed before matching.
- An empty query shows all books.
- When no books match, a "No books match your search." message is shown.
- Searching only filters the **displayed** list — the `books` array and localStorage are never modified by a search.
- When a book is added while a search query is active, the display updates respecting the current query.
- Newest-first order is preserved among matching books.

### Files Modified

| File         | Change                                                                                              |
|--------------|-----------------------------------------------------------------------------------------------------|
| index.html   | Added a search input (`#search-input`) and a no-match message (`#no-match-message`) in the list section. |
| style.css    | Added `.search-wrapper` styling for spacing below the search input.                                 |
| app.js       | Added `getFilteredBooks()` function. Updated `renderBooks()` to accept a `booksToDisplay` parameter and handle three display states (no books / no matches / matching books). Added `searchInput` event listener. Updated form submit and initial render to use `getFilteredBooks()`. |
| PROMPTS.md   | Added this Step 3 entry.                                                                            |

### Expected Behavior

1. A search input with placeholder "Search by title or author..." appears above the book list.
2. Typing a full title (e.g., "Dune") shows only matching books.
3. Typing a partial title (e.g., "Du") also matches "Dune".
4. Typing an author name (e.g., "Herbert") shows books by that author.
5. Search is case-insensitive — "dune", "DUNE", and "Dune" all match the same book.
6. Searching for something that doesn't exist shows "No books match your search."
7. Clearing the search box restores the full book list.
8. If no books have been added at all, the original "No books added yet..." message is shown (not the "no matches" message).
9. Adding a book while a search query is active saves the book correctly; it appears in the list if it matches the query.
10. Refreshing the page and then searching works correctly on saved books.
11. All Step 1 and Step 2 features (add, validate, persist) continue to work.

### Actual Test Results

- Automated logic tests: **PASSED** (automated suite executed in Step 5 confirmed case-insensitive title/author filtering, partial word matching, whitespace trimming, empty list display, and no-match empty state).
- Browser visual testing: ⏳ **Pending manual testing by user**.

### Bugs Discovered

_None observed in automated logic tests._

---

## Step 4: Allow Users to Change Book Status

### Prompt Summary

Replace the static status badge on each book card with an interactive dropdown that lets users change a book's reading status:
- Each dropdown shows "To read", "Reading", and "Finished", with the book's current status pre-selected.
- Changing the dropdown updates the `books` array (single source of truth), saves to localStorage, and updates the dropdown colour — all without re-rendering the entire list.
- Each dropdown has an `aria-label` like "Reading status for Dune" for accessibility.
- Status changes work correctly during an active search and persist after page refresh.

### Files Modified

| File         | Change                                                                                              |
|--------------|-----------------------------------------------------------------------------------------------------|
| app.js       | Replaced static `<span>` badge with `<select>` dropdown in `createBookCard()`. Added `handleStatusChange()` function that updates the book object, saves to localStorage, and updates the dropdown's `data-status` for CSS colouring. |
| style.css    | Replaced `.status-badge` rules with `.status-select` rules styling the dropdown with coloured backgrounds matching each status, focus states, and pill-shaped border-radius. |
| PROMPTS.md   | Added this Step 4 entry.                                                                            |

### Expected Behavior

1. Each book card displays a dropdown (not a static label) showing the book's current status.
2. The dropdown is coloured: blue for "To read", amber for "Reading", green for "Finished".
3. Selecting a new status immediately updates the dropdown colour.
4. The change is saved to localStorage.
5. After refreshing the page, the updated status is still displayed.
6. Changing one book's status does not affect any other book.
7. Status changes work on books shown during an active search.
8. Clearing the search shows all books with their correct (possibly updated) statuses.
9. All Step 1–3 features (add, validate, persist, search) continue to work.

### Actual Test Results

- Automated logic tests: **PASSED** (automated suite executed in Step 5 confirmed interactive status selection, updating book object, data-status attribute binding, and persistence across storage reloads).
- Browser visual testing: ⏳ **Pending manual testing by user** (status dropdown click, responsive dropdown alignment).

### Bugs Discovered

- **Focus state color override**: In `style.css`, `.status-select[data-status="..."]` rules had equal specificity to `.status-select:focus` and appeared after it, overriding the focus border color. Fixed in Step 5 by positioning the focus selector after status styling and applying a dedicated 2px outline and focus ring.

---

## Step 5: Final Quality Check, UI Polish, Documentation, and GitHub Preparation

### Prompt Summary

Perform a comprehensive quality check of the entire application:
- Review the complete feature set (adding books, required-field and whitespace validation, newest-first ordering, localStorage persistence, case-insensitive/partial search, status switching, empty and no-match states).
- Polish the user interface and CSS (desktop/mobile responsiveness, focus indicators, labels, typography, spacing).
- Check code quality, accessibility (`aria-describedby`, `aria-invalid`, `role="alert"`, keyboard accessibility, safe DOM updates).
- Execute automated tests supported by the project environment.
- Record all development stages, genuine test results, and corrections in `PROMPTS.md`.
- Inspect Git configuration and prepare version control commands.
- Provide a full explanation and manual test checklist.

### Files Modified

| File         | Change                                                                                              |
|--------------|-----------------------------------------------------------------------------------------------------|
| index.html   | Added `aria-describedby` pointing to error message spans for accessibility. Added semantic `<footer>`. |
| style.css    | Enhanced `.status-select:focus` and `:focus-visible` with prominent outline/ring so it is never overridden by status background colors. Added `overflow-wrap: break-word` and `word-break: break-word` for titles and authors. Added `.footer` styles. Refined mobile card layout with full-width info container and aligned dropdown. |
| app.js       | Updated header to Step 5 Final. Enhanced `loadBooks()` with item-level structure validation to safely discard corrupted non-object entries. Added dynamic `aria-invalid` toggling on inputs during validation and clearing. |
| PROMPTS.md   | Completed documentation for all 5 stages, documenting genuine test results and corrections.         |

### Expected Behavior

1. All features from Steps 1–4 continue to operate without regression.
2. Form fields clearly communicate errors visually and to assistive technology via `aria-describedby` and `aria-invalid`.
3. Focused elements (inputs, select dropdowns, submit button) exhibit clear, high-contrast focus rings.
4. Cards remain structured and wrap text cleanly on small mobile viewports.
5. In corrupted localStorage scenarios (invalid JSON, non-array, or array with null/malformed items), the application recovers gracefully without throwing uncaught exceptions.
6. The UI includes a clean footer completing the visual presentation.

### Actual Test Results

- **Automated Tests Executed by Developer**:
  - Created and executed a 50-assertion automated test suite in Node.js (`scratch/run_tests.js`).
  - Results: **50/50 PASSED** (0 failures).
  - Coverage:
    - Empty state rendering on initial load (3 tests)
    - Form validation: empty inputs, whitespace-only inputs, partial validity, error messages, class toggling, `aria-invalid` state (11 tests)
    - Adding books & newest-first unshift ordering in DOM (4 tests)
    - localStorage saving & loading with simulated page reloads (7 tests)
    - Search filtering: partial matching, case-insensitivity, author matching, query whitespace trimming, no-match state, search clearing restoration (11 tests)
    - Status dropdown changes: DOM dataset updating, localStorage persistence, persistence across simulated reloads (6 tests)
    - Graceful error recovery: malformed JSON strings, non-array data, arrays with null/corrupt items (4 tests)
- **Browser Automation Attempt**:
  - Launched `browser_subagent` to execute end-to-end browser actions.
  - Result: Failed due to environment network constraint (Playwright driver download 404 from Azure CDN in this sandbox).
  - Remediation: Provided a detailed step-by-step manual test checklist for the user to perform in their local browser.

### Mistakes Discovered During Inspection & Testing

1. **Status Dropdown Focus Ring Overridden by Attribute Selectors**:
   - *Problem*: In `style.css`, `.status-select:focus` was placed before `.status-select[data-status="..."]`. Because both selectors had specificity (0, 2, 0), the status border-color took precedence over the focus border-color, making keyboard focus hard to discern.
   - *Fix*: Moved the focus rules below the status rules and added `outline: 2px solid var(--color-primary); outline-offset: 1px; box-shadow: 0 0 0 3px rgba(74, 111, 165, 0.2);`.
   - *Retest Result*: Verified via code inspection and style cascading rules.

2. **Potential Runtime Crash on Malformed LocalStorage Items**:
   - *Problem*: `loadBooks()` checked `if (!Array.isArray(parsed))` but did not check if individual elements inside the array were objects with string properties. If an element was `null` or `{}` (e.g. from manual DevTools tampering), `getFilteredBooks()` would throw `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.
   - *Fix*: Added a `.filter()` in `loadBooks()` verifying that each item is an object with valid `id`, `title`, `author`, and `status` strings.
   - *Retest Result*: Automated Test 7 passed; corrupt items are safely dropped while valid items are preserved.

3. **Missing Accessible Associations on Inputs**:
   - *Problem*: Screen readers had no link between the input elements and the `#title-error` / `#author-error` messages.
   - *Fix*: Added `aria-describedby="title-error"` and `aria-describedby="author-error"` in `index.html`, and dynamically added/removed `aria-invalid="true"` in `app.js`.
   - *Retest Result*: Automated Test 2 confirmed `aria-invalid="true"` is set when validation fails and cleared on reset.

---

## Visual Redesign: Warm Ivory & Forest Green Portfolio Polish

### Prompt Summary

Transform the Book Tracker into an attractive, modern, professional portfolio-ready website:
- Warm ivory / parchment background (`#f7f5ef`).
- Deep, luxurious forest-green primary palette (`#1e3f28` to `#244b30`).
- Editorial typography pairing: `Playfair Display` (serif) for bookish headings & titles, and `Plus Jakarta Sans` (sans-serif) for clean UI and inputs.
- Beautiful book cards with refined borders (`1px solid #e3ded3`), subtle layered drop shadows, and smooth hover elevation.
- Redesigned pill-shaped reading status indicators with bespoke color schemes (soft slate for "To read", warm amber for "Reading", botanical green for "Finished").
- Polished form inputs with smooth ivory-to-white focus transitions and accessible focus rings.
- Fully responsive layout with custom mobile breakpoints (`600px` and `480px`).
- Preserved 100% of existing functionality, validation, localStorage persistence, search, and status toggles.

### Files Modified

| File         | Change                                                                                              |
|--------------|-----------------------------------------------------------------------------------------------------|
| index.html   | Added Google Fonts `<link>` tags for `Playfair Display` and `Plus Jakarta Sans` with preconnect links. |
| style.css    | Complete visual redesign with new design tokens, warm ivory page background, rich forest green gradients, serif heading hierarchy, refined card elevation, elegant form styling, and responsive queries. |
| PROMPTS.md   | Documented the visual redesign prompt, implemented changes, test results, and manual checklist.     |

### Expected Behavior

1. The page renders with a warm ivory background and a rich forest-green header featuring gold accent line and serif typography.
2. Form section and book cards appear with soft borders, rounded corners, and gentle drop shadows.
3. Book titles render in elegant serif font (`Playfair Display`) while author names render in refined italic typography.
4. Status dropdowns display with harmonious pastel/botanical tints matching their state.
5. Hovering cards subtly elevates them with a soft expanded shadow.
6. All functionality from Steps 1–5 remains completely intact with zero functional regression.

### Actual Test Results

- **Automated Logic Tests**: **50/50 PASSED** (0 failures).
  - Executed `scratch/run_tests.js` against the updated codebase.
  - Confirmed 100% pass rate across form validation, card rendering, newest-first ordering, localStorage sync, search filtering, and status changes.
- **Browser Visual Testing**: ⏳ **Pending manual inspection by user**.

### Bugs Discovered

_None observed. All functional DOM selectors and data bindings were strictly preserved._

---

## Feature Update: Add a Delete Option to Every Book

### Prompt Summary

Add a Delete button to every displayed book card:
- Identify each book strictly by its unique ID.
- Display a native browser confirmation dialog before deleting (`window.confirm`).
- If canceled, leave the book and storage untouched.
- If confirmed, remove only that book from the `books` array, immediately synchronize with `localStorage`, and re-render.
- Support active searches: deleting a filtered book removes only that book, updates displayed results, shows the no-match message if none remain, and preserves hidden books.
- Display the empty-state message if the deleted book was the last one.
- Maintain a visual design matching the warm ivory and forest-green aesthetic with a subtle red destructive styling (`#fdf2f0` bg, `#a8281d` text, `#f3cdc8` border, pill shape, focus ring).
- Provide an accessible label like `aria-label="Delete Atomic Habits"`.
- Preserve all existing functionality without regressions or external libraries.

### Files Modified

| File         | Change                                                                                              |
|--------------|-----------------------------------------------------------------------------------------------------|
| app.js       | In `createBookCard()`, created `.book-actions` container holding `.status-select` and `.btn-delete`. Added `aria-label` with book title. Added `handleDeleteBook(bookId)` with `window.confirm()`, `books.splice()`, `saveBooks()`, and `renderBooks(getFilteredBooks())`. |
| style.css    | Added styles for `.book-actions` container and `.btn-delete` with subtle crimson background, hover state, active state, and `:focus-visible` ring. Updated mobile breakpoint for responsive actions alignment. |
| PROMPTS.md   | Documented this delete feature update, expected behaviors, test executions, and manual checklist.   |

### Expected Behavior

1. Each book card renders a "🗑️ Delete" button aligned neatly beside the status dropdown.
2. Clicking "Delete" prompts `window.confirm('Are you sure you want to delete "<title>"?')`.
3. Clicking "Cancel" leaves the book unchanged in DOM, array, and `localStorage`.
4. Clicking "OK" removes that specific book by unique ID, updates `localStorage`, and updates the DOM.
5. If two books have identical titles, only the clicked book is deleted.
6. Deleting while a search query is active preserves the search query, updates results, and leaves hidden books in `localStorage`.
7. Deleting the last remaining book triggers the original empty-state message.
8. Refreshing the browser confirms the deletion is permanent.

### Actual Test Results

- **Automated Tests Executed by Developer**:
  - Expanded test suite to **76 assertions** (`scratch/run_tests.js`).
  - Results: **76/76 PASSED** (0 failures).
  - Deletion coverage:
    - Cancel confirmation maintains 3 books in DOM and `localStorage` (PASS).
    - Confirm deletion removes exact targeted book from array and storage (PASS).
    - Duplicate titles with distinct IDs: deleting one preserves the other (PASS).
    - Deletion during active search: removes visible book, reveals no-match message, and preserves hidden books when search is cleared (PASS).
    - Status changes on remaining books after deletion continue to function (PASS).
    - Adding new books after deletion works and prepends to top (PASS).
    - Deleting all books down to zero restores empty state message (PASS).
    - Reloading from storage verifies empty state persists (PASS).
- **Browser Visual Testing**: ⏳ **Pending manual inspection by user**.

### Bugs Discovered

- **Test Suite Event Listener Crosstalk (in test runner)**: During test runner expansion, using a plain object `{}` for element keys converted elements to `"[object Object]"`, causing click events to broadcast to all buttons. Fixed in `run_tests.js` by storing listeners directly on element instances (`this.listeners`).
- *Application Code*: Zero bugs discovered; implementation passed all 76 unit and integration checks on initial execution.

---

## UI Improvement: Full-Page, Clean, and Well-Organized Library Dashboard

### Prompt Summary

Redesign the application layout as a modern, full-width library dashboard:
- Full-width content container scaling gracefully up to `1400px` without excessive wasted empty space.
- Clean, compact header spanning full width with logo, title, and "Personal Reading Library" badge.
- Attractive, compact welcome banner ("Your next chapter starts here.") that maintains above-the-fold visibility for core actions.
- Balanced two-column dashboard grid:
  - Left: "Add Book" panel (~32% width), sticky on desktop, with full-width form inputs, consistent control heights, and clear labels.
  - Right: Library collection section (~68% width) with the collection heading and search bar aligned side-by-side.
- Responsive book card grid:
  - Multi-column card layout (`auto-fill, minmax(280px, 1fr)`) allowing 2–3 cards per row on desktops, 2 on tablets, and 1 on mobile.
  - Consistent vertical card layout (title & author on top, status dropdown and delete button cleanly separated on bottom).
- Exact requested color theme:
  - Forest green (`#174C3A`), Deep green (`#103729`), Warm ivory (`#F5F0E6`), Off-white (`#FCFAF6`), Soft sage (`#D6E6B5`), Muted orange (`#D99A64`), Text (`#24332B`), Secondary text (`#718076`).
- Fully responsive across desktop, tablet, and mobile viewports with comfortable touch targets and no horizontal overflow.
- 100% preservation of JavaScript functionality, localStorage persistence, form validation, search filtering, and deletion.

### Files Modified

| File         | Change                                                                                              |
|--------------|-----------------------------------------------------------------------------------------------------|
| index.html   | Refactored layout to use `<div class="app-container">` (max-width 1400px), a compact navbar header, a welcome banner, a two-column `<main class="dashboard-grid">` with `<aside class="form-panel">` and `<section class="library-panel">`, and aligned `.library-header`. Preserved all required element IDs. |
| style.css    | Complete stylesheet rewrite for the full-width dashboard: defined custom properties matching the exact palette tokens, implemented the 2-column desktop grid with sticky form panel, responsive multi-column card grid, aligned search/heading row, pill-shaped action badges, and mobile breakpoints. |
| PROMPTS.md   | Documented this full-page dashboard UI improvement, changes, expected behaviors, and test results.   |

### Expected Behavior

1. On a wide desktop screen, the content spans comfortably up to 1400px with outer margins.
2. The Add Book form occupies the left column (~32%) while the book library occupies the right column (~68%).
3. The search bar is neatly aligned alongside the "Your Books" heading in the library header.
4. Book cards render in a balanced multi-column grid rather than stretched horizontal banners.
5. Each book card neatly separates the top content (title in serif font, author in italic) from the bottom action controls (status select and delete button).
6. On mobile screens (<640px), the layout stacks vertically with full-width search and comfortable tap targets.
7. All 76 automated test assertions continue to pass with zero functional regression.

### Actual Test Results

- **Automated Tests Executed by Developer**:
  - Executed `scratch/run_tests.js`.
  - Results: **76/76 PASSED** (0 failures).
  - Confirmed: Adding books, validation, whitespace checks, newest-first ordering, localStorage sync, search filtering, status updating, delete confirmation, and empty-state messaging all remain 100% functional.
- **Browser Visual Testing**: ⏳ **Pending manual inspection by user**.

### Bugs Discovered

_None observed. All functional DOM selectors and data bindings were strictly preserved._



