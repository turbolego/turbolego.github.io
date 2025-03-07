// Constants for theme CSS paths
const darkCodeHighlight = "/css/dark.css";
const lightCodeHighlight = "/css/light.css";
const title = "Code highlight";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Get DOM elements
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;
    
    if (!themeToggle) {
        console.error("Theme toggle button not found!");
        return;
    }

    // Theme toggle handler
    const themeHandler = () => {
        if (localStorage.getItem("darkMode") === "1") {
            // Switch to light mode
            body.classList.remove("dark-theme");
            localStorage.setItem("darkMode", "0");
            
            // Update the stylesheet link
            const themeLink = document.getElementById("theme-link");
            if (themeLink) {
                themeLink.href = lightCodeHighlight;
            }
            
            // Update to moon emoji
            themeToggle.innerHTML = "🌑";
        } else {
            // Switch to dark mode
            body.classList.add("dark-theme");
            localStorage.setItem("darkMode", "1");
            
            // Update the stylesheet link
            const themeLink = document.getElementById("theme-link");
            if (themeLink) {
                themeLink.href = darkCodeHighlight;
            }
            
            // Update to sun emoji
            themeToggle.innerHTML = "☀️";
        }
    };

    // Theme state initialization handler
    const lightModePreference = window.matchMedia("(prefers-color-scheme: light)");

    // Initialize theme based on local storage or system preference
    const initTheme = () => {
        const darkMode = localStorage.getItem("darkMode");
        const themeLink = document.getElementById("theme-link");
        
        if (darkMode === "1") {
            // Dark mode is enabled
            body.classList.add("dark-theme");
            if (themeLink) {
                themeLink.href = darkCodeHighlight;
            }
            
            // Set sun emoji
            themeToggle.innerHTML = "☀️";
        } else if (darkMode === "0") {
            // Light mode is explicitly enabled
            body.classList.remove("dark-theme");
            if (themeLink) {
                themeLink.href = lightCodeHighlight;
            }
            
            // Set moon emoji
            themeToggle.innerHTML = "🌑";
        } else {
            // First time visitor, use system preference
            const isSystemDarkMode = !lightModePreference.matches;
            localStorage.setItem("darkMode", isSystemDarkMode ? "1" : "0");
            
            if (isSystemDarkMode) {
                body.classList.add("dark-theme");
                if (themeLink) {
                    themeLink.href = darkCodeHighlight;
                }
                
                // Set sun emoji
                themeToggle.innerHTML = "☀️";
            } else {
                if (themeLink) {
                    themeLink.href = lightCodeHighlight;
                }
                
                // Set moon emoji
                themeToggle.innerHTML = "🌑";
            }
        }
    };

    // Initialize theme
    initTheme();
    
    // Add click handler to the theme toggle button
    themeToggle.addEventListener("click", themeHandler);
    
    // Listen for system theme changes
    lightModePreference.addEventListener("change", e => {
        const shouldBeDark = !e.matches;
        if (!localStorage.getItem("darkMode")) {
            localStorage.setItem("darkMode", shouldBeDark ? "1" : "0");
            initTheme();
        }
    });
});
