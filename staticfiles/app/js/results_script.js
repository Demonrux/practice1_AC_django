document.addEventListener('DOMContentLoaded', function() {
    const tableViewBtn = document.getElementById('tableVыiewBtn');
    const accordionViewBtn = document.getElementById('accordionViewBtn');
    const tableView = document.querySelector('.table-view');
    const accordionView = document.querySelector('.accordion');

    const dateSelectorToggle = document.getElementById('dateSelectorToggle');
    const dateSelectorDropdown = document.getElementById('dateSelectorDropdown');
    const selectAllDates = document.getElementById('selectAllDates');
    const dateCheckboxes = document.querySelectorAll('.date-option input[type="checkbox"]:not(#selectAllDates)');
    const selectedDatesContainer = document.getElementById('selectedDates');

    const tableRows = document.querySelectorAll('.table-view tbody tr');
    const accordionItems = document.querySelectorAll('.accordion-item.level-2');

    function setupViewSwitcher() {
        tableViewBtn.addEventListener('click', function() {
            if (tableViewBtn.classList.contains('active')) return;

            accordionViewBtn.classList.remove('active');
            accordionView.classList.remove('active');

            tableViewBtn.classList.add('active');
            tableView.classList.add('active');

            resetAccordionState();
        });

        accordionViewBtn.addEventListener('click', function() {
            if (accordionViewBtn.classList.contains('active')) return;

            tableViewBtn.classList.remove('active');
            tableView.classList.remove('active');

            accordionViewBtn.classList.add('active');
            accordionView.classList.add('active');

            setTimeout(initAccordion, 50);
            setTimeout(filterBySelectedDates, 50);
        });
    }

    function initAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', function() {
            const item = this.closest('.accordion-item');
            const content = this.nextElementSibling;
            const isActive = item.classList.contains('active');

            const siblings = Array.from(item.parentElement.children).filter(
                child => child !== item && child.classList.contains(item.classList[0])
            );

            siblings.forEach(sibling => {
                sibling.classList.remove('active');
                const siblingContent = sibling.querySelector('.accordion-content');
                if (siblingContent) {
                    siblingContent.style.maxHeight = '0';
                    siblingContent.style.opacity = '0';
                    siblingContent.style.visibility = 'hidden';
                }
                const siblingIcon = sibling.querySelector('.toggle-icon');
                if (siblingIcon) {
                    siblingIcon.style.transform = 'rotate(0deg)';
                }
            });

            if (!isActive) {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
                content.style.visibility = 'visible';
                this.querySelector('.toggle-icon').style.transform = 'rotate(180deg)';
            } else {
                item.classList.remove('active');
                content.style.maxHeight = '0';
                content.style.opacity = '0';
                content.style.visibility = 'hidden';
                this.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
                }
            });
        });
    }

    function resetAccordionState() {
        document.querySelectorAll('.accordion-item').forEach(item => {
            item.classList.remove('active');
            const content = item.querySelector('.accordion-content');
            if (content) {
                content.style.maxHeight = '0';
                content.style.opacity = '0';
                content.style.visibility = 'hidden';
            }
        });
    }

    function getSelectedDates() {
        return Array.from(dateCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    function filterBySelectedDates() {
    const selectedDates = getSelectedDates();
    const showAll = selectedDates.length === dateCheckboxes.length;
    const showNone = selectedDates.includes('none');

    if (tableView.classList.contains('active')) {
        tableRows.forEach(row => {
            const dateCell = row.querySelector('td:nth-child(2)');
            if (!dateCell) return;

            const dateText = dateCell.textContent.trim();
            const isNone = dateText === 'Без даты' || dateText === '';
            const shouldShow = showAll ||
                            (isNone && showNone) ||
                            (!isNone && selectedDates.some(d => dateText.includes(d)));

            row.style.display = shouldShow ? '' : 'none';
        });
    }

    if (accordionView.classList.contains('active')) {
        accordionItems.forEach(item => {
            const dateHeader = item.querySelector('.accordion-header');
            if (!dateHeader) return;

            const headerText = dateHeader.textContent;
            const isNone = headerText.includes('Без даты');
            const dateMatch = headerText.match(/Дата: (.+)/);
            const dateText = isNone ? 'none' : (dateMatch ? dateMatch[1].trim() : null);

            const shouldShow = showAll ||
                            (isNone && showNone) ||
                            (dateText && selectedDates.some(d => dateText.includes(d)));

            item.style.display = shouldShow ? '' : 'none';
        });
    }

    highlightVisibleItems();
    }

    function highlightVisibleItems() {
        const visibleItems = [
            ...document.querySelectorAll('.table-view tbody tr[style=""]'),
            ...document.querySelectorAll('.accordion-item.level-2[style=""]')
        ];

        visibleItems.forEach(item => {
            item.style.backgroundColor = 'rgba(76, 201, 240, 0.1)';
            setTimeout(() => {
                item.style.backgroundColor = '';
            }, 500);
        });
    }

    function updateSelectedDates() {
        selectedDatesContainer.innerHTML = '';
        const selectedDates = getSelectedDates();

        if (selectedDates.length === dateCheckboxes.length) {
            selectedDatesContainer.innerHTML = '<div class="selected-date">Все даты</div>';
        } else {
            selectedDates.forEach(date => {
                const dateElement = document.createElement('div');
                dateElement.className = 'selected-date';
                dateElement.innerHTML = `
                    ${date === 'none' ? 'Без даты' : date}
                    <i class="fas fa-times" data-date="${date}"></i>
                `;
                selectedDatesContainer.appendChild(dateElement);
            });
        }
    }

    selectAllDates.addEventListener('change', function() {
        dateCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateSelectedDates();
        filterBySelectedDates();
    });

    dateCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (!this.checked) {
                selectAllDates.checked = false;
            } else {
                const allChecked = Array.from(dateCheckboxes).every(cb => cb.checked);
                selectAllDates.checked = allChecked;
            }
            updateSelectedDates();
            filterBySelectedDates();
        });
    });

    selectedDatesContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('fa-times')) {
            const date = e.target.getAttribute('data-date');
            const checkbox = document.querySelector(`input[value="${date}"]`);
            if (checkbox) {
                checkbox.checked = false;
                selectAllDates.checked = false;
                updateSelectedDates();
                filterBySelectedDates();
            }
            e.stopPropagation();
        }
    });

    dateSelectorToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        dateSelectorDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function() {
        dateSelectorToggle.classList.remove('active');
        dateSelectorDropdown.classList.remove('active');
    });

    setupViewSwitcher();
    if (document.querySelector('.accordion').classList.contains('active')) {
        initAccordion();
    }
    updateSelectedDates();
});