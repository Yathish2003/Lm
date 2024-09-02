document.addEventListener('DOMContentLoaded', () => {
    const keyInput = document.getElementById('key-input');
    const matchingKeysDropdown = document.getElementById('matching-keys');
    const languageSelect = document.getElementById('language');
    const valueInput = document.getElementById('value-input');
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');

    keyInput.addEventListener('input', handleKeyInput);
    matchingKeysDropdown.addEventListener('change', handleKeySelection);
    languageSelect.addEventListener('change', fetchTranslation);

    function handleKeyInput() {
        const key = keyInput.value.trim();
        if (key.length >= 2) {
            fetch(`/api/translation/${languageSelect.value}`)
                .then(response => response.json())
                .then(data => {
                    const matchingKeys = Object.keys(data).filter(k => k.startsWith(key));
                    populateMatchingKeysDropdown(matchingKeys);
                })
                .catch(error => console.error('Error fetching matching keys:', error));
        } else {
            matchingKeysDropdown.style.display = 'none';
        }
    }

    function populateMatchingKeysDropdown(matchingKeys) {
        matchingKeysDropdown.innerHTML = '';
        if (matchingKeys.length > 0) {
            matchingKeys.forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                matchingKeysDropdown.appendChild(option);
            });
            matchingKeysDropdown.style.display = 'block';
        } else {
            matchingKeysDropdown.style.display = 'none';
        }
    }

    function handleKeySelection() {
        keyInput.value = matchingKeysDropdown.value;
        fetchTranslation();
        matchingKeysDropdown.style.display = 'none';
    }

    function fetchTranslation() {
        const key = keyInput.value.trim();
        const language = languageSelect.value;

        if (key) {
            fetch(`/api/translation/${language}/${key}`)
                .then(response => response.json())
                .then(data => {
                    valueInput.value = data.value || 'No translation found';
                    editBtn.style.display = 'inline';
                    saveBtn.style.display = 'none';
                })
                .catch(error => console.error('Error fetching translation:', error));
        } else {
            valueInput.value = '';
        }
    }

    editBtn.addEventListener('click', () => {
        valueInput.removeAttribute('readonly');
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline';
    });

    saveBtn.addEventListener('click', () => {
        const key = keyInput.value.trim();
        const language = languageSelect.value;
        const value = valueInput.value.trim();

        if (key && value) {
            fetch('/api/translation/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ language, key, value })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    valueInput.setAttribute('readonly', true);
                    editBtn.style.display = 'inline';
                    saveBtn.style.display = 'none';
                    alert('Translation saved successfully!');
                }
            })
            .catch(error => console.error('Error saving translation:', error));
        }
    });
});
