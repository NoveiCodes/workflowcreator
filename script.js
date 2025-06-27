document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('workflowForm');
    const loadingScreen = document.getElementById('loadingScreen');
    const responseMessageContainer = document.getElementById('responseMessage');
    const createAnotherWorkflowBtn = document.getElementById('createAnotherWorkflowBtn');

    // Input fields and their error message elements
    const fields = {
        purpose: {
            input: document.getElementById('purpose'),
            errorElement: document.getElementById('purposeError'),
            defaultError: "Purpose is required."
        },
        trigger: {
            input: document.getElementById('trigger'),
            errorElement: document.getElementById('triggerError'),
            defaultError: "Trigger is required."
        },
        expectedOutput: {
            input: document.getElementById('expectedOutput'),
            errorElement: document.getElementById('expectedOutputError'),
            defaultError: "Expected Output is required."
        },
        workflow: {
            input: document.getElementById('workflow'),
            errorElement: document.getElementById('workflowError'),
            defaultError: "Workflow description is required."
        },
        tools: {
            input: document.getElementById('tools'),
            errorElement: document.getElementById('toolsError'),
            defaultError: "At least one tool must be selected."
        },
        email: {
            input: document.getElementById('email'),
            errorElement: document.getElementById('emailError'),
            defaultError: "Email is required.",
            kiwiError: "Email must end with @kiwi.com."
        }
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearAllErrors();
        responseMessageContainer.style.display = 'none'; // Hide previous messages
        responseMessageContainer.textContent = '';
        responseMessageContainer.className = 'response-message';


        if (!validateForm()) {
            return; // Stop if validation fails
        }

        // Show loading screen
        form.style.display = 'none';
        loadingScreen.style.display = 'flex';


        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (key === 'tools') {
                if (!data[key]) {
                    data[key] = [];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });

        const webhookUrl = 'https://kiwicom.app.n8n.cloud/webhook-test/f831c5d5-975e-4877-98e1-b50990c18194';

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            loadingScreen.style.display = 'none';

            if (response.ok) { // Status 200-299
                responseMessageContainer.textContent = "Workflow created successfully. For further details and next steps, please check Slack.";
                responseMessageContainer.classList.add('success');
                responseMessageContainer.style.display = 'block';
                createAnotherWorkflowBtn.style.display = 'inline-block';
                form.reset(); // Clear the form on success
                // form.style.display = 'none'; // Keep form hidden, show success message
            } else {
                // Handle non-2xx responses (like 400)
                const errorData = await response.json().catch(() => ({ message: "An unexpected error occurred." }));
                let errorMessage = "There was an error creating your workflow. Please review your inputs and try submitting again.";
                if (response.status === 400) {
                    errorMessage = `Error ${response.status}: ${errorData.message || "Bad Request. Please check your input."} Please review your inputs and try submitting again. If this problem persists, please inform the admin.`;
                } else {
                     errorMessage = `Error ${response.status}: ${errorData.message || "An error occurred."} Please review your inputs and try submitting again. If this problem persists, please inform the admin.`;
                }
                responseMessageContainer.textContent = errorMessage;
                responseMessageContainer.classList.add('error');
                responseMessageContainer.style.display = 'block';
                form.style.display = 'block'; // Show form again with user's input
            }
        } catch (error) {
            // Network errors or other issues
            loadingScreen.style.display = 'none';
            responseMessageContainer.textContent = "There was a network error or the server is unreachable. Please try submitting again. If this problem persists, please inform the admin.";
            responseMessageContainer.classList.add('error');
            responseMessageContainer.style.display = 'block';
            form.style.display = 'block'; // Show form again
        }
    });

    createAnotherWorkflowBtn.addEventListener('click', () => {
        form.reset();
        clearAllErrors();
        form.style.display = 'block';
        responseMessageContainer.style.display = 'none';
        createAnotherWorkflowBtn.style.display = 'none';
    });

    function validateForm() {
        let isValid = true;

        // Validate required text/textarea fields
        ['purpose', 'trigger', 'expectedOutput', 'workflow'].forEach(fieldName => {
            const field = fields[fieldName];
            if (!field.input.value.trim()) {
                showError(field, field.defaultError);
                isValid = false;
            }
        });

        // Validate tools (multi-select)
        const toolsField = fields.tools;
        if (toolsField.input.selectedOptions.length === 0) {
            showError(toolsField, toolsField.defaultError);
            isValid = false;
        }

        // Validate email
        const emailField = fields.email;
        if (!emailField.input.value.trim()) {
            showError(emailField, emailField.defaultError);
            isValid = false;
        } else if (!emailField.input.value.endsWith('@kiwi.com')) {
            showError(emailField, emailField.kiwiError);
            isValid = false;
        }
        
        return isValid;
    }

    function showError(field, message) {
        field.errorElement.textContent = message;
        // field.input.classList.add('error-input'); // Optional: add class to highlight input
    }

    function clearAllErrors() {
        for (const key in fields) {
            fields[key].errorElement.textContent = '';
            // fields[key].input.classList.remove('error-input'); // Optional: remove highlight class
        }
    }
});
