document.addEventListener('DOMContentLoaded', function() {
    const searchTypeRadios = document.querySelectorAll('input[name="search_type"]');
    const searchInput = document.getElementById('search_query');
    const searchLabel = document.getElementById('search_label');

    searchTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'id') {
                searchInput.placeholder = "Введите числовой ID";
                searchLabel.textContent = "Введите ID";
            } else {
                searchInput.placeholder = "Введите ключевое слово (минимум 2 символа)";
                searchLabel.textContent = "Введите название";
            }
        });
    });

    const tableSelectorToggle = document.getElementById('tableSelectorToggle');
    const tableSelectorDropdown = document.getElementById('tableSelectorDropdown');
    const selectAllTables = document.getElementById('selectAllTables');
    const tableCheckboxes = document.querySelectorAll('.table-option input[type="checkbox"]:not(#selectAllTables)');
    const selectedTablesContainer = document.getElementById('selectedTables');

    function updateSelectedTables() {
        selectedTablesContainer.innerHTML = '';
        const selectedTables = Array.from(tableCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (selectedTables.length === tableCheckboxes.length) {
            selectedTablesContainer.innerHTML = '<div class="selected-table">Все таблицы</div>';
        } else {
            selectedTables.forEach(table => {
                const tableElement = document.createElement('div');
                tableElement.className = 'selected-table';
                tableElement.innerHTML = `
                    ${table}
                    <i class="fas fa-times" data-table="${table}"></i>
                `;
                selectedTablesContainer.appendChild(tableElement);
            });
        }
    }

    tableSelectorToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        tableSelectorDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!tableSelectorToggle.contains(e.target) && !tableSelectorDropdown.contains(e.target)) {
            tableSelectorToggle.classList.remove('active');
            tableSelectorDropdown.classList.remove('active');
        }
    });

    selectAllTables.addEventListener('change', function() {
        tableCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateSelectedTables();
    });

    tableCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (!this.checked) {
                selectAllTables.checked = false;
            } else {
                const allChecked = Array.from(tableCheckboxes).every(cb => cb.checked);
                selectAllTables.checked = allChecked;
            }
            updateSelectedTables();
        });
    });

    selectedTablesContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('fa-times')) {
            const tableName = e.target.getAttribute('data-table');
            const checkbox = document.querySelector(`input[value="${tableName}"]`);
            if (checkbox) {
                checkbox.checked = false;
                updateSelectedTables();
                selectAllTables.checked = false;
            }
        }
    });

    updateSelectedTables();
});