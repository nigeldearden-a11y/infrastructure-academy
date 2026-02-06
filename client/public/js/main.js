// ============================================
// INFRASTRUCTURE ACADEMY - MAIN JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initializeNavigation();
    
    // Initialize relay navigation if present
    initializeRelayNavigation();
});

/**
 * Initialize main navigation highlighting
 */
function initializeNavigation() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Check if current page matches link
        if (currentPage.includes(href) || 
            (currentPage === '/' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Initialize relay navigation buttons
 */
function initializeRelayNavigation() {
    const relayButtons = document.querySelectorAll('.relay-nav button');
    
    relayButtons.forEach(button => {
        button.addEventListener('click', function() {
            const relayId = this.getAttribute('data-relay');
            navigateToRelay(relayId);
        });
    });
}

/**
 * Navigate to a specific relay page
 */
function navigateToRelay(relayId) {
    const baseUrl = window.location.pathname.split('/').slice(0, -1).join('/');
    
    // Map relay IDs to page names
    const relayPages = {
        'ES': 'executive-summary',
        'P': 'prologue',
        '1': 'relay-01-fire',
        '2': 'relay-02-tree',
        '3': 'relay-03-river',
        '4': 'relay-04-horse',
        '5': 'relay-05-roads',
        '6': 'relay-06-ships',
        '7': 'relay-07-rail',
        '8': 'relay-08-loom',
        '9': 'relay-09-engine',
        '10': 'relay-10-aaa',
        '11': 'relay-11-humans',
        '12': 'relay-12-consciousness',
        'E': 'epilogue'
    };
    
    const pageName = relayPages[relayId];
    if (pageName) {
        window.location.href = `${baseUrl}/${pageName}.html`;
    }
}

/**
 * Smooth scroll to section
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Toggle content visibility
 */
function toggleContent(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.toggle('hidden');
        element.classList.toggle('visible');
    }
}

/**
 * Load content dynamically
 */
function loadContent(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center; color: var(--color-accent-gold);">Loading content...</p>';
    
    fetch(url)
        .then(response => response.text())
        .then(data => {
            container.innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading content:', error);
            container.innerHTML = '<p style="color: red;">Error loading content. Please try again.</p>';
        });
}

/**
 * Highlight active relay in relay navigation
 */
function setActiveRelay(relayId) {
    const relayButtons = document.querySelectorAll('.relay-nav button');
    
    relayButtons.forEach(button => {
        if (button.getAttribute('data-relay') === relayId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

/**
 * Utility: Get URL parameter
 */
function getUrlParameter(name) {
    const url = new URL(window.location);
    return url.searchParams.get(name);
}

/**
 * Utility: Format relay number
 */
function formatRelayNumber(num) {
    return String(num).padStart(2, '0');
}

// Export functions for use in other scripts
window.InfrastructureAcademy = {
    scrollToSection,
    toggleContent,
    loadContent,
    setActiveRelay,
    getUrlParameter,
    formatRelayNumber,
    navigateToRelay
};
