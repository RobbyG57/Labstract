export function initializeSettings() {
    console.log('Initializing settings page...');
    
    // Wait for DOM to be ready
    setTimeout(() => {
        const settingsButtons = document.querySelectorAll('.settings-button');
        console.log('Found settings buttons:', settingsButtons.length);
        
        settingsButtons.forEach(button => {
            // Remove existing listeners first
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add new listener
            newButton.addEventListener('click', (e) => {
                // Get setting type from the button's classes
                const buttonClasses = Array.from(e.currentTarget.classList);
                const settingType = buttonClasses.find(cls => 
                    ['users', 'battery', 'reagents', 'camera', 'setup', 'support'].includes(cls)
                );
                
                console.log('Settings button clicked:', settingType);
                
                if (!settingType) {
                    console.error('No setting type found in classes:', buttonClasses);
                    return;
                }
                
                // Construct the correct path for sub-pages
                const pagePath = `settings/${settingType}`;
                console.log('Loading settings sub-page:', pagePath);
                window.loadPage(pagePath);
            });
        });
    }, 100);
}

function loadSettingPage(settingType) {
    // This will work with your existing page loading system in app.js
    window.location.hash = `#settings/${settingType}`;
} 