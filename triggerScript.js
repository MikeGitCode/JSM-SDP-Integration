import fetch from 'node-fetch';

const triggerUrl = 'http://localhost:3000/create-ticket';

// Simulate form data (replace with actual data if available)
const ticketData = {
    requester: 'Michael Sturt',
    technician: 'Michael Sturt',
    urgency: 'Normal - Major Inconvenience',
    impact: 'Low - Impact One Client',
    priority: 'High',
    request_type: 'Request For Service or Information',
    subject: 'External Ticket',
    description: 'This ticket was made automatically via an external script.'
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
