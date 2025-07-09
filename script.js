document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('workflowForm');
    // const loadingScreen = document.getElementById('loadingScreen'); // Will be removed or repurposed
    // const responseMessageContainer = document.getElementById('responseMessage'); // Removed
    // const createAnotherWorkflowBtn = document.getElementById('createAnotherWorkflowBtn'); // Removed from page bottom
    const toolsContainer = document.getElementById('toolsContainer');
    const toolOptions = document.querySelectorAll('.tool-option');

    // Enlarge Text Modal elements
    const enlargeTextModal = document.getElementById('enlargeTextModal');
    const modalTextarea = document.getElementById('modalTextarea');
    const modalDoneButton = document.getElementById('modalDoneButton');
    const modalTitle = document.getElementById('modalTitle');
    let currentEditingTextarea = null;

    // Success Modal elements
    const successModal = document.getElementById('successModal');
    const closeSuccessModalButton = successModal.querySelector('.close-button');
    const modalCreateAnotherWorkflowBtn = document.getElementById('modalCreateAnotherWorkflowBtn');
    const confettiCanvas = document.getElementById('confettiCanvas');

    // Confetti instance
    let confettiInstance = null;
    if (confetti && confettiCanvas) { // Check if confetti library is loaded
        confettiInstance = confetti.create(confettiCanvas, {
            resize: true,
            useWorker: false // Disabled worker to prevent 'transferControlToOffscreen' error
        });
    }

    function startConfetti() {
        if (!confettiInstance) return;

        // Ensure canvas is visible and sized correctly if it was display:none
        confettiCanvas.style.display = 'block';

        // Party popper effect (simple version)
        const popperColors = ['#00a58e', '#ffc107', '#dc3545', '#0dcaf0'];
        function firePopper(x, y, angle, particleRatio) {
            confettiInstance({
                particleCount: Math.floor(200 * particleRatio),
                spread: 70 + Math.random() * 20, // Wider spread for poppers
                origin: { x: x, y: y },
                angle: angle,
                colors: popperColors,
                scalar: 1 + Math.random() * 0.5, // Larger particles
                gravity: 0.8, // Less gravity to shoot "up" more
                decay: 0.92, // Fade faster
                startVelocity: 30 + Math.random() * 15,
                ticks: 100, // Shorter lifespan
                zIndex: 2050 // Ensure poppers are visually distinct if needed (confettiCanvas handles overall z-index)
            });
        }

        // Fire two poppers from bottom corners, angled upwards and inwards
        firePopper(0.1, 0.9, 60, 0.7); // Left popper
        firePopper(0.9, 0.9, 120, 0.7); // Right popper

        // Continuous falling confetti
        let duration = 15 * 1000; // 15 seconds
        let animationEnd = Date.now() + duration;
        let defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2050 }; // zIndex set on canvas element now

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        let interval = setInterval(function() {
            let timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            let particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confettiInstance(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confettiInstance(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }

    function stopConfetti() {
        if (confettiInstance) {
            confettiInstance.reset();
        }
        if(confettiCanvas) confettiCanvas.style.display = 'none'; // Hide canvas
    }


    // Input fields and their error message elements
    const fields = {
        purpose: {
            input: document.getElementById('purpose'),
            errorElement: document.getElementById('purposeError'),
            validations: [
                { type: 'required', message: "Purpose is required." }
            ]
        },
        trigger: {
            input: document.getElementById('trigger'),
            errorElement: document.getElementById('triggerError'),
            validations: [
                { type: 'required', message: "Trigger is required." }
            ]
        },
        expectedOutput: {
            input: document.getElementById('expectedOutput'),
            errorElement: document.getElementById('expectedOutputError'),
            validations: [
                { type: 'required', message: "Expected Output is required." }
            ]
        },
        workflow: {
            input: document.getElementById('workflow'),
            errorElement: document.getElementById('workflowError'),
            validations: [
                { type: 'required', message: "Workflow is required." }
            ]
        },
        email: {
            input: document.getElementById('email'),
            errorElement: document.getElementById('emailError'),
            validations: [
                { type: 'required', message: "Email is required." },
                { type: 'emailFormat', message: "Please enter a valid email address." },
                { type: 'domain', domain: "@kiwi.com", message: "Please use your kiwi.com email address." }
            ]
        }
        // Removed toolsErrorElement as "Tools" are no longer validated for being required.
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearAllErrors(); // This function will also need to be updated to clear new error states

        if (!validateForm()) {
            // Focus on the first invalid field will be handled in validateForm or a subsequent function
            return; // Stop if validation fails
        }

        // Show success modal immediately
        successModal.classList.add('active');
        startConfetti();

        // Prepare form data for webhook
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            // Tools are still collected, just not validated as required
            if (key !== 'tools') {
                data[key] = value;
            }
        });
        data.tools = []; // Ensure tools array exists
        toolOptions.forEach(option => {
            if (option.classList.contains('selected')) {
                data.tools.push(option.getAttribute('data-value'));
            }
        });

        const webhookUrl = 'https://kiwicom.app.n8n.cloud/webhook/f831c5d5-975e-4877-98e1-b50990c18194';

        // Send data to webhook in the background
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Log error or handle silently as per requirements (modal is already shown)
                console.error("Error submitting to webhook:", response.status, await response.text());
                // Optionally, you could update a non-critical part of the UI or send a silent log
            } else {
                console.log("Webhook submission successful");
            }
        } catch (error) {
            console.error("Network error submitting to webhook:", error);
            // Handle network error silently or log
        }
        // The form remains visible but overlaid by the modal
        // No need to hide form or show loading screen here.
    });

    function closeTheSuccessModal() {
        successModal.classList.remove('active');
        stopConfetti();
    }

    closeSuccessModalButton.addEventListener('click', closeTheSuccessModal);

    successModal.addEventListener('click', (event) => {
        if (event.target === successModal) { // Clicked on the overlay itself
            closeTheSuccessModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && successModal.classList.contains('active')) {
            closeTheSuccessModal();
        }
    });

    modalCreateAnotherWorkflowBtn.addEventListener('click', () => {
        closeTheSuccessModal();
        form.reset();
        clearAllErrors();
        toolOptions.forEach(option => option.classList.remove('selected'));
        // Form is already visible, no need to change its display style
    });


    // Event listener for tool selection
    if (toolsContainer) {
        toolsContainer.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('tool-option')) {
                target.classList.toggle('selected');
                // No error clearing for tools needed here as it's not a required field for validation.
            }
        });
    }

    function isValidEmailFormat(email) {
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validateForm() {
        let firstInvalidField = null;
        let formIsValid = true;

        for (const fieldName in fields) {
            const field = fields[fieldName];
            const value = field.input.value.trim();
            // Clear previous error styling
            field.input.classList.remove('input-error');
            field.errorElement.textContent = '';


            for (const validation of field.validations) {
                let currentFieldValid = true;
                if (validation.type === 'required') {
                    if (!value) {
                        showError(field, validation.message);
                        formIsValid = false;
                        currentFieldValid = false;
                        if (!firstInvalidField) firstInvalidField = field.input;
                    }
                } else if (validation.type === 'emailFormat') {
                    if (value && !isValidEmailFormat(value)) {
                        showError(field, validation.message);
                        formIsValid = false;
                        currentFieldValid = false;
                        if (!firstInvalidField) firstInvalidField = field.input;
                    }
                } else if (validation.type === 'domain') {
                    if (value && !value.endsWith(validation.domain)) {
                        // Only show domain error if email format is valid or no format error was shown for this field yet
                        if (isValidEmailFormat(value)) {
                             showError(field, validation.message);
                             formIsValid = false;
                             currentFieldValid = false;
                             if (!firstInvalidField) firstInvalidField = field.input;
                        } else if (!field.errorElement.textContent) {
                            // If format is bad, but no error shown yet (e.g. required passed), show format error instead of domain.
                            // This assumes 'required' and 'emailFormat' validations run before 'domain'.
                            const formatValidation = field.validations.find(v => v.type === 'emailFormat');
                            if (formatValidation) {
                                showError(field, formatValidation.message);
                                formIsValid = false;
                                currentFieldValid = false;
                                if (!firstInvalidField) firstInvalidField = field.input;
                            }
                        }
                    }
                }
                if (!currentFieldValid) break; // Stop further validation for this field if one rule failed
            }
        }

        if (firstInvalidField) {
            firstInvalidField.focus();
        }
        
        return formIsValid;
    }

    function showError(field, message) {
        if (field.errorElement) {
            field.errorElement.textContent = message;
        }
        field.input.classList.add('input-error'); // Add error class for styling
    }

    function clearAllErrors() {
        for (const fieldName in fields) {
            const field = fields[fieldName];
            if (field.errorElement) {
                field.errorElement.textContent = '';
            }
            field.input.classList.remove('input-error'); // Remove error class
        }
        // Removed clearing for fields.toolsErrorElement as it's no longer used for validation errors
    }

    // Function to initialize enlarge icons for textareas
    function initializeEnlargeIcons() {
        // Get the field definitions for textareas that need enlarge icons
        const textareasToEnlargeConfig = [
            { fieldRef: fields.purpose, labelText: "Purpose" },
            { fieldRef: fields.trigger, labelText: "Trigger" },
            { fieldRef: fields.expectedOutput, labelText: "Expected Output" },
            { fieldRef: fields.workflow, labelText: "Workflow" }
        ];

        textareasToEnlargeConfig.forEach(config => {
            const textarea = config.fieldRef.input;
            const wrapper = textarea.parentElement; // Should be .textarea-wrapper

            if (wrapper && wrapper.classList.contains('textarea-wrapper')) {
                const icon = document.createElement('span');
                icon.classList.add('enlarge-icon');
                icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 100%; height: 100%;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                  </svg>`;
                icon.title = 'Enlarge editor'; // Tooltip

                const svgElement = icon.querySelector('svg');
                if (svgElement) {
                    svgElement.setAttribute('focusable', 'false');
                }

                icon.addEventListener('click', () => {
                    currentEditingTextarea = textarea;
                    modalTextarea.value = textarea.value;
                    modalTitle.textContent = `Edit ${config.labelText}`; // Use labelText from config
                    enlargeTextModal.classList.add('active');
                    modalTextarea.focus();
                });
                wrapper.appendChild(icon);
            }
        });
    }

    // Event listener for modal "Done" button
    if (modalDoneButton) {
        modalDoneButton.addEventListener('click', () => {
            if (currentEditingTextarea) {
                currentEditingTextarea.value = modalTextarea.value;
                // Optionally, trigger an input event if other parts of the app react to it
                // currentEditingTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // enlargeTextModal.style.display = 'none'; // Old way
            enlargeTextModal.classList.remove('active'); // New way
            modalTextarea.value = ''; // Clear modal textarea
            currentEditingTextarea = null;
        });
    }

    // Optional: Close modal if user clicks on the overlay
    if (enlargeTextModal) {
        enlargeTextModal.addEventListener('click', (event) => {
            if (event.target === enlargeTextModal) { // Clicked on the overlay itself
                if (currentEditingTextarea) { // Save changes even when clicking outside
                    currentEditingTextarea.value = modalTextarea.value;
                }
                // enlargeTextModal.style.display = 'none'; // Old way
                enlargeTextModal.classList.remove('active'); // New way
                modalTextarea.value = '';
                currentEditingTextarea = null;
            }
        });
    }

    // Initialize features
    initializeEnlargeIcons();
});
