document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tablesContainer');
    const searchInput = document.getElementById('searchInput');
    const checkboxes = document.querySelectorAll('.sku-selector input[type="checkbox"]');

    function getSelectedSkus() {
        return Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    function renderStatus(text) {
        if (!text) return '';
        const lower = text.toLowerCase();
        let className = 'status-text';
        if (lower === 'included') className = 'status-included';
        else if (lower === 'not included') className = 'status-not-included';
        else if (lower === 'n/a') className = 'status-na';
        return `<span class="status-tag ${className}">${text}</span>`;
    }

    function renderTables(data, term = '') {
        container.innerHTML = '';
        const selectedSkus = getSelectedSkus();
        
        if (selectedSkus.length === 0) {
            container.innerHTML = '<div class="no-results">Please select at least one edition to compare.</div>';
            return;
        }
        
        let hasResults = false;

        data.forEach(sectionGroup => {
            let features = sectionGroup.features;
            if (term) {
                features = features.filter(f => f.feature.toLowerCase().includes(term));
            }
            if (features.length === 0) return;
            
            hasResults = true;

            const sectionHtml = `
                <div class="section-container">
                    <h2 class="section-title">${sectionGroup.section}</h2>
                    <div class="table-scroll-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th class="feature-col">Feature</th>
                                    ${selectedSkus.map(sku => `<th>${sku}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${features.map((item, idx) => `
                                    <tr style="--row-idx: ${Math.min(idx, 20)}">
                                        <td>${item.feature}</td>
                                        ${selectedSkus.map(sku => `<td>${renderStatus(item[sku])}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', sectionHtml);
        });

        if (!hasResults) {
            container.innerHTML = '<div class="no-results">No features match your search criteria.</div>';
        }
    }

    // Initial render
    renderTables(featuresData);

    // Event listeners
    searchInput.addEventListener('input', (e) => {
        renderTables(featuresData, e.target.value.toLowerCase());
    });
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            renderTables(featuresData, searchInput.value.toLowerCase());
        });
    });
});
