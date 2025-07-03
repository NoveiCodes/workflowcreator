document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('workflowForm');
    const loadingScreen = document.getElementById('loadingScreen');
    const responseMessageContainer = document.getElementById('responseMessage');
    const createAnotherWorkflowBtn = document.getElementById('createAnotherWorkflowBtn');
    const toolsContainer = document.getElementById('toolsContainer');
    const toolOptions = document.querySelectorAll('.tool-option');

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
        // 'tools' field is handled differently now
        toolsErrorElement: document.getElementById('toolsError'), // Keep reference to error element
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


        const formData = new FormData(form); // Still useful for other fields
        const data = {};
        formData.forEach((value, key) => {
            // Exclude 'tools' as it's handled manually
            if (key !== 'tools') { // This condition might not be strictly necessary if 'tools' has no name attribute
                data[key] = value;
            }
        });

        // Manually collect selected tools
        data.tools = [];
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
        form.reset(); // Clears standard input fields
        clearAllErrors();
        toolOptions.forEach(option => option.classList.remove('selected')); // Deselect custom tools
        form.style.display = 'block';
        responseMessageContainer.style.display = 'none';
        createAnotherWorkflowBtn.style.display = 'none';
    });

    // Event listener for tool selection
    if (toolsContainer) {
        toolsContainer.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('tool-option')) {
                target.classList.toggle('selected');
                // Clear error message for tools if any tool is selected
                if (document.querySelector('.tool-option.selected')) {
                    fields.toolsErrorElement.textContent = '';
                }
            }
        });
    }


    function validateForm() {
        let isValid = true;

        // Validate required text/textarea fields
        ['purpose', 'trigger', 'expectedOutput', 'workflow'].forEach(fieldName => {
            const field = fields[fieldName];
            if (!field.input.value.trim()) {
                showError(field.errorElement, field.defaultError);
                isValid = false;
            }
        });

        // Validate custom tools
        const selectedTools = document.querySelectorAll('.tool-option.selected');
        if (selectedTools.length === 0) {
            showError(fields.toolsErrorElement, "Please select at least one tool.");
            isValid = false;
        }

        // Validate email
        const emailField = fields.email;
        if (!emailField.input.value.trim()) {
            showError(emailField.errorElement, emailField.defaultError); // Pass errorElement
            isValid = false;
        } else if (!emailField.input.value.endsWith('@kiwi.com')) {
            showError(emailField.errorElement, emailField.kiwiError); // Pass errorElement
            isValid = false;
        }
        
        return isValid;
    }

    function showError(errorElement, message) { // Modified to accept errorElement directly
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearAllErrors() {
        // Clear errors for standard fields
        ['purpose', 'trigger', 'expectedOutput', 'workflow', 'email'].forEach(fieldName => {
            const field = fields[fieldName];
            if (field && field.errorElement) {
                field.errorElement.textContent = '';
            }
        });
        // Clear error for tools
        if (fields.toolsErrorElement) {
            fields.toolsErrorElement.textContent = '';
        }
    }
});
