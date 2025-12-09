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
  
  let errorHTML = '';
  for (let i = 0; i < messages.length; i++) {
    errorHTML += '<div>' + messages[i] + '</div>';
  }
  formErrors.innerHTML = errorHTML;
}

function clearFormErrors() {
  formErrors.innerHTML = '';
}

function validateForm() {
  const errors = [];
  
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const category = categoryInput.value.trim();
  
  if (title === '') {
    errors.push('Title is required.');
  } else {
    if (title.length < 3) {
      errors.push('Title must be at least 3 characters.');
    }
    if (title.length > 100) {
      errors.push('Title cannot be longer than 100 characters.');
    }
  }
  
  if (content === '') {
    errors.push('Content is required.');
  } else {
    if (content.length < 5) {
      errors.push('Content must be at least 5 characters.');
    }
  }
  
  if (category.length > 50) {
    errors.push('Category cannot be longer than 50 characters.');
  }
  
  return errors;
}

async function fetchNotes() {
  try {
    const response = await fetch('/api/notes');
    const data = await response.json();
    
    if (data.success) {
      renderNotes(data.data);
    } else {
      notesContainer.innerHTML = '<p>Failed to load notes.</p>';
    }
  } catch (error) {
    console.error('Error fetching notes:', error);
    notesContainer.innerHTML = '<p>Failed to load notes.</p>';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function renderNotes(notes) {
  if (!notes || notes.length === 0) {
    notesContainer.innerHTML = '<p>No notes yet. Add your first note above.</p>';
    return;
  }
  
  const sortedNotes = notes.sort(function (a, b) {
    if (a.isPinned === b.isPinned) {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }

    if (a.isPinned) {
      return -1;
    } else {
      return 1;
    }
  });

  
  let notesHTML = '';
  for (let i = 0; i < sortedNotes.length; i++) {
    const note = sortedNotes[i];
    
    let pinnedBadge = '';
    if (note.isPinned) {
      pinnedBadge = '<span class="note-pinned-badge">Pinned</span>';
    }
    
    notesHTML += `
      <article class="note-card" data-id="${note._id}">
        <header class="note-header">
          <div>
            <div class="note-title">${escapeHTML(note.title)}</div>
            <div class="note-category">${escapeHTML(note.category || 'General')}</div>
          </div>
          <div>
            ${pinnedBadge}
          </div>
        </header>
        <div class="note-meta">
          Last updated: ${formatDate(note.updatedAt)}
        </div>
        <div class="note-content">
          ${escapeHTML(note.content)}
        </div>
        <div class="note-actions">
          <button type="button" data-action="edit">Edit</button>
          <button type="button" data-action="delete">Delete</button>
          <button type="button" data-action="toggle-pin">${note.isPinned ? 'Unpin' : 'Pin'}</button>
        </div>
      </article>
    `;
  }
  
  notesContainer.innerHTML = notesHTML;
}

function escapeHTML(text) {
  if (!text) return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  let result = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (map[char]) {
      result += map[char];
    } else {
      result += char;
    }
  }

  return result;
}


function showEditModal(noteId, currentTitle, currentContent, currentCategory) {
  const modal = document.createElement('div');
  modal.id = 'edit-modal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
  
  modal.innerHTML = `
    <div style="background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px;">
      <h3 style="margin-top: 0;">Edit Note</h3>
      <form id="edit-form">
        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem;">Title</label>
          <input type="text" id="edit-title" value="${escapeHTML(currentTitle)}" 
                 style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
        </div>
        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem;">Content</label>
          <textarea id="edit-content" rows="4" 
                    style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; resize: vertical;">${escapeHTML(currentContent)}</textarea>
        </div>
        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem;">Category</label>
          <input type="text" id="edit-category" value="${escapeHTML(currentCategory)}" 
                 style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button type="submit" style="flex: 1; padding: 0.75rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Save</button>
          <button type="button" id="cancel-edit" style="flex: 1; padding: 0.75rem; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Cancel</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const editForm = document.getElementById('edit-form');
  const cancelButton = document.getElementById('cancel-edit');
  
  editForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const newTitle = document.getElementById('edit-title').value.trim();
    const newContent = document.getElementById('edit-content').value.trim();
    const newCategory = document.getElementById('edit-category').value.trim();
    
    if (newTitle.length < 3) {
      alert('Title must be at least 3 characters.');
      return;
    }
    
    if (newContent.length < 5) {
      alert('Content must be at least 5 characters.');
      return;
    }
    
    try {
      const response = await fetch('/api/notes/' + noteId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory || 'General'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        modal.remove();
        fetchNotes();
      } else {
        alert(data.message || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Something went wrong while updating.');
    }
  });
  
  cancelButton.addEventListener('click', function() {
    modal.remove();
  });
  
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.remove();
    }
  });
}

noteForm.addEventListener('submit', async function(event) {
  event.preventDefault();
  clearFormErrors();
  
  const errors = validateForm();
  if (errors.length > 0) {
    showFormErrors(errors);
    return;
  }
  
  const noteData = {
    title: titleInput.value.trim(),
    content: contentInput.value.trim(),
    category: categoryInput.value.trim() || 'General',
    isPinned: isPinnedInput.checked
  };
  
  try {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(noteData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      clearForm();
      fetchNotes();
    } else {
      const errorMessages = [];
      if (data.errors) {
        for (let i = 0; i < data.errors.length; i++) {
          errorMessages.push(data.errors[i].message);
        }
      } else {
        errorMessages.push(data.message || 'Failed to create note');
      }
      showFormErrors(errorMessages);
    }
  } catch (error) {
    console.error('Error creating note:', error);
    showFormErrors('Something went wrong while saving the note.');
  }
});

notesContainer.addEventListener('click', async function(event) {
  const button = event.target;
  const action = button.dataset.action;
  
  if (!action) return;
  
  const noteCard = button.closest('.note-card');
  if (!noteCard) return;
  
  const noteId = noteCard.dataset.id;
  
  if (action === 'delete') {
    const confirmDelete = confirm('Are you sure you want to delete this note?');
    if (!confirmDelete) return;
    
    try {
      const response = await fetch('/api/notes/' + noteId, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchNotes();
      } else {
        alert(data.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Something went wrong while deleting.');
    }
  }
  
  if (action === 'edit') {
    const currentTitle = noteCard.querySelector('.note-title').textContent;
    const currentContent = noteCard.querySelector('.note-content').textContent;
    const currentCategory = noteCard.querySelector('.note-category').textContent;
    
    showEditModal(noteId, currentTitle, currentContent, currentCategory);
  }
  
  if (action === 'toggle-pin') {
    const buttonText = button.textContent.toLowerCase();
    const currentlyPinned = buttonText.includes('unpin');
    
    try {
      const response = await fetch('/api/notes/' + noteId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPinned: !currentlyPinned
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchNotes();
      } else {
        alert(data.message || 'Failed to update pin status');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Something went wrong while updating pin status.');
    }
  }
});

fetchNotes();