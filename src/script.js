document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('protein-form');
    const resultsTableBody = document.getElementById('results-body');
    const noResultsMessage = document.getElementById('no-results');

    const howToUseButton = document.getElementById('how-to-use-button');
    const modal = document.getElementById('how-to-use-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const gotItButton = document.getElementById('got-it-button');
    const brandLink = document.getElementById('brand-link');

    const dailyProteinGoalInput = document.getElementById('daily-protein-goal');
    const exportCsvButton = document.getElementById('export-csv-button');

    // Elementos Modal Calculadora de Proteína Diária
    const calculateDailyProteinButton = document.getElementById('calculate-daily-protein-button');
    const dailyProteinModal = document.getElementById('daily-protein-modal');
    const closeDailyProteinModalButton = document.getElementById('close-daily-protein-modal-button');
    const closeDailyProteinModalButtonAlt = document.getElementById('close-daily-protein-modal-button-alt');
    const userWeightInputDP = document.getElementById('user-weight-dp');
    const userHeightInputDP = document.getElementById('user-height-dp');
    const userAgeInputDP = document.getElementById('user-age-dp'); // Novo input de idade
    const userGenderSelectDP = document.getElementById('user-gender-dp');
    const activityLevelSelectDP = document.getElementById('activity-level-dp');
    const calculateNeedsButton = document.getElementById('calculate-needs-button');
    const proteinRecommendationDiv = document.getElementById('protein-recommendation');
    const tdeeAmountSpan = document.getElementById('tdee-amount');
    const recommendedProteinAmountSpan = document.getElementById('recommended-protein-amount');
    const applyToGoalButton = document.getElementById('apply-to-goal-button');
    let calculatedDailyProtein = 0;

    // Elementos Produtos Populares
    const popularProductsSelect = document.getElementById('popular-products');
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const totalWeightInput = document.getElementById('total-weight');
    const servingSizeInput = document.getElementById('serving-size');
    const proteinPerServingInput = document.getElementById('protein-per-serving');

    //elementos barcode
    const barcodeInput = document.getElementById('barcode-input');
    const fetchBarcodeDataButton = document.getElementById('fetch-barcode-data');
    const barcodeStatusMessage = document.getElementById('barcode-status');
    const copyTableButton = document.getElementById('copy-table-button');


    let products = []; // Array para armazenar os produtos adicionados pelo usuário
    const DAYS_IN_MONTH = 30;

    const popularProductsData = {
        frango: { name: "Peito de Frango (cru)", price: 25.00, totalWeight: 1000, servingSize: 100, proteinPerServing: 22 },
        ovo: { name: "Ovo de Galinha (unidade)", price: 1.00, totalWeight: 50, servingSize: 50, proteinPerServing: 6 },
        whey_growth: { name: "Whey Protein Concentrado (Growth 1kg)", price: 120.00, totalWeight: 1000, servingSize: 30, proteinPerServing: 23 },
        albumina: { name: "Albumina (500g)", price: 50.00, totalWeight: 500, servingSize: 30, proteinPerServing: 24 },
        leite_integral: { name: "Leite Integral (1L)", price: 5.00, totalWeight: 1000, servingSize: 200, proteinPerServing: 6 },
        atum_agua: { name: "Atum em Conserva (água, 120g drenado)", price: 7.00, totalWeight: 120, servingSize: 60, proteinPerServing: 15 },
        lentilha: { name: "Lentilha crua (100g)", price: 10.00, totalWeight: 500, servingSize: 100, proteinPerServing: 9 }
    };

    loadProductsFromLocalStorage();

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const productName = productNameInput.value.trim();
        const productPrice = parseFloat(productPriceInput.value);
        const totalWeight = parseFloat(totalWeightInput.value);
        const servingSize = parseFloat(servingSizeInput.value);
        const proteinPerServing = parseFloat(proteinPerServingInput.value);

        if (!productName || isNaN(productPrice) || productPrice <= 0 ||
            isNaN(totalWeight) || totalWeight <= 0 ||
            isNaN(servingSize) || servingSize <= 0 ||
            isNaN(proteinPerServing) || proteinPerServing < 0) {
            alert('Por favor, preencha todos os campos com valores válidos. Preço, peso e porção devem ser positivos. Proteína por porção pode ser zero.');
            return;
        }

        if (servingSize > totalWeight) {
            alert('O tamanho da porção não pode ser maior que o peso total do produto.');
            return;
        }

        let totalProteinInPackage = 0;
        if (servingSize > 0) {
            totalProteinInPackage = (proteinPerServing / servingSize) * totalWeight;
        }

        if (isNaN(totalProteinInPackage) || totalProteinInPackage < 0) {
             alert('A quantidade total de proteína calculada é inválida. Verifique os dados da porção.');
            return;
        }

        const pricePerGramProtein = totalProteinInPackage > 0 ? productPrice / totalProteinInPackage : Infinity;

        const productData = {
            name: productName,
            price: productPrice,
            weight: totalWeight,
            totalProtein: totalProteinInPackage,
            pricePerGramProtein: pricePerGramProtein,
            id: Date.now() // ID único para cada produto
        };

        products.push(productData);
        saveProductsToLocalStorage();
        renderTable();
        form.reset();
        popularProductsSelect.value = "";
        productNameInput.focus();
    });

// Função para buscar dados do produto por código de barras
    async function fetchProductByBarcode(barcode) { 
        if (!barcode || barcode.trim() === "") {
            barcodeStatusMessage.textContent = "Por favor, insira um código de barras.";
            barcodeStatusMessage.className = "text-xs text-red-400 mt-2";
            return;
        }
        barcodeStatusMessage.textContent = "Buscando produto...";
        barcodeStatusMessage.className = "text-xs text-blue-400 mt-2";

        try {
            // Usando a API v2 da Open Food Facts (mais recente e recomendada)
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (!response.ok) {
                throw new Error(`Produto não encontrado ou erro na API: ${response.status}`);
            }
            const data = await response.json();

            if (data.status === 1 && data.product) {
                const product = data.product;
                barcodeStatusMessage.textContent = `Produto encontrado: ${product.product_name || 'Nome não disponível'}`;
                barcodeStatusMessage.className = "text-xs text-green-400 mt-2";

                // Preenchendo o formulário
                productNameInput.value = product.product_name_pt || product.product_name || "";

                // Tentar obter preço (raramente disponível na Open Food Facts) - deixar para o usuário
                // productPriceInput.value = "";

                // Peso total do produto: product.quantity (ex: "500 g") ou product.packaging_weight
                // Precisamos extrair o número e a unidade.
                // OFF geralmente tem product.quantity (ex: "1 kg", "500g")
                // ou product.net_weight_value e product.net_weight_unit
                let totalWeight = "";
                if (product.quantity) {
                    const quantityMatch = product.quantity.match(/(\d+\.?\d*)\s*(kg|g|l|ml)/i);
                    if (quantityMatch) {
                        let value = parseFloat(quantityMatch[1]);
                        const unit = quantityMatch[2].toLowerCase();
                        if (unit === 'kg' || unit === 'l') value *= 1000;
                        totalWeight = value;
                    }
                } else if (product.net_weight_value && product.net_weight_unit) {
                     let value = parseFloat(product.net_weight_value);
                     const unit = product.net_weight_unit.toLowerCase();
                     if (unit === 'kg' || unit === 'l') value *= 1000;
                     totalWeight = value;
                }
                totalWeightInput.value = totalWeight || "";


                // Informações nutricionais (por 100g ou por porção)
                // A API Open Food Facts geralmente fornece nutriments por 100g (product.nutriments)
                // E às vezes product.serving_size e product.serving_quantity
                let servingSize = "";
                if (product.serving_size) { // Ex: "30 g", "1 scoop (30g)"
                    const servingMatch = product.serving_size.match(/(\d+\.?\d*)\s*(g|ml)/i);
                    if (servingMatch) {
                        servingSize = parseFloat(servingMatch[1]);
                    } else { // Se não conseguir parsear, mas tiver um valor numérico
                         const servingQuantityNum = parseFloat(product.serving_quantity);
                         if (!isNaN(servingQuantityNum) && servingQuantityNum > 0) {
                            servingSize = servingQuantityNum;
                         }
                    }
                }
                // Se não houver tamanho da porção explícito, mas houver dados por 100g, podemos usar 100g como porção padrão.
                if (!servingSize && product.nutriments && product.nutriments.proteins_100g !== undefined) {
                    servingSize = 100; // Default to 100g if serving size is not clear but 100g data exists
                }
                servingSizeInput.value = servingSize || "";


                let proteinPerServing = "";
                if (product.nutriments) {
                    if (product.nutriments.proteins_serving !== undefined && servingSize) { // Se tiver proteína por porção
                        proteinPerServing = parseFloat(product.nutriments.proteins_serving);
                    } else if (product.nutriments.proteins_100g !== undefined && servingSize === 100) { // Se a porção for 100g
                        proteinPerServing = parseFloat(product.nutriments.proteins_100g);
                    } else if (product.nutriments.proteins_100g !== undefined && servingSize && servingSize > 0) {
                        // Calcular proteína por porção se tivermos dados por 100g e uma porção diferente
                        proteinPerServing = (parseFloat(product.nutriments.proteins_100g) / 100) * servingSize;
                    }
                }
                proteinPerServingInput.value = !isNaN(proteinPerServing) ? proteinPerServing.toFixed(1) : "";

                // Focar no campo de preço para o usuário preencher
                productPriceInput.focus();
                alert("Produto parcialmente preenchido com dados da Open Food Facts. Por favor, VERIFIQUE TODOS OS CAMPOS, especialmente o PREÇO e o PESO TOTAL da embalagem que você está comprando, e ajuste se necessário.");


            } else {
                barcodeStatusMessage.textContent = `Produto com código ${barcode} não encontrado ou sem dados.`;
                barcodeStatusMessage.className = "text-xs text-amber-400 mt-2";
            }
        } catch (error) {
            console.error("Erro ao buscar produto:", error);
            barcodeStatusMessage.textContent = "Erro ao buscar dados. Verifique sua conexão ou o código de barras.";
            barcodeStatusMessage.className = "text-xs text-red-400 mt-2";
        }
    }

    if (fetchBarcodeDataButton && barcodeInput) {
        fetchBarcodeDataButton.addEventListener('click', () => {
            fetchProductByBarcode(barcodeInput.value.trim());
        });
        barcodeInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Evita submissão de formulário se estiver dentro de um
                fetchProductByBarcode(barcodeInput.value.trim());
            }
        });
    }

    // Função para copiar tabela como texto
    if (copyTableButton) {
        copyTableButton.addEventListener('click', () => {
            if (products.length === 0) {
                alert("Não há produtos na tabela para copiar.");
                return;
            }

            let tableText = "Comparativo de Produtos WheyghtPrice:\n\n";
            tableText += "Produto | Preço Total | Peso Total | Proteína Total | Preço/g Proteína\n";
            tableText += "-----------------------------------------------------------------------\n";

            products.forEach(product => {
                const unit = product.name.toLowerCase().includes("leite") || product.name.toLowerCase().includes("líquido") ? 'ml' : 'g';
                const pricePerGramProteinText = product.pricePerGramProtein === Infinity ? 'N/A' : `R$ ${product.pricePerGramProtein.toFixed(4)}`;
                tableText += `${product.name} | R$ ${product.price.toFixed(2)} | ${product.weight.toFixed(0)} ${unit} | ${product.totalProtein.toFixed(1)} g | ${pricePerGramProteinText}\n`;
            });

            const dailyGoal = parseFloat(dailyProteinGoalInput.value) || 0;
            if (dailyGoal > 0) {
                tableText += "\nCom Meta Diária: " + dailyGoal + "g\n";
                tableText += "Produto | Unidades/Mês | Custo Mensal (R$)\n";
                tableText += "---------------------------------------------\n";
                products.forEach(product => {
                    let unitsPerMonthText = '-';
                    let monthlyCostText = '-';
                     if (product.totalProtein > 0) {
                        const monthlyProteinNeeded = dailyGoal * DAYS_IN_MONTH;
                        const unitsNeededExact = monthlyProteinNeeded / product.totalProtein;
                        const unitsNeededPractical = Math.ceil(unitsNeededExact);
                        const totalMonthlyCost = unitsNeededPractical * product.price;
                        unitsPerMonthText = `${unitsNeededPractical.toFixed(0)} (${unitsNeededExact.toFixed(2)}) und.`;
                        monthlyCostText = `R$ ${totalMonthlyCost.toFixed(2)}`;
                    } else {
                        unitsPerMonthText = 'N/A (sem proteína)';
                        monthlyCostText = 'N/A';
                    }
                    tableText += `${product.name} | ${unitsPerMonthText} | ${monthlyCostText}\n`;
                });
            }


            navigator.clipboard.writeText(tableText)
                .then(() => {
                    alert("Tabela copiada para a área de transferência!");
                })
                .catch(err => {
                    console.error('Erro ao copiar tabela: ', err);
                    alert("Erro ao copiar tabela. Verifique as permissões do navegador ou copie manualmente.");
                });
        });
    }


    // Ajuste na função de compartilhamento para refletir que a tabela não é diretamente compartilhada na mensagem
    function getShareMessage() {
        let message = `Compare preços de proteínas e encontre o melhor custo-benefício com o WheyghtPrice! Acesse: ${siteUrl}`;
        if (products.length > 0) {
            const bestProduct = products[0]; // A lista já está ordenada
            if (bestProduct && bestProduct.pricePerGramProtein !== Infinity) {
                const formattedPrice = bestProduct.pricePerGramProtein.toFixed(4);
                message = `No WheyghtPrice, encontrei "${bestProduct.name}" por apenas R$ ${formattedPrice}/g de proteína! Compare seus produtos também: ${siteUrl}`;
            }
        }
        // Adiciona uma sugestão para usar a cópia da tabela ou CSV
        message += "\n\n(Para compartilhar sua tabela completa, use o botão 'Copiar Tabela' ou 'Exportar CSV' no site.)";
        return message;
    }

    function renderTable() {
        resultsTableBody.innerHTML = '';
        const dailyGoal = parseFloat(dailyProteinGoalInput.value) || 0;

        if (products.length === 0) {
            noResultsMessage.classList.remove('hidden');
            document.getElementById('results-table').parentElement.classList.add('hidden');
            exportCsvButton.classList.add('hidden');
            return;
        }

        noResultsMessage.classList.add('hidden');
        document.getElementById('results-table').parentElement.classList.remove('hidden');
        exportCsvButton.classList.remove('hidden');

        products.sort((a, b) => a.pricePerGramProtein - b.pricePerGramProtein); // Ordena pelo melhor custo-benefício

        products.forEach(product => {
            const row = resultsTableBody.insertRow();
            row.classList.add('hover:bg-gray-50', 'transition-colors', 'duration-150');
            const unit = product.name.toLowerCase().includes("leite") || product.name.toLowerCase().includes("líquido") ? 'ml' : 'g';

            row.insertCell().outerHTML = `<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-800">${product.name}</td>`;
            row.insertCell().outerHTML = `<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">R$ ${product.price.toFixed(2)}</td>`;
            row.insertCell().outerHTML = `<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">${product.weight.toFixed(0)} ${unit}</td>`;
            row.insertCell().outerHTML = `<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">${product.totalProtein.toFixed(1)} g</td>`;
            row.insertCell().outerHTML = `<td class="px-4 py-3 whitespace-nowrap text-sm font-semibold ${product.pricePerGramProtein === Infinity ? 'text-red-500' : 'text-green-700'}">
                                            ${product.pricePerGramProtein === Infinity ? 'N/A' : `R$ ${product.pricePerGramProtein.toFixed(4)}`}
                                         </td>`;

            let unitsPerMonthText = '-';
            let monthlyCostText = '-';

            if (dailyGoal > 0 && product.totalProtein > 0) {
                const monthlyProteinNeeded = dailyGoal * DAYS_IN_MONTH;
                const unitsNeededExact = monthlyProteinNeeded / product.totalProtein;
                const unitsNeededPractical = Math.ceil(unitsNeededExact);
                const totalMonthlyCost = unitsNeededPractical * product.price;

                unitsPerMonthText = `${unitsNeededPractical.toFixed(0)} (${unitsNeededExact.toFixed(2)}) und.`;
                monthlyCostText = `R$ ${totalMonthlyCost.toFixed(2)}`;
            } else if (dailyGoal > 0 && product.totalProtein <= 0) {
                unitsPerMonthText = 'N/A (sem proteína)';
                monthlyCostText = 'N/A';
            }

            row.insertCell().outerHTML = `<td class="px-4 py-3 whitespace-nowrap text-sm text-blue-600">${unitsPerMonthText}</td>`;
            row.insertCell().outerHTML = `<td class="px-4 py-3 whitespace-nowrap text-sm text-blue-700 font-medium">${monthlyCostText}</td>`;

            const actionsCell = row.insertCell();
            actionsCell.classList.add('px-4', 'py-3', 'whitespace-nowrap', 'text-sm', 'text-center');
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-red-500 hover:text-red-700">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>`;
            deleteButton.title = "Excluir produto";
            deleteButton.onclick = () => deleteProduct(product.id);
            actionsCell.appendChild(deleteButton);
        });
    }

    function deleteProduct(productId) {
        products = products.filter(product => product.id !== productId);
        saveProductsToLocalStorage();
        renderTable();
    }

    function saveProductsToLocalStorage() {
        localStorage.setItem('wheyghtPriceProducts', JSON.stringify(products));
    }

    function loadProductsFromLocalStorage() {
        const storedProducts = localStorage.getItem('wheyghtPriceProducts');
        if (storedProducts) {
            products = JSON.parse(storedProducts);
        }
        renderTable();
    }

    function openModal(modalElement) {
        modalElement.classList.remove('modal-hidden');
        modalElement.classList.add('modal-visible');
    }
    function closeModal(modalElement) {
        modalElement.classList.remove('modal-visible');
        modalElement.classList.add('modal-hidden');
    }

    if (howToUseButton && modal && closeModalButton && gotItButton) {
        howToUseButton.addEventListener('click', () => {
            openModal(modal);
            modal.querySelector('.bg-white').scrollTop = 0;
        });
        closeModalButton.addEventListener('click', () => closeModal(modal));
        gotItButton.addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (event) => { if (event.target === modal) { closeModal(modal); } });
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('modal-visible')) { closeModal(modal); } });
    }

    if (brandLink) {
        brandLink.addEventListener('click', (event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    if (dailyProteinGoalInput) {
        dailyProteinGoalInput.addEventListener('input', renderTable);
    }

    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', () => {
            // Código de exportar CSV (mantido)
            if (products.length === 0) {
                alert("Não há produtos para exportar.");
                return;
            }
            const dailyGoal = parseFloat(dailyProteinGoalInput.value) || 0;
            let csvContent = "data:text/csv;charset=utf-8,";
            const headers = [
                "Produto", "Preço Total (R$)", "Peso Total (g/ml)", "Proteína Total na Embalagem (g)",
                "Preço por Grama de Proteína (R$)", "Meta Diária Informada (g)",
                "Unidades Estimadas por Mês (para Meta)", "Custo Mensal Estimado (R$ para Meta)"
            ];
            csvContent += headers.join(",") + "\r\n";
            products.forEach(product => {
                let unitsPerMonthCsv = 'N/A';
                let monthlyCostCsv = 'N/A';
                const unitType = product.name.toLowerCase().includes("leite") || product.name.toLowerCase().includes("líquido") ? 'ml' : 'g';
                if (dailyGoal > 0 && product.totalProtein > 0) {
                    const monthlyProteinNeeded = dailyGoal * DAYS_IN_MONTH;
                    const unitsNeededExact = monthlyProteinNeeded / product.totalProtein;
                    const unitsNeededPractical = Math.ceil(unitsNeededExact);
                    const totalMonthlyCost = unitsNeededPractical * product.price;
                    unitsPerMonthCsv = `${unitsNeededPractical.toFixed(0)} (${unitsNeededExact.toFixed(2)})`;
                    monthlyCostCsv = totalMonthlyCost.toFixed(2);
                } else if (dailyGoal > 0 && product.totalProtein <= 0) {
                    unitsPerMonthCsv = 'N/A (sem proteína no produto)';
                }
                const row = [
                    `"${product.name.replace(/"/g, '""')}"`, product.price.toFixed(2),
                    `${product.weight.toFixed(0)} ${unitType}`, product.totalProtein.toFixed(1),
                    product.pricePerGramProtein === Infinity ? "N/A" : product.pricePerGramProtein.toFixed(4),
                    dailyGoal > 0 ? dailyGoal.toFixed(0) : "N/A",
                    unitsPerMonthCsv, monthlyCostCsv
                ];
                csvContent += row.join(",") + "\r\n";
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            const timestamp = new Date().toISOString().slice(0, 10);
            link.setAttribute("download", `wheyghtprice_comparativo_${timestamp}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // --- Lógica do Modal de Cálculo de Proteína Diária ---
    if (calculateDailyProteinButton && dailyProteinModal && closeDailyProteinModalButton && closeDailyProteinModalButtonAlt) {
        calculateDailyProteinButton.addEventListener('click', () => {
            proteinRecommendationDiv.classList.add('hidden');
            applyToGoalButton.disabled = true;
            userWeightInputDP.value = '';
            userHeightInputDP.value = '';
            userAgeInputDP.value = ''; // Limpa campo de idade
            userGenderSelectDP.value = 'male';
            activityLevelSelectDP.value = 'moderate';
            openModal(dailyProteinModal);
            dailyProteinModal.querySelector('.bg-white').scrollTop = 0;
            userWeightInputDP.focus();
        });

        const closeDailyProteinHandler = () => closeModal(dailyProteinModal);
        closeDailyProteinModalButton.addEventListener('click', closeDailyProteinHandler);
        closeDailyProteinModalButtonAlt.addEventListener('click', closeDailyProteinHandler);

        dailyProteinModal.addEventListener('click', (event) => {
            if (event.target === dailyProteinModal) { closeModal(dailyProteinModal); }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && dailyProteinModal.classList.contains('modal-visible')) {
                closeModal(dailyProteinModal);
            }
        });

        calculateNeedsButton.addEventListener('click', () => {
            const weight = parseFloat(userWeightInputDP.value);
            const height = parseFloat(userHeightInputDP.value);
            const age = parseInt(userAgeInputDP.value, 10); // Lê a idade
            const gender = userGenderSelectDP.value;
            const activity = activityLevelSelectDP.value;

            if (isNaN(weight) || weight <= 0 || isNaN(height) || height <= 0 || isNaN(age) || age < 10 || age > 100) {
                alert("Por favor, insira peso, altura e idade (entre 10 e 100 anos) válidos.");
                proteinRecommendationDiv.classList.add('hidden');
                applyToGoalButton.disabled = true;
                return;
            }

            let bmr;
            if (gender === 'male') {
                bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
            } else { // female
                bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
            }

            let tdeeActivityMultiplier;
            switch (activity) {
                case 'sedentary': tdeeActivityMultiplier = 1.2; break;
                case 'light': tdeeActivityMultiplier = 1.375; break;
                case 'moderate': tdeeActivityMultiplier = 1.55; break;
                case 'active': tdeeActivityMultiplier = 1.725; break;
                case 'extra_active': tdeeActivityMultiplier = 1.9; break;
                default: tdeeActivityMultiplier = 1.55;
            }
            const tdee = bmr * tdeeActivityMultiplier;
            tdeeAmountSpan.textContent = tdee.toFixed(0);

            let proteinFactorMin, proteinFactorMax;
            switch (activity) {
                case 'sedentary': proteinFactorMin = 0.8; proteinFactorMax = 1.2; break;
                case 'light': proteinFactorMin = 1.2; proteinFactorMax = 1.7; break;
                case 'moderate': proteinFactorMin = 1.5; proteinFactorMax = 2.0; break;
                case 'active': proteinFactorMin = 1.7; proteinFactorMax = 2.2; break;
                case 'extra_active': proteinFactorMin = 2.0; proteinFactorMax = 2.5; break;
                default: proteinFactorMin = 1.5; proteinFactorMax = 2.0;
            }

            const proteinMin = weight * proteinFactorMin;
            const proteinMax = weight * proteinFactorMax;
            calculatedDailyProtein = (proteinMin + proteinMax) / 2;

            recommendedProteinAmountSpan.textContent = `${proteinMin.toFixed(0)} - ${proteinMax.toFixed(0)}`;
            proteinRecommendationDiv.classList.remove('hidden');
            applyToGoalButton.disabled = false;
        });

        applyToGoalButton.addEventListener('click', () => {
            if (calculatedDailyProtein > 0) {
                dailyProteinGoalInput.value = calculatedDailyProtein.toFixed(0);
                renderTable();
                closeModal(dailyProteinModal);
            }
        });
    }

    if (popularProductsSelect) {
        popularProductsSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            if (selectedValue && popularProductsData[selectedValue]) {
                const product = popularProductsData[selectedValue];
                productNameInput.value = product.name;
                productPriceInput.value = product.price.toFixed(2);
                totalWeightInput.value = product.totalWeight;
                servingSizeInput.value = product.servingSize;
                proteinPerServingInput.value = product.proteinPerServing;
                productPriceInput.focus();
                productPriceInput.select();
            }
        });
    }

    // --- Lógica do Footer e Compartilhamento ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    const shareWhatsappButton = document.getElementById('share-whatsapp');
    const shareTwitterButton = document.getElementById('share-twitter');
    const shareFacebookButton = document.getElementById('share-facebook');
    const shareLinkedinButton = document.getElementById('share-linkedin');
    const shareEmailButton = document.getElementById('share-email');

    const siteUrl = window.location.href;
    const siteTitle = "WheyghtPrice - Calculadora de Custo-Benefício de Proteínas";

    function getShareMessage() {
        let message = `Confira o WheyghtPrice, uma calculadora de custo-benefício de proteínas! Ótima para economizar e bater suas metas: ${siteUrl}`;
        if (products.length > 0) {
            // Pega o primeiro produto da lista ordenada (o melhor custo-benefício)
            const bestProduct = products[0];
            if (bestProduct && bestProduct.pricePerGramProtein !== Infinity) {
                const formattedPrice = bestProduct.pricePerGramProtein.toFixed(4);
                message = `Comparei meus produtos no WheyghtPrice! O melhor foi "${bestProduct.name}" por R$ ${formattedPrice}/g de proteína. Experimente: ${siteUrl}`;
            }
        }
        return message;
    }


    if (shareWhatsappButton) {
        shareWhatsappButton.addEventListener('click', () => {
            const message = getShareMessage();
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
        });
    }

    if (shareTwitterButton) {
        shareTwitterButton.addEventListener('click', () => {
            const message = getShareMessage();
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
        });
    }

    if (shareFacebookButton) {
        shareFacebookButton.addEventListener('click', () => {
            // Facebook sharer.php prefere uma URL para compartilhar.
            // A quote pode ser usada, mas o foco é na URL.
            const message = getShareMessage(); // Usado para quote
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}&quote=${encodeURIComponent(message)}`, '_blank');
        });
    }

    if (shareLinkedinButton) {
        shareLinkedinButton.addEventListener('click', () => {
            const message = getShareMessage(); // Usado como summary
            window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(siteUrl)}&title=${encodeURIComponent(siteTitle)}&summary=${encodeURIComponent(message)}`, '_blank');
        });
    }

    if (shareEmailButton) {
        shareEmailButton.addEventListener('click', () => {
            const subject = `Confira o ${siteTitle}!`;
            const body = getShareMessage();
            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
    }

    renderTable(); // Chamada inicial
});