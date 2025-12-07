// public/app.js

const API_BASE = '/api/notes';

const noteForm = document.getElementById('note-form');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const categoryInput = document.getElementById('category');
const isPinnedInput = document.getElementById('isPinned');
const formErrors = document.getElementById('form-errors');
const notesContainer = document.getElementById('notes-container');

function clearForm() {
  titleInput.value = '';
  contentInput.value = '';
  categoryInput.value = '';
  isPinnedInput.checked = false;
}

function showFormErrors(messages) {
  if (!Array.isArray(messages)) {
    messages = [messages];
  }
  formErrors.innerHTML = messages.map((msg) => `<div>${msg}</div>`).join('');
}

function clearFormErrors() {
  formErrors.innerHTML = '';
}

// Simple client-side validation mirroring server rules
function validateForm() {
  const errors = [];

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const category = categoryInput.value.trim();

  if (!title) {
    errors.push('Title is required.');
  } else {
    if (title.length < 3) errors.push('Title must be at least 3 characters.');
    if (title.length > 100) errors.push('Title cannot be longer than 100 characters.');
  }

  if (!content) {
    errors.push('Content is required.');
  } else {
    if (content.length < 5) errors.push('Content must be at least 5 characters.');
  }

  if (category.length > 50) {
    errors.push('Category cannot be longer than 50 characters.');
  }

  return errors;
}

async function fetchNotes() {
  try {
    const res = await fetch(API_BASE);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch notes');
    }

    renderNotes(data.data);
  } catch (err) {
    console.error(err);
    notesContainer.innerHTML = '<p>Failed to load notes.</p>';
  }
}

function formatDate(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function renderNotes(notes) {
  if (!notes || notes.length === 0) {
    notesContainer.innerHTML = '<p>No notes yet. Add your first note above.</p>';
    return;
  }

  // pinned notes first
  const sorted = [...notes].sort((a, b) => {
    if (a.isPinned === b.isPinned) return new Date(b.updatedAt) - new Date(a.updatedAt);
    return a.isPinned ? -1 : 1;
  });

  notesContainer.innerHTML = sorted
    .map((note) => {
      return `
        <article class="note-card" data-id="${note._id}">
          <header class="note-header">
            <div>
              <div class="note-title">${escapeHtml(note.title)}</div>
              <div class="note-category">${escapeHtml(note.category || 'General')}</div>
            </div>
            <div>
              ${
                note.isPinned
                  ? '<span class="note-pinned-badge" aria-label="Pinned note">📌 Pinned</span>'
                  : ''
              }
            </div>
          </header>
          <div class="note-meta">
            Last updated: ${formatDate(note.updatedAt)}
          </div>
          <div class="note-content">
            ${escapeHtml(note.content)}
          </div>
          <div class="note-actions">
            <button type="button" data-action="edit">Edit</button>
            <button type="button" data-action="delete">Delete</button>
            <button type="button" data-action="toggle-pin">${
              note.isPinned ? 'Unpin' : 'Pin'
            }</button>
          </div>
        </article>
      `;
    })
    .join('');
}

// Simple helper to prevent HTML injection
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Handle form submit
noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors();

  const clientErrors = validateForm();
  if (clientErrors.length > 0) {
    showFormErrors(clientErrors);
    return;
  }

  const payload = {
    title: titleInput.value.trim(),
    content: contentInput.value.trim(),
    category: categoryInput.value.trim() || 'General',
    isPinned: isPinnedInput.checked,
  };

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      const messages =
        data.errors?.map((e) => e.message) ||
        [data.message || 'Failed to create note'];

      showFormErrors(messages);
      return;
    }

    clearForm();
    await fetchNotes();
  } catch (err) {
    console.error(err);
    showFormErrors('Something went wrong while saving the note.');
  }
});

// Handle note actions (edit/delete/pin) using event delegation
notesContainer.addEventListener('click', async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  const card = e.target.closest('.note-card');
  if (!card) return;
  const id = card.dataset.id;

  if (action === 'delete') {
    const confirmed = window.confirm('Delete this note?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to delete note');
        return;
      }
      await fetchNotes();
    } catch (err) {
      console.error(err);
      alert('Something went wrong while deleting.');
    }
  }

  if (action === 'edit') {
    const oldTitle = card.querySelector('.note-title').textContent;
    const oldContent = card.querySelector('.note-content').textContent;

    const newTitle = window.prompt('Edit title:', oldTitle);
    if (newTitle === null) return; // cancelled

    const newContent = window.prompt('Edit content:', oldContent);
    if (newContent === null) return; // cancelled

    // Very light client-side checks for edit
    if (newTitle.trim().length < 3 || newContent.trim().length < 5) {
      alert('Title or content too short.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to update note');
        return;
      }
      await fetchNotes();
    } catch (err) {
      console.error(err);
      alert('Something went wrong while updating.');
    }
  }

  if (action === 'toggle-pin') {
    // Toggle pinned state based on button text
    const currentlyPinned = e.target.textContent.toLowerCase().includes('unpin');
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentlyPinned }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to update pin status');
        return;
      }
      await fetchNotes();
    } catch (err) {
      console.error(err);
      alert('Something went wrong while updating pin status.');
    }
  }
});

// Initial load
fetchNotes();
