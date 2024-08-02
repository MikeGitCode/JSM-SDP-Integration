import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const getAccountIdFromEmail = async (email) => {
    const apiKey = process.env.JIRA_API_KEY;
    const userSearchUrl = `https://dpcwagov.atlassian.net/rest/api/3/user/search?query=${encodeURIComponent(email)}`;

    try {
        const response = await fetch(userSearchUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(`michael.sturt@dpc.wa.gov.au:${apiKey}`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.length > 0) {
            return data[0].accountId; // Return the first match
        } else {
            console.error('User not found or failed to fetch user:', data);
            return null;
        }
    } catch (error) {
        console.error('Error occurred while fetching accountId:', error);
        throw error;
    }
};



app.post('/create-ticket', async (req, res) => {
    const apiKey = process.env.JIRA_API_KEY;
    const jiraUrl = 'https://dpcwagov.atlassian.net/rest/api/3/issue';
    const requesterEmail = req.body.requester; // Assuming requester field contains email
    const technicianEmail = req.body.technician; // Assuming technician field contains email

    try {
        const requesterAccountId = await getAccountIdFromEmail(requesterEmail);
        const technicianAccountId = await getAccountIdFromEmail(technicianEmail);

        if (!requesterAccountId) {
            return res.status(404).json({ success: false, message: 'Requester not found' });
        }

        if (!technicianAccountId) {
            return res.status(404).json({ success: false, message: 'Technician not found' });
        }

        const ticketData = {
            fields: {
                project: {
                    key: 'TEST' // Replace with your actual project key
                },
                summary: req.body.subject,
                description: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: req.body.description
                                }
                            ]
                        }
                    ]
                },
                issuetype: {
                    name: '[System] Service request' // Ensure this matches an existing issue type in your Jira instance
                },
                reporter: {
                    id: requesterAccountId // Use the fetched requester accountId
                },
                assignee: {
                    id: technicianAccountId // Use the fetched technician accountId
                },
                priority: {
                    name: req.body.priority // Use the correct priority ID or value
                },
                
            }
        };

        console.log('Payload:', JSON.stringify(ticketData, null, 2));

        const response = await fetch(jiraUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`michael.sturt@dpc.wa.gov.au:${apiKey}`).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticketData)
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ success: true, message: 'Ticket created successfully!' });
        } else {
            console.error('Failed to create ticket:', data);
            res.status(response.status).json({ success: false, message: `${data.errorMessages || JSON.stringify(data.errors)}` });
        }
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ success: false, message: `An error occurred: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
