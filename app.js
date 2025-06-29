// Advanced To-Do List App JavaScript
// Features: Add, edit, delete, complete, search, filter, sort, bulk actions, localStorage, dark mode, pagination, export/import, progress, animations

// ====== State ======
let tasks = [];
let currentPage = 1;
const TASKS_PER_PAGE = 7;
let sortField = 'createdAt';
let sortDir = 'desc';
let selectedTasks = new Set();

// ====== DOM Elements ======
const taskForm = document.getElementById('task-form');
const taskTitle = document.getElementById('task-title');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const taskDueDate = document.getElementById('task-due-date');
const taskNotes = document.getElementById('task-notes');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const filterPriority = document.getElementById('filter-priority');
const filterStatus = document.getElementById('filter-status');
const bulkCompleteBtn = document.getElementById('bulk-complete');
const bulkDeleteBtn = document.getElementById('bulk-delete');
const exportBtn = document.getElementById('export-tasks');
const importBtn = document.getElementById('import-tasks-btn');
const importInput = document.getElementById('import-tasks');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const paginationControls = document.getElementById('pagination-controls');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// ====== Utility Functions ======
function saveTasks() {
    localStorage.setItem('todo_tasks', JSON.stringify(tasks));
}
function loadTasks() {
    tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]');
}
function updateCategoryOptions() {
    const cats = [...new Set(tasks.map(t => t.category).filter(Boolean))];
    filterCategory.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
}
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
}
function getFilteredSortedTasks() {
    let filtered = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchInput.value.toLowerCase());
        const matchesCat = !filterCategory.value || task.category === filterCategory.value;
        const matchesPriority = !filterPriority.value || task.priority === filterPriority.value;
        const matchesStatus = !filterStatus.value || (filterStatus.value === 'completed' ? task.completed : !task.completed);
        return matchesSearch && matchesCat && matchesPriority && matchesStatus;
    });
    filtered.sort((a, b) => {
        let vA = a[sortField], vB = b[sortField];
        if (sortField === 'dueDate' || sortField === 'createdAt') {
            vA = vA || '';
            vB = vB || '';
        }
        if (vA < vB) return sortDir === 'asc' ? -1 : 1;
        if (vA > vB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });
    return filtered;
}

// ====== Render Functions ======
function renderTasks() {
    updateCategoryOptions();
    const filtered = getFilteredSortedTasks();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / TASKS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    const pageTasks = filtered.slice(start, start + TASKS_PER_PAGE);
    taskList.innerHTML = '';
    pageTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${selectedTasks.has(task.id) ? 'checked' : ''}>
            <div class="task-content" data-id="${task.id}">
                <div class="task-title">${task.title}</div>
                <span class="task-category">${task.category || ''}</span>
                <span class="task-priority">${task.priority}</span>
                <span class="task-due-date">${formatDate(task.dueDate)}</span>
                <div class="task-notes">${task.notes || ''}</div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" data-id="${task.id}">Edit</button>
                <button class="delete-btn" data-id="${task.id}">Delete</button>
                <button class="complete-btn" data-id="${task.id}">${task.completed ? 'Uncomplete' : 'Complete'}</button>
            </div>
        `;
        taskList.appendChild(li);
    });
    renderPagination(totalPages);
    renderProgress();
}

function renderPagination(totalPages) {
    paginationControls.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === currentPage ? 'active' : '';
        btn.onclick = () => { currentPage = i; renderTasks(); };
        paginationControls.appendChild(btn);
    }
}

function renderProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    progressBar.style.width = percent + '%';
    progressText.textContent = `${completed} of ${total} tasks completed (${percent}%)`;
}

// ====== Event Listeners ======
taskForm.onsubmit = e => {
    e.preventDefault();
    const newTask = {
        id: Date.now().toString(),
        title: taskTitle.value,
        category: taskCategory.value,
        priority: taskPriority.value,
        dueDate: taskDueDate.value,
        notes: taskNotes.value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    saveTasks();
    taskForm.reset();
    renderTasks();
};

taskList.onclick = e => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('edit-btn')) {
        openEditModal(id);
    } else if (e.target.classList.contains('delete-btn')) {
        showConfirmDialog('Are you sure you want to delete this task?', () => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        });
    } else if (e.target.classList.contains('complete-btn')) {
        const t = tasks.find(t => t.id === id);
        t.completed = !t.completed;
        saveTasks();
        renderTasks();
    } else if (e.target.classList.contains('task-checkbox')) {
        if (e.target.checked) selectedTasks.add(id);
        else selectedTasks.delete(id);
    }
};

document.getElementById('edit-modal').onclick = e => {
    if (e.target.classList.contains('close-modal')) {
        closeEditModal();
    }
};

document.getElementById('edit-task-form').onsubmit = e => {
    e.preventDefault();
    const id = document.getElementById('edit-task-form').dataset.id;
    const t = tasks.find(t => t.id === id);
    t.title = document.getElementById('edit-task-title').value;
    t.category = document.getElementById('edit-task-category').value;
    t.priority = document.getElementById('edit-task-priority').value;
    t.dueDate = document.getElementById('edit-task-due-date').value;
    t.notes = document.getElementById('edit-task-notes').value;
    saveTasks();
    closeEditModal();
    renderTasks();
};

function openEditModal(id) {
    const t = tasks.find(t => t.id === id);
    document.getElementById('edit-task-title').value = t.title;
    document.getElementById('edit-task-category').value = t.category;
    document.getElementById('edit-task-priority').value = t.priority;
    document.getElementById('edit-task-due-date').value = t.dueDate;
    document.getElementById('edit-task-notes').value = t.notes;
    document.getElementById('edit-task-form').dataset.id = id;
    document.getElementById('edit-modal').style.display = 'flex';
}
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

searchInput.oninput = renderTasks;
filterCategory.onchange = renderTasks;
filterPriority.onchange = renderTasks;
filterStatus.onchange = renderTasks;

bulkCompleteBtn.onclick = () => {
    tasks.forEach(t => { if (selectedTasks.has(t.id)) t.completed = true; });
    saveTasks();
    renderTasks();
};
bulkDeleteBtn.onclick = () => {
    if (selectedTasks.size === 0) return;
    showConfirmDialog('Are you sure you want to delete the selected tasks?', () => {
        tasks = tasks.filter(t => !selectedTasks.has(t.id));
        selectedTasks.clear();
        saveTasks();
        renderTasks();
    });
};

// Export/Import
exportBtn.onclick = () => {
    const data = JSON.stringify(tasks);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    URL.revokeObjectURL(url);
};
importBtn.onclick = () => importInput.click();
importInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                tasks = imported;
                saveTasks();
                renderTasks();
            }
        } catch {}
    };
    reader.readAsText(file);
};

// Sorting (by clicking on headers)
document.querySelectorAll('th[id^="sort-"]').forEach(th => {
    th.onclick = () => {
        const field = th.id.replace('sort-', '');
        if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = field; sortDir = 'asc'; }
        renderTasks();
    };
});

// Dark mode
darkModeToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('todo_dark', document.body.classList.contains('dark-mode'));
};
if (localStorage.getItem('todo_dark') === 'true') {
    document.body.classList.add('dark-mode');
}

// Confirmation dialog logic
function showConfirmDialog(message, onConfirm) {
    const dialog = document.getElementById('confirm-dialog');
    document.getElementById('confirm-message').textContent = message;
    dialog.style.display = 'flex';
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
    function cleanup() {
        dialog.style.display = 'none';
        yesBtn.onclick = null;
        noBtn.onclick = null;
    }
    yesBtn.onclick = () => { cleanup(); onConfirm(); };
    noBtn.onclick = cleanup;
}

// Initial load
loadTasks();
renderTasks();
