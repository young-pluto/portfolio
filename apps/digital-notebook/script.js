// Digital Notebook Application
// Using very unique node names to avoid conflicts with other projects

class DigitalNotebook {
    constructor() {
        // Very unique database node names to avoid conflicts
        this.dbRootNode = 'digital_notebook_2024_v1';
        this.topicsNode = 'digital_notebook_topics_2024_v1';
        this.subtopicsNode = 'digital_notebook_subtopics_2024_v1';
        
        this.currentTopicId = null;
        this.topics = {};
        this.subtopics = {};
        
        this.initializeEventListeners();
        this.loadData();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Add topic button
        document.getElementById('addTopicBtn').addEventListener('click', () => this.showTopicModal());
        document.getElementById('getStartedBtn').addEventListener('click', () => this.showTopicModal());
        
        // Add subtopic button
        document.getElementById('addSubtopicBtn').addEventListener('click', () => this.showSubtopicModal());
        
        // Edit and delete topic buttons
        document.getElementById('editTopicBtn').addEventListener('click', () => this.editCurrentTopic());
        document.getElementById('deleteTopicBtn').addEventListener('click', () => this.deleteCurrentTopic());
        
        // Modal event listeners
        this.setupModalEventListeners();
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Setup modal event listeners
    setupModalEventListeners() {
        // Topic modal
        const topicModal = document.getElementById('topicModal');
        const topicForm = document.getElementById('topicForm');
        
        // Close modal buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Topic form submission
        topicForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTopic();
        });
        
        // Subtopic modal
        const subtopicModal = document.getElementById('subtopicModal');
        const subtopicForm = document.getElementById('subtopicForm');
        
        // Subtopic form submission
        subtopicForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSubtopic();
        });
        
        // Delete modal
        const deleteModal = document.getElementById('deleteModal');
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());
        
        // Close modals when clicking outside
        [topicModal, subtopicModal, deleteModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
    }

    // Load data from Firebase
    async loadData() {
        try {
            this.showLoading(true);
            
            // Load topics
            const topicsRef = database.ref(`${this.dbRootNode}/${this.topicsNode}`);
            const topicsSnapshot = await topicsRef.once('value');
            this.topics = topicsSnapshot.val() || {};
            
            // Load subtopics
            const subtopicsRef = database.ref(`${this.dbRootNode}/${this.subtopicsNode}`);
            const subtopicsSnapshot = await subtopicsRef.once('value');
            this.subtopics = subtopicsSnapshot.val() || {};
            
            this.renderTopics();
            this.showLoading(false);
            
            // Set up real-time listeners
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showLoading(false);
            this.showError('Failed to load data. Please refresh the page.');
        }
    }

    // Setup real-time listeners for data changes
    setupRealtimeListeners() {
        // Listen for topic changes
        database.ref(`${this.dbRootNode}/${this.topicsNode}`).on('value', (snapshot) => {
            this.topics = snapshot.val() || {};
            this.renderTopics();
        });
        
        // Listen for subtopic changes
        database.ref(`${this.dbRootNode}/${this.subtopicsNode}`).on('value', (snapshot) => {
            this.subtopics = snapshot.val() || {};
            if (this.currentTopicId) {
                this.renderSubtopics(this.currentTopicId);
            }
        });
    }

    // Render topics in sidebar
    renderTopics() {
        const topicsList = document.getElementById('topicsList');
        topicsList.innerHTML = '';
        
        if (Object.keys(this.topics).length === 0) {
            topicsList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 1rem;">No topics yet</p>';
            return;
        }
        
        Object.entries(this.topics).forEach(([topicId, topic]) => {
            const topicElement = this.createTopicElement(topicId, topic);
            topicsList.appendChild(topicElement);
        });
    }

    // Create topic element
    createTopicElement(topicId, topic) {
        const topicDiv = document.createElement('div');
        topicDiv.className = 'topic-item';
        topicDiv.dataset.topicId = topicId;
        
        if (this.currentTopicId === topicId) {
            topicDiv.classList.add('active');
        }
        
        topicDiv.innerHTML = `
            <div class="topic-header">
                <div class="topic-title">${this.escapeHtml(topic.title)}</div>
                <div class="topic-actions">
                    <button class="btn-sm" onclick="event.stopPropagation(); notebook.editTopic('${topicId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm" onclick="event.stopPropagation(); notebook.deleteTopic('${topicId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        topicDiv.addEventListener('click', () => this.selectTopic(topicId));
        return topicDiv;
    }

    // Select a topic
    selectTopic(topicId) {
        this.currentTopicId = topicId;
        
        // Update active state in sidebar
        document.querySelectorAll('.topic-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-topic-id="${topicId}"]`).classList.add('active');
        
        // Show topic content
        this.showTopicContent(topicId);
    }

    // Show topic content
    showTopicContent(topicId) {
        const topic = this.topics[topicId];
        if (!topic) return;
        
        // Hide welcome screen and show topic content
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('topicContent').style.display = 'block';
        
        // Update topic title
        document.getElementById('currentTopicTitle').textContent = topic.title;
        
        // Render subtopics
        this.renderSubtopics(topicId);
    }

    // Render subtopics for a topic
    renderSubtopics(topicId) {
        const subtopicsList = document.getElementById('subtopicsList');
        subtopicsList.innerHTML = '';
        
        const topicSubtopics = Object.entries(this.subtopics)
            .filter(([_, subtopic]) => subtopic.topicId === topicId)
            .sort((a, b) => b[1].createdAt - a[1].createdAt);
        
        if (topicSubtopics.length === 0) {
            subtopicsList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">No subtopics yet. Add your first subtopic!</p>';
            return;
        }
        
        topicSubtopics.forEach(([subtopicId, subtopic]) => {
            const subtopicElement = this.createSubtopicElement(subtopicId, subtopic);
            subtopicsList.appendChild(subtopicElement);
        });
        
        // Highlight syntax for code blocks
        Prism.highlightAll();
    }

    // Create subtopic element
    createSubtopicElement(subtopicId, subtopic) {
        const subtopicDiv = document.createElement('div');
        subtopicDiv.className = 'subtopic-card';
        subtopicDiv.dataset.subtopicId = subtopicId;
        
        subtopicDiv.innerHTML = `
            <div class="subtopic-header">
                <div>
                    <div class="subtopic-title">${this.escapeHtml(subtopic.title)}</div>
                    ${subtopic.description ? `<div class="subtopic-description">${this.escapeHtml(subtopic.description)}</div>` : ''}
                </div>
                <div class="subtopic-actions">
                    <button class="btn btn-sm btn-secondary" onclick="notebook.editSubtopic('${subtopicId}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="notebook.deleteSubtopic('${subtopicId}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div class="subtopic-content">
                ${this.renderSubtopicContent(subtopic)}
            </div>
        `;
        
        return subtopicDiv;
    }

    // Render subtopic content
    renderSubtopicContent(subtopic) {
        let content = '';
        
        // Notes section
        if (subtopic.notes && subtopic.notes.trim()) {
            content += `
                <div class="content-section">
                    <h4><i class="fas fa-sticky-note"></i> Notes</h4>
                    <p>${this.escapeHtml(subtopic.notes).replace(/\n/g, '<br>')}</p>
                </div>
            `;
        }
        
        // Bullet points section
        if (subtopic.bulletPoints && subtopic.bulletPoints.length > 0) {
            content += `
                <div class="content-section">
                    <h4><i class="fas fa-list-ul"></i> Bullet Points</h4>
                    <ul class="bullet-points">
                        ${subtopic.bulletPoints.map(point => `<li>${this.escapeHtml(point)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Code section
        if (subtopic.code && subtopic.code.trim()) {
            content += `
                <div class="content-section">
                    <h4><i class="fas fa-code"></i> Code Snippet</h4>
                    <div class="code-block">
                        <div class="code-header">
                            <span>Code</span>
                            <span class="code-language">${subtopic.language || 'text'}</span>
                        </div>
                        <div class="code-content">
                            <pre><code class="language-${subtopic.language || 'text'}">${this.escapeHtml(subtopic.code)}</code></pre>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return content || '<p style="color: #6c757d; font-style: italic;">No content added yet.</p>';
    }

    // Show topic modal
    showTopicModal(topicId = null) {
        const modal = document.getElementById('topicModal');
        const title = document.getElementById('topicModalTitle');
        const form = document.getElementById('topicForm');
        const titleInput = document.getElementById('topicTitle');
        const descInput = document.getElementById('topicDescription');
        
        if (topicId) {
            // Edit mode
            const topic = this.topics[topicId];
            title.textContent = 'Edit Topic';
            titleInput.value = topic.title;
            descInput.value = topic.description || '';
            form.dataset.editId = topicId;
        } else {
            // Add mode
            title.textContent = 'Add New Topic';
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.style.display = 'block';
        titleInput.focus();
    }

    // Show subtopic modal
    showSubtopicModal(subtopicId = null) {
        if (!this.currentTopicId) {
            this.showError('Please select a topic first.');
            return;
        }
        
        const modal = document.getElementById('subtopicModal');
        const title = document.getElementById('subtopicModalTitle');
        const form = document.getElementById('subtopicForm');
        
        if (subtopicId) {
            // Edit mode
            const subtopic = this.subtopics[subtopicId];
            title.textContent = 'Edit Subtopic';
            this.populateSubtopicForm(subtopic);
            form.dataset.editId = subtopicId;
        } else {
            // Add mode
            title.textContent = 'Add New Subtopic';
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.style.display = 'block';
        document.getElementById('subtopicTitle').focus();
    }

    // Populate subtopic form
    populateSubtopicForm(subtopic) {
        document.getElementById('subtopicTitle').value = subtopic.title;
        document.getElementById('subtopicDescription').value = subtopic.description || '';
        document.getElementById('subtopicNotes').value = subtopic.notes || '';
        document.getElementById('subtopicBulletPoints').value = subtopic.bulletPoints ? subtopic.bulletPoints.join('\n') : '';
        document.getElementById('subtopicCode').value = subtopic.code || '';
        document.getElementById('codeLanguage').value = subtopic.language || 'javascript';
    }

    // Save topic
    async saveTopic() {
        try {
            this.showLoading(true);
            
            const form = document.getElementById('topicForm');
            const title = document.getElementById('topicTitle').value.trim();
            const description = document.getElementById('topicDescription').value.trim();
            const editId = form.dataset.editId;
            
            if (!title) {
                this.showError('Topic title is required.');
                return;
            }
            
            const topicData = {
                title,
                description,
                createdAt: editId ? this.topics[editId].createdAt : Date.now(),
                updatedAt: Date.now()
            };
            
            if (editId) {
                // Update existing topic
                await database.ref(`${this.dbRootNode}/${this.topicsNode}/${editId}`).update(topicData);
            } else {
                // Create new topic
                const newTopicRef = await database.ref(`${this.dbRootNode}/${this.topicsNode}`).push(topicData);
                const newTopicId = newTopicRef.key;
                
                // Select the new topic
                this.selectTopic(newTopicId);
            }
            
            this.closeAllModals();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error saving topic:', error);
            this.showLoading(false);
            this.showError('Failed to save topic. Please try again.');
        }
    }

    // Save subtopic
    async saveSubtopic() {
        try {
            this.showLoading(true);
            
            const form = document.getElementById('subtopicForm');
            const title = document.getElementById('subtopicTitle').value.trim();
            const description = document.getElementById('subtopicDescription').value.trim();
            const notes = document.getElementById('subtopicNotes').value.trim();
            const bulletPointsText = document.getElementById('subtopicBulletPoints').value.trim();
            const code = document.getElementById('subtopicCode').value.trim();
            const language = document.getElementById('codeLanguage').value;
            const editId = form.dataset.editId;
            
            if (!title) {
                this.showError('Subtopic title is required.');
                return;
            }
            
            const bulletPoints = bulletPointsText ? bulletPointsText.split('\n').filter(point => point.trim()) : [];
            
            const subtopicData = {
                title,
                description,
                notes,
                bulletPoints,
                code,
                language,
                topicId: this.currentTopicId,
                createdAt: editId ? this.subtopics[editId].createdAt : Date.now(),
                updatedAt: Date.now()
            };
            
            if (editId) {
                // Update existing subtopic
                await database.ref(`${this.dbRootNode}/${this.subtopicsNode}/${editId}`).update(subtopicData);
            } else {
                // Create new subtopic
                await database.ref(`${this.dbRootNode}/${this.subtopicsNode}`).push(subtopicData);
            }
            
            this.closeAllModals();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error saving subtopic:', error);
            this.showLoading(false);
            this.showError('Failed to save subtopic. Please try again.');
        }
    }

    // Edit topic
    editTopic(topicId) {
        this.showTopicModal(topicId);
    }

    // Edit subtopic
    editSubtopic(subtopicId) {
        this.showSubtopicModal(subtopicId);
    }

    // Edit current topic
    editCurrentTopic() {
        if (this.currentTopicId) {
            this.editTopic(this.currentTopicId);
        }
    }

    // Delete topic
    deleteTopic(topicId) {
        const topic = this.topics[topicId];
        this.showDeleteModal(
            `Are you sure you want to delete "${topic.title}"? This will also delete all its subtopics.`,
            () => this.performDeleteTopic(topicId)
        );
    }

    // Delete subtopic
    deleteSubtopic(subtopicId) {
        const subtopic = this.subtopics[subtopicId];
        this.showDeleteModal(
            `Are you sure you want to delete "${subtopic.title}"?`,
            () => this.performDeleteSubtopic(subtopicId)
        );
    }

    // Delete current topic
    deleteCurrentTopic() {
        if (this.currentTopicId) {
            this.deleteTopic(this.currentTopicId);
        }
    }

    // Perform topic deletion
    async performDeleteTopic(topicId) {
        try {
            this.showLoading(true);
            
            // Delete all subtopics for this topic
            const topicSubtopics = Object.entries(this.subtopics)
                .filter(([_, subtopic]) => subtopic.topicId === topicId);
            
            for (const [subtopicId, _] of topicSubtopics) {
                await database.ref(`${this.dbRootNode}/${this.subtopicsNode}/${subtopicId}`).remove();
            }
            
            // Delete the topic
            await database.ref(`${this.dbRootNode}/${this.topicsNode}/${topicId}`).remove();
            
            // Clear current topic if it was deleted
            if (this.currentTopicId === topicId) {
                this.currentTopicId = null;
                this.showWelcomeScreen();
            }
            
            this.closeAllModals();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error deleting topic:', error);
            this.showLoading(false);
            this.showError('Failed to delete topic. Please try again.');
        }
    }

    // Perform subtopic deletion
    async performDeleteSubtopic(subtopicId) {
        try {
            this.showLoading(true);
            
            await database.ref(`${this.dbRootNode}/${this.subtopicsNode}/${subtopicId}`).remove();
            
            this.closeAllModals();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error deleting subtopic:', error);
            this.showLoading(false);
            this.showError('Failed to delete subtopic. Please try again.');
        }
    }

    // Show delete confirmation modal
    showDeleteModal(message, onConfirm) {
        const modal = document.getElementById('deleteModal');
        document.getElementById('deleteMessage').textContent = message;
        modal.style.display = 'block';
        
        // Store the confirmation callback
        modal.dataset.confirmCallback = onConfirm;
    }

    // Confirm delete action
    confirmDelete() {
        const modal = document.getElementById('deleteModal');
        const callback = modal.dataset.confirmCallback;
        if (callback) {
            callback();
        }
    }

    // Show welcome screen
    showWelcomeScreen() {
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('topicContent').style.display = 'none';
        
        // Clear active state in sidebar
        document.querySelectorAll('.topic-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    // Handle search
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            // Show all topics
            document.querySelectorAll('.topic-item').forEach(item => {
                item.style.display = 'block';
            });
            return;
        }
        
        // Search in topics and subtopics
        const matchingTopicIds = new Set();
        
        // Search in topics
        Object.entries(this.topics).forEach(([topicId, topic]) => {
            if (topic.title.toLowerCase().includes(searchTerm) ||
                (topic.description && topic.description.toLowerCase().includes(searchTerm))) {
                matchingTopicIds.add(topicId);
            }
        });
        
        // Search in subtopics
        Object.entries(this.subtopics).forEach(([_, subtopic]) => {
            if (subtopic.title.toLowerCase().includes(searchTerm) ||
                (subtopic.description && subtopic.description.toLowerCase().includes(searchTerm)) ||
                (subtopic.notes && subtopic.notes.toLowerCase().includes(searchTerm)) ||
                (subtopic.code && subtopic.code.toLowerCase().includes(searchTerm))) {
                matchingTopicIds.add(subtopic.topicId);
            }
        });
        
        // Show/hide topics based on search results
        document.querySelectorAll('.topic-item').forEach(item => {
            const topicId = item.dataset.topicId;
            if (matchingTopicIds.has(topicId)) {
                item.style.display = 'block';
                item.style.opacity = '1';
            } else {
                item.style.opacity = '0.3';
            }
        });
    }

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Show loading spinner
    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
    }

    // Show error message
    showError(message) {
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be initialized
    if (typeof firebase !== 'undefined' && firebase.database) {
        window.notebook = new DigitalNotebook();
    } else {
        // Wait a bit more for Firebase to load
        setTimeout(() => {
            if (typeof firebase !== 'undefined' && firebase.database) {
                window.notebook = new DigitalNotebook();
            } else {
                console.error('Firebase not loaded');
                document.body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;">Error: Firebase failed to load. Please refresh the page.</div>';
            }
        }, 1000);
    }
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style); 