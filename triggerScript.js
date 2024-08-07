import fetch from 'node-fetch';

const triggerUrl = 'http://localhost:3000/create-ticket';

// Simulate form data (replace with actual data if available)
const ticketData = {
    requester: '<#requester>',
    technician: '<#technician>',
    urgency: '<#urgency>',
    impact: '<#impact>',
    priority: '<#priority>',
    request_type: '<#request_type>',
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
            console.log('\x1b[32m', 'Ticket created successfully!', '\x1b[0m');
        } else {
            console.error('Failed to create ticket:', result);
        }
    } catch (error) {
        console.error('Error occurred:', error);
    }
};

// Simulate triggering with test data
sendRequest(ticketData);
