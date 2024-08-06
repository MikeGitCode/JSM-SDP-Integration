import fetch from 'node-fetch';

const triggerUrl = 'http://localhost:3000/create-ticket';

// Simulate form data (replace with actual data if available)
const ticketData = {
    requester: 'michael.sturt@dpc.wa.gov.au',
    technician: 'michael.sturt@dpc.wa.gov.au',
    urgency: 'Low - Minor Inconvenience',
    impact: 'Low - Impact One Client',
    priority: 'Low',
    request_type: 'Incident',
    subject: '<#subject>',
    description: '<#description>'
};

const sendRequest = async (data) => {
    try {
        const response = await fetch(triggerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Ticket created successfully!');
        } else {
            console.error('Failed to create ticket:', result);
        }
    } catch (error) {
        console.error('Error occurred:', error);
    }
};

// Simulate triggering with test data
sendRequest(ticketData);
