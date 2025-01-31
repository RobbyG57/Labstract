export function handleSnapshot() {
    const testTubeIcon = document.querySelector('.test-tube-icon');
    const mainCircle = document.querySelector('.main-circle');
    const snapshotButton = document.querySelector('.action-button.snapshot');
    const powerButton = document.querySelector('.action-button.power');
    const navDots = document.querySelectorAll('.nav-dots .dot');
    
    // Disable all navigation buttons and power button during snapshot
    const navigationButtons = document.querySelectorAll('.action-button:not(.snapshot)');
    navigationButtons.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    });

    // Disable nav dots during snapshot
    navDots.forEach(dot => {
        dot.style.opacity = '0.5';
        dot.style.cursor = 'not-allowed';
        dot.onclick = (e) => e.preventDefault();
    });

    snapshotButton.disabled = true;
    snapshotButton.style.opacity = '0.5';
    snapshotButton.style.cursor = 'not-allowed';
    
    testTubeIcon.src = 'assets/test-tube-testing.svg';
    mainCircle.classList.add('testing');
    
    setTimeout(() => {
        testTubeIcon.src = 'assets/test-tube.svg';
        mainCircle.classList.remove('testing');
        snapshotButton.disabled = false;
        snapshotButton.style.opacity = '1';
        snapshotButton.style.cursor = 'pointer';
        
        // Re-enable navigation buttons and power button
        navigationButtons.forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        });

        // Re-enable nav dots
        navDots.forEach(dot => {
            dot.style.opacity = '1';
            dot.style.cursor = 'pointer';
            dot.onclick = null;
        });
    }, 10000);
} 