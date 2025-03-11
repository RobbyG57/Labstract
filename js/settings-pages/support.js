import { dataService } from '../services/dataService.js';

export async function initSupportPage() {
    console.log('Initializing support page...');
    
    try {
        renderSupportPage();
        attachEventListeners();
    } catch (error) {
        console.error('Error initializing support page:', error);
    }
}

function renderSupportPage() {
    const mainContent = document.querySelector('#main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="support-content">
            <div class="support-section quick-help">
                <h2>Quick Help</h2>
                <div class="quick-help-grid">
                    <div class="help-card">
                        <div class="help-icon">
                            <img src="assets/guide-icon.svg" alt="User Guide">
                        </div>
                        <h3>User Guide</h3>
                        <p>Access comprehensive documentation and user guides</p>
                        <button class="help-btn">View Guides</button>
                    </div>
                    <div class="help-card">
                        <div class="help-icon">
                            <img src="assets/contact-support-icon.svg" alt="Contact Support">
                        </div>
                        <h3>Contact Support</h3>
                        <p>Get in touch with our technical support team</p>
                        <button class="help-btn">Contact Us</button>
                    </div>
                    <div class="help-card">
                        <div class="help-icon">
                            <img src="assets/video-tutorial-icon.svg" alt="Video Tutorials">
                        </div>
                        <h3>Video Tutorials</h3>
                        <p>Watch step-by-step tutorial videos</p>
                        <button class="help-btn">Watch Videos</button>
                    </div>
                    <div class="help-card">
                        <div class="help-icon">
                            <img src="assets/faq-icon.svg" alt="FAQs">
                        </div>
                        <h3>FAQs</h3>
                        <p>Find answers to common questions</p>
                        <button class="help-btn">View FAQs</button>
                    </div>
                </div>
            </div>

            <div class="support-section ticket-system">
                <h2>Submit Support Ticket</h2>
                <form class="ticket-form">
                    <div class="form-group">
                        <label for="issue-type">Issue Type</label>
                        <select id="issue-type">
                            <option value="">Select an issue type...</option>
                            <option value="technical">Technical Issue</option>
                            <option value="account">Account Access</option>
                            <option value="data">Data Questions</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="priority">Priority</label>
                        <select id="priority">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" rows="4" placeholder="Please describe your issue..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="attachment">Attachments</label>
                        <input type="file" id="attachment" multiple>
                    </div>
                    <button type="submit" class="submit-ticket-btn">Submit Ticket</button>
                </form>
            </div>

            <div class="support-section contact-info">
                <h2>Direct Contact</h2>
                <div class="contact-grid">
                    <div class="contact-item">
                        <div class="contact-icon">
                            <img src="assets/phone-support-icon.svg" alt="Phone Support">
                        </div>
                        <div class="contact-details">
                            <h3>Phone Support</h3>
                            <p>Monday - Friday: 9AM - 5PM EST</p>
                            <a href="tel:1-800-123-4567">1-800-123-4567</a>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">
                            <img src="assets/email-support-icon.svg" alt="Email Support">
                        </div>
                        <div class="contact-details">
                            <h3>Email Support</h3>
                            <p>24/7 Response within 24 hours</p>
                            <a href="mailto:support@labapp.com">support@labapp.com</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachEventListeners() {
    // Quick help buttons
    const helpBtns = document.querySelectorAll('.help-btn');
    helpBtns.forEach(btn => {
        btn.addEventListener('click', handleHelpAction);
    });

    // Ticket form submission
    const ticketForm = document.querySelector('.ticket-form');
    if (ticketForm) {
        ticketForm.addEventListener('submit', handleTicketSubmission);
    }
}

function handleHelpAction(e) {
    const action = e.target.parentElement.querySelector('h3').textContent;
    console.log('Help action clicked:', action);
    // TODO: Implement help actions
}

function handleTicketSubmission(e) {
    e.preventDefault();
    
    const formData = {
        issueType: document.querySelector('#issue-type').value,
        priority: document.querySelector('#priority').value,
        description: document.querySelector('#description').value,
        files: document.querySelector('#attachment').files
    };

    console.log('Submitting ticket:', formData);
    // TODO: Implement ticket submission
}

export function cleanupSupportPage() {
    console.log('Cleaning up support page');
    // Remove event listeners if needed
} 