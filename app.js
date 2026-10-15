/* ============================================================
   Book Tracker — Application Logic
   Handles adding books, displaying them, persisting
   the book list in browser localStorage, searching,
   changing reading status, and deleting books.
   ============================================================ */

// ---- localStorage configuration ----
// This is the single key used to store our books array in the browser.
// Using a clear, unique name avoids collisions with other apps.
const STORAGE_KEY = 'booktracker_books';

// ---- Load books from localStorage ----
// Called once when the page starts.
// Returns the saved array, or an empty array if nothing is saved
// or the saved data is corrupt / unreadable.
function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    // Nothing saved yet — start with an empty list
    if (raw === null) {
      return [];
    }

    const parsed = JSON.parse(raw);

    // Extra safety: make sure what we got back is actually an array
    if (!Array.isArray(parsed)) {
      console.warn('localStorage data was not an array. Starting fresh.');
      return [];
    }

    // Defensive check: keep only valid book objects to prevent runtime errors
    return parsed.filter(function (item) {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.author === 'string' &&
        typeof item.status === 'string'
      );
    });
  } catch (error) {
    // JSON.parse failed — the data is corrupt
    console.warn('Could not parse saved books. Starting fresh.', error);
    return [];
  }
}

// ---- Save books to localStorage ----
// Called every time the books array changes.
// Converts the array to a JSON string before storing.
function saveBooks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (error) {
    // This can happen if localStorage is full or disabled.
    console.warn('Could not save books to localStorage.', error);
  }
}

// ---- Book storage ----
// Load any previously saved books into the array.
// Newest books are at the BEGINNING of this array.
const books = loadBooks();

// ---- DOM element references ----
// We grab these once so we don't have to search the page repeatedly.
const bookForm       = document.getElementById('book-form');
const titleInput     = document.getElementById('book-title');
const authorInput    = document.getElementById('book-author');
const statusSelect   = document.getElementById('book-status');
const titleError     = document.getElementById('title-error');
const authorError    = document.getElementById('author-error');
const bookListEl     = document.getElementById('book-list');
const emptyMessage   = document.getElementById('empty-message');
const searchInput    = document.getElementById('search-input');
const noMatchMessage = document.getElementById('no-match-message');

// ---- Generate a simple unique ID ----
// Date.now() gives milliseconds since 1970; adding a random number
// makes collisions extremely unlikely even if two books are added
// in the same millisecond.
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ---- Validation helpers ----

/**
 * Clear all visible validation errors and remove error styling.
 */
function clearErrors() {
  titleError.textContent = '';
  authorError.textContent = '';
  titleInput.classList.remove('input-error');
  authorInput.classList.remove('input-error');
  titleInput.removeAttribute('aria-invalid');
  authorInput.removeAttribute('aria-invalid');
}

/**
 * Validate the title and author fields.
 * Returns true if everything is valid, false otherwise.
 * Shows an error message next to each invalid field.
 */
function validateForm(title, author) {
  let isValid = true;

  // Check title: must not be empty or whitespace-only
  if (title === '') {
    titleError.textContent = 'Please enter a book title.';
    titleInput.classList.add('input-error');
    titleInput.setAttribute('aria-invalid', 'true');
    isValid = false;
  }

  // Check author: must not be empty or whitespace-only
  if (author === '') {
    authorError.textContent = 'Please enter the author\'s name.';
    authorInput.classList.add('input-error');
    authorInput.setAttribute('aria-invalid', 'true');
    isValid = false;
  }

  return isValid;
}

// ---- Search / Filtering ----

/**
 * Return the subset of books whose title or author matches
 * the current search query. The comparison is case-insensitive
 * and matches partial words.
 *
 * If the search box is empty (or only whitespace), all books
 * are returned — nothing is filtered out.
 *
 * IMPORTANT: This only filters what is DISPLAYED. The original
 * books array and localStorage are never modified by a search.
 */
function getFilteredBooks() {
  const query = searchInput.value.trim().toLowerCase();

  // Empty query → show everything
  if (query === '') {
    return books;
  }

  // Keep only books where the title OR author contains the query
  return books.filter(function (book) {
    const titleMatch  = book.title.toLowerCase().includes(query);
    const authorMatch = book.author.toLowerCase().includes(query);
    return titleMatch || authorMatch;
  });
}

// ---- Rendering ----

/**
 * Create a DOM element (a "card") for a single book.
 * Uses createElement and textContent for safety — user input
 * is never injected as raw HTML.
 */
function createBookCard(book) {
  // Outer card container
  const card = document.createElement('div');
  card.className = 'book-card';
  card.dataset.id = book.id;       // store id for future features

  // Left side: title and author
  const info = document.createElement('div');
  info.className = 'book-info';

  const titleEl = document.createElement('div');
  titleEl.className = 'book-title';
  titleEl.textContent = book.title;         // safe — no innerHTML

  const authorEl = document.createElement('div');
  authorEl.className = 'book-author';
  authorEl.textContent = 'by ' + book.author;  // safe

  info.appendChild(titleEl);
  info.appendChild(authorEl);

  // Right side: actions container with status dropdown and delete button
  const actions = document.createElement('div');
  actions.className = 'book-actions';

  // Status dropdown (lets users change a book's status directly from the card)
  const statusDropdown = document.createElement('select');
  statusDropdown.className = 'status-select';
  statusDropdown.dataset.id = book.id;

  // Accessible label — screen readers will announce e.g.
  // "Reading status for Atomic Habits"
  statusDropdown.setAttribute('aria-label', 'Reading status for ' + book.title);

  // The three possible statuses
  const statuses = ['To read', 'Reading', 'Finished'];

  for (const statusOption of statuses) {
    const option = document.createElement('option');
    option.value = statusOption;
    option.textContent = statusOption;

    // Pre-select the book's current status
    if (statusOption === book.status) {
      option.selected = true;
    }

    statusDropdown.appendChild(option);
  }

  // Apply the correct colour based on the current status
  statusDropdown.dataset.status = book.status;

  // When the user picks a new status, update data + localStorage
  statusDropdown.addEventListener('change', function () {
    handleStatusChange(book.id, this.value, this);
  });

  // Delete button — identifies book by unique ID and confirms before deletion
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn-delete';
  deleteBtn.dataset.id = book.id;
  deleteBtn.setAttribute('aria-label', 'Delete ' + book.title);
  deleteBtn.textContent = '🗑️ Delete';

  deleteBtn.addEventListener('click', function () {
    handleDeleteBook(book.id);
  });

  // Assemble actions container
  actions.appendChild(statusDropdown);
  actions.appendChild(deleteBtn);

  // Assemble the card
  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

/**
 * Re-render the book list.
 * Accepts an array of books to display (usually the filtered list).
 *
 * Shows three possible states:
 * 1. No books at all        → "No books added yet..." message
 * 2. Books exist, none match → "No books match your search." message
 * 3. Matching books found    → display the book cards
 */
function renderBooks(booksToDisplay) {
  // Clear existing list content
  bookListEl.innerHTML = '';

  // Hide both messages by default; we'll show the right one below
  emptyMessage.style.display   = 'none';
  noMatchMessage.style.display = 'none';

  if (books.length === 0) {
    // State 1: The user has no books at all
    emptyMessage.style.display = 'block';
  } else if (booksToDisplay.length === 0) {
    // State 2: Books exist, but the search found no matches
    noMatchMessage.style.display = 'block';
  } else {
    // State 3: Show the matching book cards
    for (const book of booksToDisplay) {
      const card = createBookCard(book);
      bookListEl.appendChild(card);
    }
  }
}

// ---- Status change handler ----

/**
 * Called when a user picks a new status from a book card's dropdown.
 *
 * How it works:
 * 1. Find the book in the books array using its unique ID.
 * 2. Update the book's status property (the single source of truth).
 * 3. Save the entire array to localStorage so the change persists.
 * 4. Update the dropdown's data-status attribute so CSS applies
 *    the correct colour immediately — without re-rendering the
 *    entire list (which would be disruptive while the user is
 *    interacting with it).
 *
 * @param {string}      bookId      - The unique ID of the book to update.
 * @param {string}      newStatus   - The newly selected status value.
 * @param {HTMLElement}  selectEl   - The <select> element that fired the event.
 */
function handleStatusChange(bookId, newStatus, selectEl) {
  // Find the book object in our array
  const book = books.find(function (b) {
    return b.id === bookId;
  });

  // Safety check — if the book isn't found, do nothing
  if (!book) {
    console.warn('Could not find book with ID:', bookId);
    return;
  }

  // Update the single source of truth
  book.status = newStatus;

  // Persist the change
  saveBooks();

  // Update the dropdown colour via the data-status attribute
  selectEl.dataset.status = newStatus;
}

// ---- Delete book handler ----

/**
 * Called when a user clicks the "Delete" button on a book card.
 *
 * How it works:
 * 1. Find the book in the books array using its unique ID.
 * 2. Ask the user for confirmation via window.confirm.
 * 3. If canceled, return immediately without modifying anything.
 * 4. If confirmed, locate the book's index by unique ID and remove it.
 * 5. Save the updated array to localStorage immediately.
 * 6. Re-render the displayed books respecting the current search query.
 *    (If all books are gone, the empty-state message appears. If a search
 *    was active, only matching books remain or the no-match message appears.)
 *
 * @param {string} bookId - The unique ID of the book to delete.
 */
function handleDeleteBook(bookId) {
  // Find the book object to display its title in the confirmation dialog
  const book = books.find(function (b) {
    return b.id === bookId;
  });

  // Safety check — if the book isn't found, do nothing
  if (!book) {
    console.warn('Could not find book with ID to delete:', bookId);
    return;
  }

  // Ask for confirmation before permanently deleting
  const confirmed = window.confirm('Are you sure you want to delete "' + book.title + '"?');
  if (!confirmed) {
    return;
  }

  // Locate the exact index by unique ID
  const bookIndex = books.findIndex(function (b) {
    return b.id === bookId;
  });

  if (bookIndex !== -1) {
    // Remove only that book from the array
    books.splice(bookIndex, 1);

    // Save updated array to localStorage
    saveBooks();

    // Re-render, respecting any active search query
    renderBooks(getFilteredBooks());
  }
}

// ---- Form submission handler ----

bookForm.addEventListener('submit', function (event) {
  // Prevent the browser from reloading the page
  event.preventDefault();

  // Clear previous validation errors
  clearErrors();

  // Read and trim the inputs
  const title  = titleInput.value.trim();
  const author = authorInput.value.trim();
  const status = statusSelect.value;

  // Validate — stop here if invalid
  if (!validateForm(title, author)) {
    return;
  }

  // Create a new book object
  const newBook = {
    id:     generateId(),
    title:  title,
    author: author,
    status: status
  };

  // Add to the BEGINNING of the array so newest books appear first
  books.unshift(newBook);

  // Persist the updated list to localStorage
  saveBooks();

  // Update the displayed list, respecting the current search query.
  // If the user has text in the search box, the newly added book
  // will only appear if it matches the query — but it is always
  // safely stored in the books array and localStorage.
  renderBooks(getFilteredBooks());

  // Reset the form fields for the next entry
  titleInput.value  = '';
  authorInput.value = '';
  statusSelect.value = 'To read';

  // Move focus back to the title field for convenience
  titleInput.focus();
});

// ---- Search event listener ----
// Fires every time the user types (or clears) the search box.
// Filters the displayed list instantly without touching the
// books array or localStorage.
searchInput.addEventListener('input', function () {
  renderBooks(getFilteredBooks());
});

// ---- Initial render ----
// Show saved books (or the empty-state message) when the page first loads.
renderBooks(getFilteredBooks());
