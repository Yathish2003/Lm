document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language-select');

    
    const updatePageContent = (language) => {
        fetch(`/api/translation/${language}`)
            .then(response => response.json())
            .then(data => {
                document.querySelectorAll('[data-translate-key]').forEach(element => {
                    const key = element.getAttribute('data-translate-key');
                    if (data[key]) {
                        element.textContent = data[key];
                    }
                });
            })
            .catch(error => console.error('Error fetching translations:', error));
    };

   
    languageSelect.addEventListener('change', () => {
        const selectedLanguage = languageSelect.value;
        localStorage.setItem('language', selectedLanguage);
        updatePageContent(selectedLanguage);
    });

    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        languageSelect.value = savedLanguage;
        updatePageContent(savedLanguage);
    }
});
