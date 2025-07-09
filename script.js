document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('workflowForm');
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

    // const confettiCanvas = document.getElementById('confettiCanvas'); // Commented out: Confetti removal
    // let confettiInstance = null; // Commented out: Confetti removal

    /* // Commented out: Confetti removal
    function startConfetti() {
        // ... confetti logic ...
    }
    */

    /* // Commented out: Confetti removal
    function stopConfetti() {
        // ... confetti logic ...
    }
    */

    // Input fields and their error message elements for VALIDATION

    const fields = {
        purpose: {
            input: document.getElementById('purpose'),
            errorElement: document.getElementById('purposeError'),
fix/form-validation-and-submit
            validations: [ { type: 'required', message: "Purpose is required." } ],

            label: "Purpose" // For enlarge modal title
        },
        trigger: {
            input: document.getElementById('trigger'),
            errorElement: document.getElementById('triggerError'),

            validations: [ { type: 'required', message: "Trigger is required." } ],
            label: "Trigger"

        },
        expectedOutput: {
            input: document.getElementById('expectedOutput'),
            errorElement: document.getElementById('expectedOutputError'),

            validations: [ { type: 'required', message: "Expected Output is required." } ],
            label: "Expected Output"

        },
        workflow: {
            input: document.getElementById('workflow'),
            errorElement: document.getElementById('workflowError'),

            validations: [ { type: 'required', message: "Workflow is required." } ],
            label: "Workflow"

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
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearAllErrors();


        const isValid = validateForm();


        if (!isValid) {
            return; // Stop if validation fails
        }

        // Show success modal immediately
        successModal.classList.add('active');

        // startConfetti(); // Commented out: Confetti removal


        // Prepare form data for webhook
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (key !== 'tools') { // Tools are still collected but not validated as required
                data[key] = value;
            }
        });
        data.tools = []; // Ensure tools array exists even if none selected
        toolOptions.forEach(option => {
            if (option.classList.contains('selected')) {
                data.tools.push(option.getAttribute('data-value'));
            }
        });

        const webhookUrl = 'https://kiwicom.app.n8n.cloud/webhook/f831c5d5-975e-4877-98e1-b50990c18194';

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                console.error("Error submitting to webhook:", response.status, await response.text());
            } else {
                console.log("Webhook submission successful");
            }
        } catch (error) {
            console.error("Network error submitting to webhook:", error);
        }
    });

    function closeTheSuccessModal() {
        successModal.classList.remove('active');
        // stopConfetti(); // Commented out: Confetti removal
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
        clearAllErrors(); // Clear errors when resetting form
        toolOptions.forEach(option => option.classList.remove('selected'));
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
        // Order of fields for focusing: Purpose, Trigger, Expected Output, Workflow, Email
        const fieldNamesInOrder = ['purpose', 'trigger', 'expectedOutput', 'workflow', 'email'];


        for (const fieldName of fieldNamesInOrder) {
            const field = fields[fieldName];
            const value = field.input.value.trim();
            // Clear previous error styling for this field (will be added back if error)
            field.input.classList.remove('input-error');
            field.errorElement.textContent = '';

            for (const validation of field.validations) {
                let currentFieldValid = true; // Assume valid for this specific validation rule first
                if (validation.type === 'required') {
                    if (!value) {
                        showError(field, validation.message);
                        formIsValid = false;
                        currentFieldValid = false;
                        if (!firstInvalidField) firstInvalidField = field.input;
                    }
                } else if (validation.type === 'emailFormat') {
                    if (value && !isValidEmailFormat(value)) { // Only if there's a value and it's bad format
                        showError(field, validation.message);
                        formIsValid = false;
                        currentFieldValid = false;
                        if (!firstInvalidField) firstInvalidField = field.input;
                    }
                } else if (validation.type === 'domain') {
                    // This rule should only apply if the email has some value and has a valid format so far
                    if (value && isValidEmailFormat(value) && !value.endsWith(validation.domain)) {
                        showError(field, validation.message);
                        formIsValid = false;
                        currentFieldValid = false;
                        if (!firstInvalidField) firstInvalidField = field.input;
                    }
                }
                if (!currentFieldValid) break; // Stop further validation for THIS field if one rule failed
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
        field.input.classList.add('input-error'); // Add error class for styling input
    }

    function clearAllErrors() {
        for (const fieldName in fields) {
            const field = fields[fieldName];
            if (field.errorElement) {
                field.errorElement.textContent = '';
            }
            field.input.classList.remove('input-error'); // Remove error class from input
        }

    }

    // Function to initialize enlarge icons for textareas
    function initializeEnlargeIcons() {

        const textareasToEnlargeConfig = [ fields.purpose, fields.trigger, fields.expectedOutput, fields.workflow ];
      
        textareasToEnlargeConfig.forEach(fieldConfig => {
            if (!fieldConfig || !fieldConfig.input || !fieldConfig.label) return; // Safety check

            const textarea = fieldConfig.input;

            const wrapper = textarea.parentElement;


            if (wrapper && wrapper.classList.contains('textarea-wrapper')) {
                const icon = document.createElement('span');
                icon.classList.add('enlarge-icon');

                icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 100%; height: 100%;"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>`;
                icon.title = 'Enlarge editor';


                const svgElement = icon.querySelector('svg');
                if (svgElement) svgElement.setAttribute('focusable', 'false');
                icon.addEventListener('click', () => {
                    currentEditingTextarea = textarea;
                    modalTextarea.value = textarea.value;

                    modalTitle.textContent = `Edit ${fieldConfig.label}`;
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
            if (currentEditingTextarea) currentEditingTextarea.value = modalTextarea.value;
            enlargeTextModal.classList.remove('active');
            modalTextarea.value = '';
            currentEditingTextarea = null;
        });
    }

    // Optional: Close modal if user clicks on the overlay
    if (enlargeTextModal) {
        enlargeTextModal.addEventListener('click', (event) => {
            if (event.target === enlargeTextModal) { // Clicked on the overlay itself
                if (currentEditingTextarea) currentEditingTextarea.value = modalTextarea.value;
                enlargeTextModal.classList.remove('active');
                modalTextarea.value = '';
                currentEditingTextarea = null;
            }
        });
    }
    initializeEnlargeIcons();
});
