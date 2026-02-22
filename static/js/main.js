function onlyDigits(value) {
    return (value || "").replace(/[^\d]/g, "");
}

function formatWithSpaces(value) {
    const digits = onlyDigits(value);
    if (!digits) return "";
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseNumberFromInput(value) {
    if (!value) return 0;
    const normalized = value.replace(/\s+/g, "").replace(",", ".").replace(/[^\d.]/g, "");
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
}

function syncRangeWithText(rangeEl, textEl, factor) {
    if (!rangeEl || !textEl) return;
    const num = parseNumberFromInput(textEl.value);
    const scale = factor || 1;
    const val = Math.min(Math.max(num * scale, rangeEl.min ? Number(rangeEl.min) : 0), rangeEl.max ? Number(rangeEl.max) : num * scale);
    if (!isNaN(val)) {
        rangeEl.value = val;
    }
}

function updateDownPercentLabel(loanInput, downInput, labelEl) {
    if (!loanInput || !downInput || !labelEl) return;
    const loan = parseNumberFromInput(loanInput.value);
    const down = parseNumberFromInput(downInput.value);
    if (loan > 0 && down >= 0) {
        const p = Math.max(0, Math.min(100, (down / loan) * 100));
        labelEl.textContent = "(" + p.toFixed(1) + "% от суммы кредита)";
    } else {
        labelEl.textContent = "";
    }
}

function setupDownSliderRange(loanInput, downInput, downSlider, downPercentLabel) {
    if (!loanInput || !downSlider) return;
    const loan = parseNumberFromInput(loanInput.value);
    if (!loan || loan <= 0) return;

    let min = Math.round(loan * 0.15);
    let max = Math.round(loan * 0.7);
    if (min < 0) min = 0;
    if (max < min) max = min;

    downSlider.min = String(min);
    downSlider.max = String(max);

    let current = downInput ? parseNumberFromInput(downInput.value) : 0;
    if (!current || current < min || current > max) {
        current = Math.round(loan * 0.2);
        if (current < min) current = min;
        if (current > max) current = max;
    }

    downSlider.value = String(current);
    if (downInput) {
        downInput.value = formatWithSpaces(String(current));
    }
    updateDownPercentLabel(loanInput, downInput, downPercentLabel);
}

document.addEventListener("DOMContentLoaded", function () {
    const loanInput = document.getElementById("loan_amount_input");
    const loanSlider = document.getElementById("loan_amount_slider");
    const downInput = document.getElementById("down_payment_input");
    const downSlider = document.getElementById("down_payment_slider");
    const yearsInput = document.getElementById("years_input");
    const yearsSlider = document.getElementById("years_slider");
    const rateInput = document.getElementById("rate_input");
    const rateSlider = document.getElementById("rate_slider");
    const downPercentLabel = document.getElementById("down_percent_label");
    const installmentToggle = document.getElementById("installment_toggle");
    const rateLabelSuffix = document.getElementById("rate_label_suffix");

    if (loanInput && loanSlider) {
        syncRangeWithText(loanSlider, loanInput);
        setupDownSliderRange(loanInput, downInput, downSlider, downPercentLabel);

        loanInput.addEventListener("input", function () {
            const caretPos = loanInput.selectionStart;
            const rawBefore = loanInput.value;
            loanInput.value = formatWithSpaces(loanInput.value);
            syncRangeWithText(loanSlider, loanInput);
            setupDownSliderRange(loanInput, downInput, downSlider, downPercentLabel);
            updateDownPercentLabel(loanInput, downInput, downPercentLabel);
            if (caretPos !== null) {
                const diff = loanInput.value.length - rawBefore.length;
                loanInput.setSelectionRange(caretPos + diff, caretPos + diff);
            }
        });

        loanSlider.addEventListener("input", function () {
            const value = Number(loanSlider.value);
            loanInput.value = formatWithSpaces(String(value));
            setupDownSliderRange(loanInput, downInput, downSlider, downPercentLabel);
            updateDownPercentLabel(loanInput, downInput, downPercentLabel);
        });
    }

    if (downInput && downSlider) {
        setupDownSliderRange(loanInput, downInput, downSlider, downPercentLabel);

        downInput.addEventListener("input", function () {
            const caretPos = downInput.selectionStart;
            const rawBefore = downInput.value;
            downInput.value = formatWithSpaces(downInput.value);
            syncRangeWithText(downSlider, downInput);
            updateDownPercentLabel(loanInput, downInput, downPercentLabel);
            if (caretPos !== null) {
                const diff = downInput.value.length - rawBefore.length;
                downInput.setSelectionRange(caretPos + diff, caretPos + diff);
            }
        });

        downSlider.addEventListener("input", function () {
            const value = Number(downSlider.value);
            downInput.value = formatWithSpaces(String(value));
            updateDownPercentLabel(loanInput, downInput, downPercentLabel);
        });
    }

    if (yearsInput && yearsSlider) {
        yearsInput.addEventListener("input", function () {
            const num = parseInt(onlyDigits(yearsInput.value) || "0", 10);
            if (!isNaN(num)) {
                yearsSlider.value = String(
                    Math.min(Math.max(num, Number(yearsSlider.min) || 0), Number(yearsSlider.max) || num)
                );
            }
        });

        yearsSlider.addEventListener("input", function () {
            yearsInput.value = yearsSlider.value;
        });
    }

    if (rateInput && rateSlider) {
        rateInput.addEventListener("input", function () {
            const text = rateInput.value.replace(",", ".");
            const num = parseFloat(text);
            if (!isNaN(num)) {
                const clamped = Math.min(Math.max(num, Number(rateSlider.min) || num), Number(rateSlider.max) || num);
                rateSlider.value = String(clamped);
            }
        });

        rateSlider.addEventListener("input", function () {
            const value = Number(rateSlider.value);
            rateInput.value = value.toFixed(1).replace(".", ",");
        });
    }

    if (loanInput && downInput && downPercentLabel) {
        updateDownPercentLabel(loanInput, downInput, downPercentLabel);
    }

    if (installmentToggle) {
        const savedInstallment =
            window.localStorage && window.localStorage.getItem("mortgage-installment");
        if (savedInstallment === "1") {
            document.body.classList.add("installment-mode");
            installmentToggle.classList.add("pill-toggle-active");
            installmentToggle.setAttribute("aria-pressed", "true");
            if (rateInput) {
                rateInput.dataset.prevRate = rateInput.value;
                rateInput.value = "0";
            }
            if (rateSlider) {
                rateSlider.dataset.prevRate = rateSlider.value;
                rateSlider.value = "0";
            }
            if (rateLabelSuffix) {
                rateLabelSuffix.textContent = "0% годовых";
            }
        }

        installmentToggle.addEventListener("click", () => {
            const enabled = !document.body.classList.contains("installment-mode");
            document.body.classList.toggle("installment-mode", enabled);
            installmentToggle.classList.toggle("pill-toggle-active", enabled);
            installmentToggle.setAttribute("aria-pressed", enabled ? "true" : "false");

            if (enabled) {
                if (rateInput) {
                    rateInput.dataset.prevRate = rateInput.value;
                    rateInput.value = "0";
                }
                if (rateSlider) {
                    rateSlider.dataset.prevRate = rateSlider.value;
                    rateSlider.value = "0";
                }
                if (rateLabelSuffix) {
                    rateLabelSuffix.textContent = "0% годовых";
                }
            } else {
                if (rateInput && rateInput.dataset.prevRate !== undefined) {
                    rateInput.value = rateInput.dataset.prevRate;
                }
                if (rateSlider && rateSlider.dataset.prevRate !== undefined) {
                    rateSlider.value = rateSlider.dataset.prevRate;
                }
                if (rateLabelSuffix) {
                    rateLabelSuffix.textContent = "% годовых";
                }
            }

            if (window.localStorage) {
                window.localStorage.setItem("mortgage-installment", enabled ? "1" : "0");
            }
        });
    }

    const btnExportExcel = document.getElementById("btnExportExcel");
    if (btnExportExcel && typeof window.exportData !== "undefined") {
        btnExportExcel.addEventListener("click", function () {
            const data = window.exportData;
            if (!data || !Array.isArray(data.schedule_data)) {
                return;
            }
            btnExportExcel.disabled = true;
            fetch("/export_excel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
                .then(function (response) {
                    if (!response.ok) throw new Error("Export failed");
                    return response.blob();
                })
                .then(function (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "График_платежей_" + new Date().toISOString().slice(0, 10) + "_" + Date.now() + ".xlsx";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                })
                .catch(function () {
                    alert("Не удалось выгрузить файл. Попробуйте ещё раз.");
                })
                .finally(function () {
                    btnExportExcel.disabled = false;
                });
        });
    }

    if (typeof balanceLabels !== "undefined" && typeof balanceData !== "undefined") {
        const ctxBalance = document.getElementById("balanceChart");
        if (ctxBalance) {
            new Chart(ctxBalance, {
                type: "line",
                data: {
                    labels: balanceLabels,
                    datasets: [
                        {
                            label: "Остаток долга, ₽",
                            data: balanceData,
                            borderColor: "#9c2233",
                            backgroundColor: "rgba(156, 34, 51, 0.15)",
                            borderWidth: 3,
                            tension: 0.3,
                            fill: true,
                            pointRadius: 3,
                            pointHoverRadius: 6,
                            pointBackgroundColor: "#9c2233",
                            pointBorderColor: "#fff7e4",
                            pointBorderWidth: 2,
                            pointHoverBackgroundColor: "#5c101b",
                            pointHoverBorderColor: "#fff7e4",
                            pointHoverBorderWidth: 3,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: "top",
                            labels: {
                                font: { 
                                    family: "Marcellus, serif",
                                    size: 14,
                                    weight: "600"
                                },
                                color: "#5c2316",
                                padding: 15,
                                usePointStyle: true,
                            },
                        },
                        tooltip: {
                            backgroundColor: "rgba(255, 248, 234, 0.98)",
                            titleColor: "#5c2316",
                            bodyColor: "#7a3c2a",
                            borderColor: "#c59860",
                            borderWidth: 2,
                            padding: 12,
                            titleFont: {
                                family: "Playfair Display, serif",
                                size: 14,
                                weight: "700"
                            },
                            bodyFont: {
                                family: "Marcellus, serif",
                                size: 13
                            },
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || "";
                                    if (label) {
                                        label += ": ";
                                    }
                                    const value = context.parsed.y;
                                    const formatted = value.toLocaleString("ru-RU", {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).replace(/,/g, " ");
                                    label += formatted + " ₽";
                                    return label;
                                }
                            }
                        },
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: "Месяц",
                                font: {
                                    family: "Marcellus, serif",
                                    size: 13,
                                    weight: "600"
                                },
                                color: "#5c2316",
                                padding: { top: 10, bottom: 5 }
                            },
                            ticks: {
                                color: "#7a3c2a",
                                font: {
                                    family: "Marcellus, serif",
                                    size: 12
                                },
                                maxTicksLimit: 15,
                                stepSize: 1,
                            },
                            grid: {
                                color: "rgba(122, 60, 42, 0.25)",
                                lineWidth: 1,
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: "Остаток долга, ₽",
                                font: {
                                    family: "Marcellus, serif",
                                    size: 13,
                                    weight: "600"
                                },
                                color: "#5c2316",
                                padding: { top: 5, bottom: 10 }
                            },
                            ticks: {
                                color: "#7a3c2a",
                                font: {
                                    family: "Marcellus, serif",
                                    size: 12
                                },
                                callback: function(value) {
                                    return value.toLocaleString("ru-RU", {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).replace(/,/g, " ") + " ₽";
                                },
                            },
                            grid: {
                                color: "rgba(122, 60, 42, 0.25)",
                                lineWidth: 1,
                            },
                        },
                    },
                },
            });
        }
    }

    // Управление досрочными платежами
    const prepaymentEnabled = document.getElementById("prepayment_enabled");
    const prepaymentOptions = document.getElementById("prepayment_options");
    const prepaymentMonthInput = document.getElementById("prepayment_month");
    const prepaymentAmountInput = document.getElementById("prepayment_amount");
    const addPrepaymentBtn = document.getElementById("add_prepayment_btn");
    const prepaymentsList = document.getElementById("prepayments_list");
    const prepaymentsDataInput = document.getElementById("prepayments_data");

    let prepayments = [];

    // Функция для показа/скрытия опций досрочных платежей
    function togglePrepaymentOptions() {
        if (!prepaymentEnabled || !prepaymentOptions) return;
        
        const enabled = prepaymentEnabled.checked;
        prepaymentOptions.style.display = enabled ? "block" : "none";
        
        // Если отключаем досрочные платежи, очищаем список
        if (!enabled) {
            prepayments = [];
            renderPrepaymentsList();
            updatePrepaymentsData();
        }
    }

    // Инициализация состояния чекбокса
    if (prepaymentEnabled && prepaymentOptions) {
        // Проверяем, есть ли сохраненные досрочные платежи
        try {
            const savedData = prepaymentsDataInput ? prepaymentsDataInput.value : "[]";
            if (savedData && savedData !== "[]") {
                prepaymentEnabled.checked = true;
                prepayments = JSON.parse(savedData);
            }
        } catch (e) {
            prepayments = [];
        }
        
        togglePrepaymentOptions();
        
        // Обработчик изменения чекбокса
        prepaymentEnabled.addEventListener("change", togglePrepaymentOptions);
    }

    // Загружаем сохраненные досрочные платежи
    try {
        const savedData = prepaymentsDataInput ? prepaymentsDataInput.value : "[]";
        if (savedData && savedData !== "[]") {
            prepayments = JSON.parse(savedData);
            if (prepaymentsList) {
                renderPrepaymentsList();
            }
        }
    } catch (e) {
        prepayments = [];
    }

    // Форматирование суммы досрочного платежа
    if (prepaymentAmountInput) {
        prepaymentAmountInput.addEventListener("input", function () {
            const caretPos = prepaymentAmountInput.selectionStart;
            const rawBefore = prepaymentAmountInput.value;
            prepaymentAmountInput.value = formatWithSpaces(prepaymentAmountInput.value);
            if (caretPos !== null) {
                const diff = prepaymentAmountInput.value.length - rawBefore.length;
                prepaymentAmountInput.setSelectionRange(caretPos + diff, caretPos + diff);
            }
        });
    }

    // Добавление досрочного платежа
    function addPrepayment() {
        if (!prepaymentMonthInput || !prepaymentAmountInput) return;

        const month = parseInt(prepaymentMonthInput.value, 10);
        const amount = parseNumberFromInput(prepaymentAmountInput.value);

        if (!month || month < 1) {
            alert("Укажите месяц (от 1)");
            return;
        }

        if (!amount || amount <= 0) {
            alert("Укажите сумму досрочного платежа");
            return;
        }

        // Проверяем, нет ли уже платежа в этом месяце
        const existingIndex = prepayments.findIndex(p => p.month === month);
        if (existingIndex >= 0) {
            // Объединяем суммы
            prepayments[existingIndex].amount += amount;
        } else {
            prepayments.push({ month: month, amount: amount });
        }

        // Сортируем по месяцам
        prepayments.sort((a, b) => a.month - b.month);

        prepaymentMonthInput.value = "";
        prepaymentAmountInput.value = "";
        renderPrepaymentsList();
        updatePrepaymentsData();
    }

    // Удаление досрочного платежа
    function removePrepayment(index) {
        prepayments.splice(index, 1);
        renderPrepaymentsList();
        updatePrepaymentsData();
    }

    // Отображение списка досрочных платежей
    function renderPrepaymentsList() {
        if (!prepaymentsList) return;

        if (prepayments.length === 0) {
            prepaymentsList.innerHTML = "";
            return;
        }

        prepaymentsList.innerHTML = prepayments.map((prep, index) => {
            const formattedAmount = formatWithSpaces(String(Math.round(prep.amount)));
            return `
                <div class="prepayment-item">
                    <span class="prepayment-item-text">
                        Месяц ${prep.month}: ${formattedAmount} ₽
                    </span>
                    <button type="button" class="btn-remove-prepayment" data-index="${index}">×</button>
                </div>
            `;
        }).join("");

        // Добавляем обработчики для кнопок удаления
        prepaymentsList.querySelectorAll(".btn-remove-prepayment").forEach(btn => {
            btn.addEventListener("click", function () {
                const index = parseInt(this.getAttribute("data-index"), 10);
                removePrepayment(index);
            });
        });
    }

    // Обновление скрытого поля с данными
    function updatePrepaymentsData() {
        if (prepaymentsDataInput) {
            prepaymentsDataInput.value = JSON.stringify(prepayments);
        }
    }

    // Обработчик кнопки добавления
    if (addPrepaymentBtn) {
        addPrepaymentBtn.addEventListener("click", addPrepayment);
    }

    // Добавление по Enter
    if (prepaymentMonthInput) {
        prepaymentMonthInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                prepaymentAmountInput.focus();
            }
        });
    }

    if (prepaymentAmountInput) {
        prepaymentAmountInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                addPrepayment();
            }
        });
    }
});
