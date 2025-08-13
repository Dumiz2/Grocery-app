/*
    Grocery App JavaScript
    Author: Dumisani Mthalane
    Portions of this code and logic are inspired by community examples and open source resources.
    If you use or adapt this code, please retain this notice.
    MIT License applies to all original and adapted code.
    Example citation: https://github.com/automatejs/automate/tree/6046a62c9768a1fd240ad8c071f201946c93fa15/docs/binding.md
*/

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    // Get references to UI elements
    let btnAdd = document.querySelector('button');
    let btnDelete = document.querySelector('#btnDelete');
    let tableSelect = document.querySelector('#tableSelect');
    let searchInput = document.querySelector('#search');
    let storeInput = document.querySelector('#store');
    let priceInput = document.querySelector('#price');

    // Load saved data from localStorage for each table on page load
    ['table1', 'table2', 'table3', 'table4'].forEach(function(tableId) {
        let table = document.querySelector(`#${tableId}`);
        let savedRows = JSON.parse(localStorage.getItem(tableId) || '[]');
        // Add each saved row to the table
        savedRows.forEach(function(row) {
            let template = `
                <tr>
                    <td>${row.product}</td>
                    <td>${row.store}</td>
                    <td>${row.price}</td>
                </tr>`;
            let tfoot = table.querySelector('tfoot');
            if (tfoot) {
                tfoot.insertAdjacentHTML('beforebegin', template);
            } else {
                table.innerHTML += template;
            }
        });
        updateTotal(tableId); // Update totals and highlights after loading
    });

    // Add button event: Add a new product row to the selected table
    btnAdd.addEventListener('click', function() {
        let product = searchInput.value.trim();
        let store = storeInput.value.trim();
        let price = priceInput.value.trim();
        // Validate input
        if (!product || !store || !price || isNaN(price)) {
            alert("Please enter valid product, store, and price.");
            return;
        }
        let selectedTableId = tableSelect.value;
        let table = document.querySelector(`#${selectedTableId}`);

        // Create new row HTML
        let template = `
            <tr>
                <td>${product}</td> 
                <td>${store}</td>
                <td>${price}</td>
            </tr>`;
        let tfoot = table.querySelector('tfoot');
        // Insert new row before the total row
        if (tfoot) {
            tfoot.insertAdjacentHTML('beforebegin', template);
        } else {
            table.innerHTML += template;
        }

        // Save new row to localStorage
        let savedRows = JSON.parse(localStorage.getItem(selectedTableId) || '[]');
        savedRows.push({ product, store, price });
        localStorage.setItem(selectedTableId, JSON.stringify(savedRows));
        updateTotal(selectedTableId); // Update totals and highlights
    });

    // Delete button event: Delete a row matching both product and store from the selected table
    btnDelete.addEventListener('click', function() {
        let selectedTableId = tableSelect.value;
        let productToDelete = searchInput.value.trim();
        let storeToDelete = storeInput.value.trim();
        if (!productToDelete || !storeToDelete) {
            alert("Please enter both the product name and store name to delete.");
            return;
        }
        let table = document.querySelector(`#${selectedTableId}`);
        let rows = table.querySelectorAll('tr');
        let tfoot = table.querySelector('tfoot');
        let deleted = false;

        // Find and remove the row with the matching product and store name
        for (let i = 1; i < rows.length; i++) { // skip header
            let row = rows[i];
            if (row.parentElement.tagName === 'TFOOT') continue;
            if (
                row.cells[0] && row.cells[1] &&
                row.cells[0].textContent.trim().toLowerCase() === productToDelete.toLowerCase() &&
                row.cells[1].textContent.trim().toLowerCase() === storeToDelete.toLowerCase()
            ) {
                row.remove();
                deleted = true;
                break;
            }
        }

        if (deleted) {
            // Remove from localStorage as well
            let savedRows = JSON.parse(localStorage.getItem(selectedTableId) || '[]');
            let newRows = savedRows.filter(row =>
                !(row.product.trim().toLowerCase() === productToDelete.toLowerCase() &&
                  row.store.trim().toLowerCase() === storeToDelete.toLowerCase())
            );
            localStorage.setItem(selectedTableId, JSON.stringify(newRows));
            updateTotal(selectedTableId);
        } else {
            alert("Product with that store not found in the selected table.");
        }
    });
});

// Clear All button event: Confirm and clear all records from all tables and localStorage
document.getElementById('btnClearAll').addEventListener('click', function() {
    if (confirm("Are you sure you want to clear all records? This cannot be undone.")) {
        // Clear localStorage and reset tables/totals for all stores
        ['table1', 'table2', 'table3', 'table4'].forEach(function(tableId) {
            localStorage.removeItem(tableId);
            let table = document.getElementById(tableId);
            // Remove all rows except header and tfoot
            let rows = Array.from(table.rows);
            rows.forEach((row, idx) => {
                if (row.querySelector('th') || row.parentElement.tagName === 'TFOOT') return;
                row.remove();
            });
            // Reset total display
            document.getElementById('total-' + tableId).textContent = "0.00";
        });
        // Clear summary displays
        document.getElementById('cheapest-store').textContent = "";
        document.getElementById('cheapest-basket').textContent = "";
    }
});

// Update the total for a table, highlight cheapest products, and show savings
function updateTotal(tableId) {
    let savedRows = JSON.parse(localStorage.getItem(tableId) || '[]');
    let total = savedRows.reduce((sum, row) => sum + parseFloat(row.price || 0), 0);
    document.getElementById('total-' + tableId).textContent = total.toFixed(2);
    compareStores();
    highlightCheapestProducts();
    calculateCheapestBasketAndSavings();
}

// Compare total prices for each store and display the cheapest store
function compareStores() {
    let storeTotals = [
        { name: 'Store 1', id: 'table1', total: parseFloat(document.getElementById('total-table1').textContent) },
        { name: 'Store 2', id: 'table2', total: parseFloat(document.getElementById('total-table2').textContent) },
        { name: 'Store 3', id: 'table3', total: parseFloat(document.getElementById('total-table3').textContent) },
        { name: 'Store 4', id: 'table4', total: parseFloat(document.getElementById('total-table4').textContent) }
    ];

    // Find the store with the lowest total
    let cheapest = storeTotals.reduce((min, store) => store.total < min.total ? store : min, storeTotals[0]);

    // Display the result
    document.getElementById('cheapest-store').textContent =
        `Cheapest store: ${cheapest.name} (Total: ${cheapest.total.toFixed(2)})`;
}

// Highlight the cheapest price for each product across all stores
function highlightCheapestProducts() {
    // Map to collect all product prices and their locations
    let productsMap = {};

    ['table1', 'table2', 'table3', 'table4'].forEach(function(tableId) {
        let table = document.querySelector(`#${tableId}`);
        // Remove previous highlights from price cells
        Array.from(table.rows).forEach((row, idx) => {
            // Skip header and tfoot rows
            if (row.querySelector('th') || row.parentElement.tagName === 'TFOOT') return;
            row.cells[2].style.backgroundColor = '';
        });

        // Collect product data for highlighting
        let savedRows = JSON.parse(localStorage.getItem(tableId) || '[]');
        savedRows.forEach((row, idx) => {
            if (!productsMap[row.product]) productsMap[row.product] = [];
            productsMap[row.product].push({
                price: parseFloat(row.price),
                tableId: tableId,
                rowIndex: idx + 1 // +1 because 0 is header
            });
        });
    });

    // Highlight the lowest price cell for each product
    Object.keys(productsMap).forEach(product => {
        let entries = productsMap[product];
        let minPrice = Math.min(...entries.map(e => e.price));
        entries.forEach(entry => {
            if (entry.price === minPrice) {
                let table = document.querySelector(`#${entry.tableId}`);
                let row = table.rows[entry.rowIndex];
                if (row && row.cells[2]) row.cells[2].style.backgroundColor = 'lightgreen';
            }
        });
    });
}

// Calculate the cheapest possible basket (sum of lowest prices for each product)
// and compare it to each store's total to show possible savings
function calculateCheapestBasketAndSavings() {
    // Gather all products and their prices from all stores
    let productsMap = {};
    ['table1', 'table2', 'table3', 'table4'].forEach(function(tableId) {
        let savedRows = JSON.parse(localStorage.getItem(tableId) || '[]');
        savedRows.forEach(row => {
            if (!productsMap[row.product]) productsMap[row.product] = [];
            productsMap[row.product].push(parseFloat(row.price));
        });
    });

    // Calculate the sum of the cheapest price for each product
    let cheapestBasketTotal = 0;
    Object.values(productsMap).forEach(prices => {
        let min = Math.min(...prices);
        if (!isNaN(min)) cheapestBasketTotal += min;
    });

    // Get each store's total
    let storeTotals = [
        { name: 'Store 1', id: 'table1', total: parseFloat(document.getElementById('total-table1').textContent) },
        { name: 'Store 2', id: 'table2', total: parseFloat(document.getElementById('total-table2').textContent) },
        { name: 'Store 3', id: 'table3', total: parseFloat(document.getElementById('total-table3').textContent) },
        { name: 'Store 4', id: 'table4', total: parseFloat(document.getElementById('total-table4').textContent) }
    ];

    // Build savings info for each store
    let savingsHtml = `<strong>Cheapest possible basket total: ${cheapestBasketTotal.toFixed(2)}</strong><br>`;
    storeTotals.forEach(store => {
        let diff = store.total - cheapestBasketTotal;
        if (diff > 0) {
            savingsHtml += `${store.name}: You can save <strong>${diff.toFixed(2)}</strong> by buying only the cheapest products.<br>`;
        } else if (diff === 0) {
            savingsHtml += `${store.name}: No savings, this store already has the cheapest basket.<br>`;
        } else {
            savingsHtml += `${store.name}: This store is cheaper than the calculated basket!<br>`;
        }
    });

    // Display savings info
    document.getElementById('cheapest-basket').innerHTML = savingsHtml;
}