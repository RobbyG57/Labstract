// State management
let currentUsers = []; // Will eventually be fetched from Firebase
let isEditing = false;

// Initialize the users page
export async function initializeUsersPage() {
    console.log('Initializing users page...');
    
    // Just load users and set up listeners, don't show any modals
    await loadUsers();
    setupEventListeners();
}

function setupEventListeners() {
    console.log('Initial edit state:', isEditing);
    
    // Add User button
    const addUserBtn = document.querySelector('.add-user');
    if (addUserBtn) {
        // Remove existing listeners
        const newAddBtn = addUserBtn.cloneNode(true);
        addUserBtn.parentNode.replaceChild(newAddBtn, addUserBtn);
        newAddBtn.addEventListener('click', () => {
            console.log('Add user clicked');
            showModal('add-user');
        });
    }

    // Edit Users button
    const editUsersBtn = document.querySelector('.edit-users');
    if (editUsersBtn) {
        const newEditBtn = editUsersBtn.cloneNode(true);
        editUsersBtn.parentNode.replaceChild(newEditBtn, editUsersBtn);
        newEditBtn.addEventListener('click', () => {
            isEditing = !isEditing;
            console.log('Edit button clicked - new state:', isEditing);
            toggleEditMode();
        });
    }

    // Login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        newLoginBtn.addEventListener('click', handleLogin);
    }

    // Re-attach user card listeners
    document.querySelectorAll('.user-card').forEach(card => {
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        newCard.addEventListener('click', () => {
            console.log('Card clicked - edit state is:', isEditing);
            const userId = card.dataset.userId;
            if (isEditing) {
                const user = currentUsers.find(u => u.id === userId);
                console.log('Should show EDIT modal for:', user);
                showModal('edit-user', user);
            } else {
                console.log('Should show DETAILS modal for:', userId);
                showUserDetails(userId);
            }
        });
    });
}

// Modal handling
function showModal(type, userData = null) {
    console.log('Showing modal:', type, userData);
    
    const modalHtml = `
        <div class="modal ${type}-modal">
            <div class="modal-content">
                ${type === 'edit-user' ? `
                    <div class="user-details-header">
                        <div class="user-avatar large">
                            <span>${userData.name.charAt(0)}</span>
                        </div>
                    </div>
                ` : '<h3>Add New User</h3>'}
                
                <form id="userForm">
                    <div class="form-group">
                        <label for="userName">Username</label>
                        <input type="text" 
                               id="userName" 
                               value="${userData ? userData.name : ''}"
                               autocomplete="username" 
                               required>
                    </div>
                    ${type === 'add-user' ? `
                        <div class="form-group">
                            <label for="userPassword">Password</label>
                            <input type="password" 
                                   id="userPassword" 
                                   autocomplete="new-password" 
                                   required>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label for="userRole">Role</label>
                        <select id="userRole" required>
                            <option value="admin" ${userData?.role === 'admin' ? 'selected' : ''}>Administrator</option>
                            <option value="operator" ${userData?.role === 'operator' ? 'selected' : ''}>Operator</option>
                            <option value="viewer" ${userData?.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Save Changes</button>
                    </div>
                    ${type === 'edit-user' ? `
                        <div class="delete-user-action">
                            <button type="button" class="delete-btn">
                                <img src="assets/delete-icon.svg" alt="Delete">
                                Delete User
                            </button>
                        </div>
                    ` : ''}
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('Modal added to DOM');
    
    setupModalListeners(type, userData?.id);
}

function setupModalListeners(type, userId = null) {
    console.log('Setting up modal listeners for:', type);
    const modal = document.querySelector(`.${type}-modal`);
    if (!modal) {
        console.error('Modal not found');
        return;
    }

    const form = modal.querySelector('#userForm');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const deleteBtn = modal.querySelector('.delete-btn');

    // Close modal function
    function closeModal() {
        modal.remove();
    }

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel clicked');
            closeModal();
        });
    }

    // Click outside modal (if we want to keep this functionality)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Delete button (only in edit mode)
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this user?')) {
                await deleteUser(userId);
                closeModal();
                await loadUsers();
            }
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            name: document.getElementById('userName').value,
            role: document.getElementById('userRole').value
        };

        if (type === 'add-user') {
            userData.password = document.getElementById('userPassword').value;
            await addUser(userData);
        } else {
            userData.id = userId;
            await updateUser(userData);
        }

        closeModal();
        await loadUsers();
    });
}

// User management functions
async function loadUsers() {
    console.log('Loading users...');
    currentUsers = [
        { id: '1', name: 'John Doe', role: 'admin' },
        { id: '2', name: 'Jane Smith', role: 'operator' }
    ];
    renderUsers();
}

function renderUsers() {
    console.log('Rendering users - current edit state:', isEditing);
    const usersList = document.querySelector('.users-list');
    usersList.innerHTML = currentUsers.map(user => `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-info">
                <div class="user-avatar">
                    <span>${user.name.charAt(0)}</span>
                </div>
                <div class="user-details">
                    <h3>${user.name}</h3>
                    <span class="user-role">${user.role}</span>
                </div>
            </div>
            <div class="edit-indicator">
                <img src="assets/edit-schedule.svg" alt="Edit Mode">
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', () => {
            console.log('Card clicked - edit state is:', isEditing);
            const userId = card.dataset.userId;
            if (isEditing) {
                const user = currentUsers.find(u => u.id === userId);
                console.log('Should show EDIT modal for:', user);
                showModal('edit-user', user);
            } else {
                console.log('Should show DETAILS modal for:', userId);
                showUserDetails(userId);
            }
        });
    });
}

function setupCardListeners() {
    console.log('Setting up card listeners');
    
    document.querySelectorAll('.user-card').forEach(card => {
        const editBtn = card.querySelector('.edit-action');
        const deleteBtn = card.querySelector('.delete-action');
        const userInfo = card.querySelector('.user-info');
        
        // Remove existing listeners
        const newUserInfo = userInfo.cloneNode(true);
        userInfo.parentNode.replaceChild(newUserInfo, userInfo);
        
        // Add click listener for user details
        function handleUserInfoClick(e) {
            if (!isEditing) {
                console.log('Showing user details');
                showUserDetails(card.dataset.userId);
            } else {
                console.log('Edit mode active, ignoring card click');
            }
        }
        
        // Add or remove click listener based on edit mode
        function updateClickListener() {
            if (!isEditing) {
                newUserInfo.addEventListener('click', handleUserInfoClick);
                newUserInfo.style.cursor = 'pointer';
            } else {
                newUserInfo.removeEventListener('click', handleUserInfoClick);
                newUserInfo.style.cursor = 'default';
            }
        }
        
        // Initial setup
        updateClickListener();
        
        // Edit button listener
        editBtn?.addEventListener('click', (e) => {
            console.log('Edit button clicked');
            const userId = card.dataset.userId;
            const user = currentUsers.find(u => u.id === userId);
            showModal('edit-user', user);
        });
        
        // Delete button listener
        deleteBtn?.addEventListener('click', (e) => {
            console.log('Delete button clicked');
            const userId = card.dataset.userId;
            if (confirm('Are you sure you want to delete this user?')) {
                deleteUser(userId);
            }
        });
    });
}

async function addUser(userData) {
    // Will be replaced with Firebase add
    console.log('Adding user:', userData);
    currentUsers.push({ id: Date.now().toString(), ...userData });
}

async function updateUser(userData) {
    // Will be replaced with Firebase update
    console.log('Updating user:', userData);
}

function showUserDetails(userId) {
    const user = currentUsers.find(u => u.id === userId);
    if (!user) return;

    const detailsHtml = `
        <div class="modal user-details-modal">
            <div class="modal-content">
                <div class="user-details-content">
                    <div class="user-avatar">
                        <span>${user.name.charAt(0)}</span>
                    </div>
                    <div>
                        <h3>${user.name}</h3>
                        <div class="user-role">${user.role}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', detailsHtml);
    
    const modal = document.querySelector('.modal');
    modal.addEventListener('click', () => modal.remove());
}

function handleLogin() {
    console.log('Login clicked');
    const loginBtn = document.querySelector('.login-btn');
    
    if (loginBtn.textContent === 'Login') {
        // Show login modal
        showLoginModal();
    } else {
        // Handle logout
        loginBtn.textContent = 'Login';
        // Later we'll add Firebase logout here
    }
}

function showLoginModal() {
    const modalHtml = `
        <div class="modal login-modal">
            <div class="modal-content">
                <div class="login-header">
                    <div class="company-avatar">
                        <span>LC</span>
                    </div>
                </div>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" 
                               id="username" 
                               required
                               autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" 
                               id="password" 
                               required
                               autocomplete="current-password">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Login</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setupLoginModalListeners();
}

function setupLoginModalListeners() {
    const modal = document.querySelector('.login-modal');
    const form = modal.querySelector('#loginForm');
    const cancelBtn = modal.querySelector('.cancel-btn');

    function closeModal() {
        modal.remove();
    }

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log('Login attempted with username:', username);
        // Mock successful login for now
        document.querySelector('.login-btn').textContent = 'Logout';
        closeModal();
        
        // Later we'll add Firebase authentication here
    });
}

function toggleEditMode() {
    console.log('Inside toggleEditMode - state is:', isEditing);
    document.querySelector('.users-list').classList.toggle('edit-mode');
    document.querySelector('.edit-users').classList.toggle('active');
} 