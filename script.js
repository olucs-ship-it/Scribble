/**
 * SCRIBBLE — Pastel Sticky Notes App
 * Pure Vanilla JavaScript implementation
 */

(() => {
  'use strict';

  // Constants
  const STORAGE_KEY = 'scribble-notes';
  const THEME_STORAGE_KEY = 'scribble-theme';
  const DEFAULT_COLOUR = '#FFF2B2'; // Pastel Yellow
  const PALETTE = [
    { name: 'Yellow', hex: '#FFF2B2' },
    { name: 'Pink', hex: '#FFDCE5' },
    { name: 'Blue', hex: '#D9ECFF' },
    { name: 'Mint', hex: '#D8F5DF' },
    { name: 'Lavender', hex: '#E9DFFF' },
    { name: 'Peach', hex: '#FFE2CC' }
  ];

  // State
  let notes = [];
  let searchQuery = '';
  let activeCategoryFilter = '';
  let noteToDeleteId = null;
  let lastActiveElement = null;

  // DOM Elements
  const notesGrid = document.getElementById('notes-grid');
  const notesCounter = document.getElementById('notes-counter');
  const emptyState = document.getElementById('empty-state');
  const noResultsState = document.getElementById('no-results-state');
  const searchQueryDisplay = document.getElementById('search-query-display');

  // Search Controls
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const resetSearchBtn = document.getElementById('reset-search-btn');

  // Category Controls
  const categoryFilter = document.getElementById('category-filter');
  const categoryFilterWrapper = document.getElementById('category-filter-wrapper');
  const categorySuggestions = document.getElementById('category-suggestions');

  // Header and Action Buttons
  const createNoteBtn = document.getElementById('create-note-btn');
  const emptyCreateBtn = document.getElementById('empty-create-btn');

  // Theme Toggle Elements
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleText = document.getElementById('theme-toggle-text');

  // Editor Modal Elements
  const noteModal = document.getElementById('note-modal');
  const noteForm = document.getElementById('note-form');
  const modalTitle = document.getElementById('modal-title');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const noteIdInput = document.getElementById('note-id-input');
  const noteTitleInput = document.getElementById('note-title-input');
  const noteContentInput = document.getElementById('note-content-input');
  const noteCategoryInput = document.getElementById('note-category-input');
  const formError = document.getElementById('form-error');
  const modalCardPreview = document.getElementById('modal-card-preview');

  // Delete Modal Elements
  const deleteModal = document.getElementById('delete-modal');
  const deleteCloseBtn = document.getElementById('delete-close-btn');
  const deleteCancelBtn = document.getElementById('delete-cancel-btn');
  const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
  const deleteNoteTargetTitle = document.getElementById('delete-note-target-title');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // ==========================================================================
  // Visibility Helper
  // Ensures elements are reliably toggled across all browsers & CSS display values
  // ==========================================================================

  function setElementVisibility(el, isVisible, defaultDisplay = '') {
    if (!el) return;
    if (isVisible) {
      el.removeAttribute('hidden');
      el.classList.remove('is-hidden');
      if (defaultDisplay) {
        el.style.setProperty('display', defaultDisplay, 'important');
      } else {
        el.style.removeProperty('display');
      }
    } else {
      el.setAttribute('hidden', '');
      el.classList.add('is-hidden');
      el.style.setProperty('display', 'none', 'important');
    }
  }

  // ==========================================================================
  // Storage & Persistence
  // ==========================================================================

  /**
   * Safely loads notes from localStorage with normalization
   * @returns {Array} List of validated note objects
   */
  function loadNotesFromStorage() {
    try {
      const rawData = localStorage.getItem(STORAGE_KEY);
      if (!rawData) {
        return [];
      }
      const parsed = JSON.parse(rawData);
      if (!Array.isArray(parsed)) {
        console.warn('Storage data corrupted or not an array. Resetting.');
        return [];
      }

      // Safely normalize each item so notes are never lost due to missing optional fields
      return parsed.map(item => {
        if (!item || typeof item !== 'object') return null;
        return {
          id: String(item.id || generateId()),
          title: String(item.title != null ? item.title : ''),
          content: String(item.content != null ? item.content : ''),
          color: String(item.color || DEFAULT_COLOUR),
          category: String(item.category || ''),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || item.createdAt || new Date().toISOString()
        };
      }).filter(Boolean);
    } catch (err) {
      console.error('Error loading notes from localStorage:', err);
      showToast('Could not read existing notes from storage.');
      return [];
    }
  }

  /**
   * Persists notes to localStorage
   * @param {Array} notesList
   * @returns {boolean} Success status
   */
  function persistNotesToStorage(notesList) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesList));
      return true;
    } catch (err) {
      console.error('Error saving notes to localStorage:', err);
      showToast('Storage error: unable to save changes.');
      return false;
    }
  }

  /**
   * Generates a unique note ID
   */
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  // ==========================================================================
  // Date Formatting Helper
  // ==========================================================================

  function formatDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  // ==========================================================================
  // UI Toast Feedback
  // ==========================================================================

  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ==========================================================================
  // Category Helpers
  // ==========================================================================

  const CATEGORY_COLOURS = [
    '#FFE08A', '#FFC9DE', '#B8DEFF', '#B5EFD0', '#D4C2FF', '#FFCFA3',
    '#FFB4A2', '#A8E6CF', '#C7CEFF', '#FFE59F'
  ];

  /**
   * Deterministically assigns a pastel colour to a category name
   * @param {string} category
   * @returns {string} hex colour
   */
  function categoryColour(category) {
    if (!category) return 'transparent';
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CATEGORY_COLOURS[Math.abs(hash) % CATEGORY_COLOURS.length];
  }

  /**
   * Returns a sorted list of unique, non-empty categories from all notes
   * @returns {string[]}
   */
  function getUniqueCategories() {
    const set = new Set();
    notes.forEach(n => {
      const cat = (n.category || '').trim();
      if (cat) set.add(cat);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Rebuilds the category filter <select> and editor datalist
   */
  function refreshCategoryControls() {
    const categories = getUniqueCategories();

    // Filter dropdown — keep track of current selection
    if (categoryFilter) {
      const current = activeCategoryFilter;
      categoryFilter.innerHTML = '';
      const allOption = document.createElement('option');
      allOption.value = '';
      allOption.textContent = 'All categories';
      categoryFilter.appendChild(allOption);
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categoryFilter.appendChild(opt);
      });
      // Preserve selection if still valid
      if (categories.includes(current)) {
        categoryFilter.value = current;
      } else {
        activeCategoryFilter = '';
        categoryFilter.value = '';
      }
      // Show/hide the whole filter wrapper
      setElementVisibility(categoryFilterWrapper, categories.length > 0, 'flex');
    }

    // Datalist suggestions for the editor input
    if (categorySuggestions) {
      categorySuggestions.innerHTML = '';
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        categorySuggestions.appendChild(opt);
      });
    }
  }

  /**
   * Handles filter dropdown change
   */
  function handleCategoryFilterChange(e) {
    activeCategoryFilter = e.target.value;
    renderNotes();
  }

  // ==========================================================================
  // Render & Grid Management
  // ==========================================================================

  /**
   * Renders sticky notes based on current notes and active search filter
   */
  function renderNotes() {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    // Refresh category dropdown & datalist from latest notes
    refreshCategoryControls();

    // Filter notes by category AND search query
    const filteredNotes = notes.filter(note => {
      const matchesCategory = !activeCategoryFilter || (note.category || '') === activeCategoryFilter;
      if (!matchesCategory) return false;
      if (!trimmedQuery) return true;
      const matchTitle = (note.title || '').toLowerCase().includes(trimmedQuery);
      const matchContent = (note.content || '').toLowerCase().includes(trimmedQuery);
      return matchTitle || matchContent;
    });

    // Update Counter
    const isFiltered = Boolean(trimmedQuery || activeCategoryFilter);
    if (notes.length === 0) {
      notesCounter.textContent = '0 notes';
    } else if (isFiltered) {
      notesCounter.textContent = `Showing ${filteredNotes.length} of ${notes.length} note${notes.length === 1 ? '' : 's'}`;
    } else {
      notesCounter.textContent = `${notes.length} note${notes.length === 1 ? '' : 's'}`;
    }

    // Handle View States
    if (notes.length === 0) {
      // 1. Canvas is completely empty (no notes exist yet)
      notesGrid.innerHTML = '';
      setElementVisibility(notesGrid, false);
      setElementVisibility(emptyState, true, 'flex');
      setElementVisibility(noResultsState, false);
      return;
    }

    // Notes exist - canvas is definitely not empty!
    setElementVisibility(emptyState, false);

    if (filteredNotes.length === 0) {
      // 2. Search is active but produced 0 matches
      notesGrid.innerHTML = '';
      setElementVisibility(notesGrid, false);
      searchQueryDisplay.textContent = searchQuery.trim();
      setElementVisibility(noResultsState, true, 'flex');
      return;
    }

    // 3. Notes found and displayed
    setElementVisibility(noResultsState, false);
    setElementVisibility(notesGrid, true, 'grid');

    // Clear and build cards safely using DOM methods
    notesGrid.innerHTML = '';

    filteredNotes.forEach(note => {
      const card = createNoteCardElement(note);
      notesGrid.appendChild(card);
    });
  }

  /**
   * Creates a 3D flippable note card DOM structure safely
   * @param {Object} note
   * @returns {HTMLElement}
   */
  function createNoteCardElement(note) {
    const article = document.createElement('article');
    article.className = 'note-card';
    article.setAttribute('data-id', note.id);
    article.setAttribute('tabindex', '0');
    article.setAttribute('role', 'region');
    article.setAttribute('aria-label', `Note: ${note.title || 'Untitled note'}. Press Enter or click to flip.`);

    const inner = document.createElement('div');
    inner.className = 'note-card-inner';

    // ------------------------------------------------------------------------
    // Front Face
    // ------------------------------------------------------------------------
    const front = document.createElement('div');
    front.className = 'note-face note-card-front';
    front.style.backgroundColor = note.color;

    const tape = document.createElement('div');
    tape.className = 'note-tape';
    tape.setAttribute('aria-hidden', 'true');
    front.appendChild(tape);

    const frontContent = document.createElement('div');
    frontContent.className = 'note-front-content';

    // Category badge (only if the note has a category)
    if (note.category && note.category.trim()) {
      const badge = document.createElement('span');
      badge.className = 'note-category-badge';
      badge.textContent = note.category;
      badge.style.backgroundColor = categoryColour(note.category);
      frontContent.appendChild(badge);
    }

    const titleEl = document.createElement('h3');
    titleEl.className = 'note-title';
    if (note.title.trim()) {
      titleEl.textContent = note.title;
    } else {
      titleEl.textContent = 'Untitled';
      titleEl.classList.add('note-title-empty');
    }
    frontContent.appendChild(titleEl);

    const previewEl = document.createElement('p');
    previewEl.className = 'note-preview-body';
    previewEl.textContent = note.content;
    frontContent.appendChild(previewEl);

    front.appendChild(frontContent);

    // Front Footer
    const footer = document.createElement('div');
    footer.className = 'note-footer';

    const dateEl = document.createElement('span');
    dateEl.className = 'note-date';
    dateEl.textContent = formatDate(note.updatedAt || note.createdAt);
    footer.appendChild(dateEl);

    const promptEl = document.createElement('span');
    promptEl.className = 'flip-prompt';
    promptEl.innerHTML = `
      <span>Flip</span>
      <svg class="flip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 14 4 9 9 4"></polyline>
        <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
      </svg>
    `;
    footer.appendChild(promptEl);
    front.appendChild(footer);

    // ------------------------------------------------------------------------
    // Back Face
    // ------------------------------------------------------------------------
    const back = document.createElement('div');
    back.className = 'note-face note-card-back';
    back.style.backgroundColor = note.color;

    const backHeader = document.createElement('div');
    backHeader.className = 'note-back-header';

    const backTitle = document.createElement('h3');
    backTitle.className = 'note-back-title';
    backTitle.textContent = note.title.trim() ? note.title : 'Untitled';
    backHeader.appendChild(backTitle);

    const backMeta = document.createElement('div');
    backMeta.className = 'note-back-meta';

    // Category chip on the back (only if the note has a category)
    if (note.category && note.category.trim()) {
      const backCat = document.createElement('span');
      backCat.className = 'note-back-category';
      backCat.textContent = note.category;
      backCat.style.backgroundColor = categoryColour(note.category);
      backMeta.appendChild(backCat);
    }

    const createdText = formatDate(note.createdAt);
    const updatedText = formatDate(note.updatedAt);
    const dateSpan = document.createElement('span');
    dateSpan.textContent = note.updatedAt && note.updatedAt !== note.createdAt
      ? `Updated ${updatedText}`
      : `Created ${createdText}`;
    backMeta.appendChild(dateSpan);
    backHeader.appendChild(backMeta);

    back.appendChild(backHeader);

    // Full Content
    const fullBody = document.createElement('div');
    fullBody.className = 'note-full-body';
    fullBody.textContent = note.content;
    back.appendChild(fullBody);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'note-controls';

    const flipBackBtn = document.createElement('button');
    flipBackBtn.type = 'button';
    flipBackBtn.className = 'btn-card-action btn-flip-back';
    flipBackBtn.setAttribute('aria-label', 'Flip back to note preview');
    flipBackBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="15 14 20 9 15 4"></polyline>
        <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
      </svg>
      <span>Flip back</span>
    `;
    flipBackBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      article.classList.remove('is-flipped');
    });
    controls.appendChild(flipBackBtn);

    const actionGroup = document.createElement('div');
    actionGroup.className = 'card-action-group';

    // Edit Button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-card-action btn-card-edit';
    editBtn.setAttribute('aria-label', `Edit note ${note.title || 'Untitled'}`);
    editBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
      <span>Edit</span>
    `;
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditorModal(note);
    });
    actionGroup.appendChild(editBtn);

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-card-action btn-card-delete';
    deleteBtn.setAttribute('aria-label', `Delete note ${note.title || 'Untitled'}`);
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      <span>Delete</span>
    `;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(note);
    });
    actionGroup.appendChild(deleteBtn);

    controls.appendChild(actionGroup);
    back.appendChild(controls);

    // Assemble inner
    inner.appendChild(front);
    inner.appendChild(back);
    article.appendChild(inner);

    // Flip Card interaction
    const toggleFlip = () => {
      article.classList.toggle('is-flipped');
    };

    article.addEventListener('click', (e) => {
      // Don't flip if user clicked inside scrollable text selection or controls
      if (e.target.closest('.btn-card-action')) {
        return;
      }
      toggleFlip();
    });

    article.addEventListener('keydown', (e) => {
      // Support keyboard flip with Enter or Space when focused on card
      if ((e.key === 'Enter' || e.key === ' ') && e.target === article) {
        e.preventDefault();
        toggleFlip();
      }
    });

    return article;
  }

  // ==========================================================================
  // Note Modal (Create & Edit)
  // ==========================================================================

  /**
   * Opens modal to create a new note or edit an existing note
   * @param {Object|null} noteToEdit
   */
  function openEditorModal(noteToEdit = null) {
    lastActiveElement = document.activeElement;
    setElementVisibility(formError, false);

    if (noteToEdit) {
      modalTitle.textContent = 'Edit Note';
      noteIdInput.value = noteToEdit.id;
      noteTitleInput.value = noteToEdit.title;
      noteContentInput.value = noteToEdit.content;
      noteCategoryInput.value = noteToEdit.category || '';
      setSelectedColour(noteToEdit.color);
    } else {
      modalTitle.textContent = 'New Note';
      noteIdInput.value = '';
      noteTitleInput.value = '';
      noteContentInput.value = '';
      noteCategoryInput.value = '';
      setSelectedColour(DEFAULT_COLOUR);
    }

    setElementVisibility(noteModal, true, 'flex');
    document.body.style.overflow = 'hidden';

    // Focus title field
    setTimeout(() => {
      noteTitleInput.focus();
    }, 50);
  }

  function closeEditorModal() {
    setElementVisibility(noteModal, false);
    document.body.style.overflow = '';
    setElementVisibility(formError, false);
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  function getSelectedColour() {
    const checked = noteForm.querySelector('input[name="note-colour"]:checked');
    return checked ? checked.value : DEFAULT_COLOUR;
  }

  function setSelectedColour(hex) {
    const radio = noteForm.querySelector(`input[name="note-colour"][value="${hex}"]`);
    if (radio) {
      radio.checked = true;
    } else {
      const defaultRadio = noteForm.querySelector(`input[name="note-colour"][value="${DEFAULT_COLOUR}"]`);
      if (defaultRadio) defaultRadio.checked = true;
    }
    updateModalPreviewColour(hex);
  }

  function updateModalPreviewColour(hex) {
    if (modalCardPreview) {
      modalCardPreview.style.backgroundColor = hex;
    }
  }

  /**
   * Handles Save (Create or Update)
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const color = getSelectedColour();
    const category = noteCategoryInput.value.trim();
    const id = noteIdInput.value;

    // Prevent saving notes with no meaningful content
    if (!title && !content) {
      setElementVisibility(formError, true, 'block');
      noteTitleInput.focus();
      return;
    }

    setElementVisibility(formError, false);
    const now = new Date().toISOString();

    if (id) {
      // Edit existing note
      const index = notes.findIndex(n => n.id === id);
      if (index !== -1) {
        notes[index] = {
          ...notes[index],
          title: title,
          content: content,
          color: color,
          category: category,
          updatedAt: now
        };
        persistNotesToStorage(notes);
        showToast('Note updated successfully!');
      }
    } else {
      // Create new note
      const newNote = {
        id: generateId(),
        title: title,
        content: content,
        color: color,
        category: category,
        createdAt: now,
        updatedAt: now
      };
      // Prepend so the newest note appears first
      notes.unshift(newNote);
      persistNotesToStorage(notes);
      showToast('Note created!');
    }

    closeEditorModal();
    renderNotes();
  }

  // ==========================================================================
  // Delete Modal
  // ==========================================================================

  function openDeleteModal(note) {
    lastActiveElement = document.activeElement;
    noteToDeleteId = note.id;
    deleteNoteTargetTitle.textContent = note.title.trim() ? `"${note.title}"` : 'this note';
    setElementVisibility(deleteModal, true, 'flex');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      deleteCancelBtn.focus();
    }, 50);
  }

  function closeDeleteModal() {
    setElementVisibility(deleteModal, false);
    document.body.style.overflow = '';
    noteToDeleteId = null;
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  function handleConfirmDelete() {
    if (!noteToDeleteId) return;

    notes = notes.filter(n => n.id !== noteToDeleteId);
    persistNotesToStorage(notes);
    showToast('Note deleted');
    closeDeleteModal();
    renderNotes();
  }

  // ==========================================================================
  // Theme Toggle (Light / Dark Mode)
  // ==========================================================================

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-checked', String(isDark));
      themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      themeToggleBtn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    if (themeToggleText) {
      themeToggleText.textContent = isDark ? 'Dark' : 'Light';
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
  }

  // ==========================================================================
  // Search Interaction
  // ==========================================================================

  function handleSearchInput(e) {
    searchQuery = e.target.value;
    setElementVisibility(searchClearBtn, Boolean(searchQuery), 'flex');
    renderNotes();
  }

  function handleClearSearch() {
    searchQuery = '';
    searchInput.value = '';
    setElementVisibility(searchClearBtn, false);
    searchInput.focus();
    renderNotes();
  }

  // ==========================================================================
  // Event Listeners Setup
  // ==========================================================================

  function initEventListeners() {
    // Search
    searchInput.addEventListener('input', handleSearchInput);
    searchClearBtn.addEventListener('click', handleClearSearch);
    resetSearchBtn.addEventListener('click', handleClearSearch);

    // Category filter
    if (categoryFilter) {
      categoryFilter.addEventListener('change', handleCategoryFilterChange);
    }

    // Create Note buttons
    createNoteBtn.addEventListener('click', () => openEditorModal(null));
    emptyCreateBtn.addEventListener('click', () => openEditorModal(null));

    // Theme toggle
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Form
    noteForm.addEventListener('submit', handleFormSubmit);
    modalCancelBtn.addEventListener('click', closeEditorModal);
    modalCloseBtn.addEventListener('click', closeEditorModal);

    // Colour selection change listener for modal background
    noteForm.querySelectorAll('input[name="note-colour"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        updateModalPreviewColour(e.target.value);
      });
    });

    // Delete modal
    deleteCancelBtn.addEventListener('click', closeDeleteModal);
    deleteCloseBtn.addEventListener('click', closeDeleteModal);
    deleteConfirmBtn.addEventListener('click', handleConfirmDelete);

    // Backdrop click handlers to dismiss modals
    noteModal.addEventListener('click', (e) => {
      if (e.target === noteModal) {
        closeEditorModal();
      }
    });

    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        closeDeleteModal();
      }
    });

    // Keyboard handlers (Escape closes modals)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!noteModal.hidden && !noteModal.classList.contains('is-hidden')) {
          closeEditorModal();
        } else if (!deleteModal.hidden && !deleteModal.classList.contains('is-hidden')) {
          closeDeleteModal();
        }
      }
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function init() {
    // Apply stored or system theme, then sync toggle UI
    const storedTheme = getStoredTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

    // Follow OS theme change only when the user hasn't set a manual preference
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!getStoredTheme()) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }

    notes = loadNotesFromStorage();
    initEventListeners();
    renderNotes();
  }

  // Start the application once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
