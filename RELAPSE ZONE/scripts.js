function submitFeelings() {
    const nameInput = document.getElementById('userName');
    const titleInput = document.getElementById('textTitle');
    const feelingsInput = document.getElementById('unsaidFeelings');

    const name = nameInput.value.trim();
    const title = titleInput.value.trim();
    const feelings = feelingsInput.value.trim();

    // Check if editing
    const editingIndex = submitFeelings.editingIndex;

    if (!title) {
        alert('Please enter a title for your text.');
        titleInput.focus();
        return;
    }
    if (!feelings) {
        alert('Please write something before submitting.');
        feelingsInput.focus();
        return;
    }

    let storedFeelings = JSON.parse(localStorage.getItem('feelingsList')) || [];
    const feelingObj = { name, title, feelings };

    if (typeof editingIndex === 'number' && editingIndex > -1) {
        // Edit mode
        storedFeelings[editingIndex] = feelingObj;
        submitFeelings.editingIndex = undefined;
        document.querySelector('.editing')?.classList.remove('editing');
    } else {
        // Add mode
        storedFeelings.unshift(feelingObj);
    }
    localStorage.setItem('feelingsList', JSON.stringify(storedFeelings));
    renderFeelingsList();

    alert('Your feelings have been submitted anonymously. Thank you for sharing.');
    feelingsInput.value = '';
    titleInput.value = '';
    // Optionally clear nameInput if you want: nameInput.value = '';
}

// Store last deleted feeling for undo
let lastDeletedFeeling = null;
let lastDeletedIndex = null;
let undoTimeout = null;

// Helper function to add a feeling to the DOM with delete and edit buttons
function addFeelingToDOM(entry, index) {
    const feelingsList = document.getElementById('feelingsList');
    const li = document.createElement('li');
    li.innerHTML = `<strong>${entry.title}</strong> <span style="color:#888;font-size:0.95em;">${entry.name ? 'by ' + entry.name : 'Anonymous'}</span><br>${entry.feelings}`;

    // Click to open notepad modal
    li.style.cursor = "pointer";
    li.onclick = function(e) {
        // Prevent click if edit/delete button is clicked
        if (e.target.tagName === "BUTTON") return;
        openNotepad(entry);
    };

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.style.cssText = 'float:right; background:#f67280; color:#fff; border:none; border-radius:4px; padding:0.3em 0.8em; margin-left:1em; font-size:0.9em; cursor:pointer;';
    delBtn.onclick = function (event) {
        event.stopPropagation();
        deleteFeeling(index);
    };
    li.appendChild(delBtn);

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.style.cssText = 'float:right; background:#355c7d; color:#fff; border:none; border-radius:4px; padding:0.3em 0.8em; margin-left:0.5em; font-size:0.9em; cursor:pointer;';
    editBtn.onclick = function (event) {
        event.stopPropagation();
        editFeeling(index, li);
    };
    li.appendChild(editBtn);

    feelingsList.appendChild(li);
}

// Notepad modal logic
function openNotepad(entry) {
    document.getElementById('notepadTitle').textContent = entry.title || '';
    document.getElementById('notepadMeta').textContent = entry.name ? `by ${entry.name}` : 'Anonymous';
    document.getElementById('notepadContent').textContent = entry.feelings || '';
    document.getElementById('notepadModal').style.display = 'flex';
}
function closeNotepad() {
    document.getElementById('notepadModal').style.display = 'none';
}

// Edit function
function editFeeling(index, li) {
    let storedFeelings = JSON.parse(localStorage.getItem('feelingsList')) || [];
    const entry = storedFeelings[index];
    document.getElementById('userName').value = entry.name || '';
    document.getElementById('textTitle').value = entry.title || '';
    document.getElementById('unsaidFeelings').value = entry.feelings || '';
    submitFeelings.editingIndex = index;

    // Highlight the editing item
    document.querySelectorAll('#feelingsList li').forEach(el => el.classList.remove('editing'));
    li.classList.add('editing');
}

// Delete function
function deleteFeeling(index) {
    if (!confirm('sure na jud?')) return;

    let storedFeelings = JSON.parse(localStorage.getItem('feelingsList')) || [];
    if (index > -1 && index < storedFeelings.length) {
        // Store for undo
        lastDeletedFeeling = storedFeelings[index];
        lastDeletedIndex = index;

        storedFeelings.splice(index, 1);
        localStorage.setItem('feelingsList', JSON.stringify(storedFeelings));
        renderFeelingsList();
        showUndo();
    }
}

function showUndo() {
    // Remove existing undo bar if present
    let existing = document.getElementById('undoBar');
    if (existing) existing.remove();

    const undoBar = document.createElement('div');
    undoBar.id = 'undoBar';
    undoBar.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#f67280;color:#fff;padding:1em 2em;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:1000;display:flex;align-items:center;gap:1em;';
    undoBar.innerHTML = 'Feeling deleted.';

    const undoBtn = document.createElement('button');
    undoBtn.textContent = 'Undo';
    undoBtn.style.cssText = 'background:#fff;color:#f67280;border:none;border-radius:4px;padding:0.3em 1em;font-weight:bold;cursor:pointer;';
    undoBtn.onclick = undoDelete;
    undoBar.appendChild(undoBtn);

    document.body.appendChild(undoBar);

    // Remove undo bar after 7 seconds
    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => {
        undoBar.remove();
        lastDeletedFeeling = null;
        lastDeletedIndex = null;
    }, 7000);
}

function undoDelete() {
    if (lastDeletedFeeling !== null && lastDeletedIndex !== null) {
        let storedFeelings = JSON.parse(localStorage.getItem('feelingsList')) || [];
        storedFeelings.splice(lastDeletedIndex, 0, lastDeletedFeeling);
        localStorage.setItem('feelingsList', JSON.stringify(storedFeelings));
        renderFeelingsList();
        // Remove undo bar
        document.getElementById('undoBar')?.remove();
        lastDeletedFeeling = null;
        lastDeletedIndex = null;
        if (undoTimeout) clearTimeout(undoTimeout);
    }
}

// Render all feelings with delete and edit buttons
function renderFeelingsList() {
    const feelingsList = document.getElementById('feelingsList');
    feelingsList.innerHTML = '';
    let storedFeelings = JSON.parse(localStorage.getItem('feelingsList')) || [];
    storedFeelings.forEach((entry, idx) => {
        addFeelingToDOM(entry, idx);
    });
}

// Load submitted feelings from localStorage on page load
window.addEventListener('DOMContentLoaded', () => {
    renderFeelingsList();
});

function clearFeelings() {
    const feelingsInput = document.getElementById('unsaidFeelings');
    const titleInput = document.getElementById('textTitle');
    if (feelingsInput.value.trim() === '' && titleInput.value.trim() === '') {
        alert('The text area and title are already empty.');
    } else {
        feelingsInput.value = '';
        titleInput.value = '';
        alert('The text area and title have been cleared.');
    }
}