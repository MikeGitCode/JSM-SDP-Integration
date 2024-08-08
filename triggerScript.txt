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
    description: '<#description>',
    id: '<#id>',
    category: '<#category>',
    mode: '<#mode>',
    subcategory: '<#subcategory>',
    status: '<#status>',
    is_escalated: '<#is_escalated>',
    notification_status: '<#notification_status>',
    resolved_time: '<#resolved_time>',
    requester_ack_comments: '<#requester_ack_comments>',
    requester_ack_resolution: '<#requester_ack_resolution>',
    created_time: '<#created_time>',
    created_by: '<#created_by>',
    template: '<#template>',
    approval_status: '<#approval_status>',
    service_category: '<#service_category>',
    site: '<#site>',
    display_id: '<#display_id>',
    due_by_time: '<#due_by_time>',
    first_response_due_by_time: '<#first_response_due_by_time>',
    group: '<#group>',
    has_notes: '<#has_notes>',
    department: '<#department>',
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
        } 
        
        else {
            console.error('Failed to create ticket:', result);
        }
    } 
    catch (error) {
        console.error('Error occurred:', error);
    }
};

// Simulate triggering with test data
sendRequest(ticketData);
