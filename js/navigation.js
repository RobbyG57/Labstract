// Export the initialization function
export function initializeNavigation() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const page = dot.getAttribute('data-page');
            // First remove all active states
            clearActiveDots();
            // Then set the new active dot
            dot.classList.add('active');
            window.location.hash = page === 'home' ? '' : page;
        });
    });
}

// Export this function so app.js can use it
export function updateNavDots(activePage) {
    clearActiveDots();
    const activePageDot = document.querySelector(`.dot[data-page="${activePage}"]`);
    if (activePageDot) {
        activePageDot.classList.add('active');
    }
}

function clearActiveDots() {
    document.querySelectorAll('.dot').forEach(dot => {
        dot.classList.remove('active');
    });
}

function initializeSwipeNavigation() {
    // Implementation of swipe navigation
}

// Initialize when module is loaded
document.addEventListener('DOMContentLoaded', initializeNavigation);