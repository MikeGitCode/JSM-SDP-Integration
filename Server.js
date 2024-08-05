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

const getAccountIdFromEmail = async (email) => 
    {
    const apiKey = process.env.JIRA_API_KEY;
    const userSearchUrl = `https://dpcwagov.atlassian.net/rest/api/3/user/search?query=${encodeURIComponent(email)}`;

    try 
    {
        const response = await fetch(userSearchUrl, 
            {
            method: 'GET',
            headers: 
                {
                'Authorization': `Basic ${Buffer.from(`michael.sturt@dpc.wa.gov.au:${apiKey}`).toString('base64')}`,
                'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (response.ok && data.length > 0) 
        {
            return data[0].accountId; // Return the first match
        } 

        else 
        {
            console.error('User not found or failed to fetch user:', data);
            return null;
        }

    } 

    catch (error) 
    {
        console.error('Error occurred while fetching accountId:', error);
        throw error;
    }
};


const getUrgencyOptionId = async (urgencyName) => {
    const apiKey = process.env.JIRA_API_KEY;
    const fieldOptionsUrl = `https://dpcwagov.atlassian.net/rest/api/3/customField/10064/option`;

    try {
        const response = await fetch(fieldOptionsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(`michael.sturt@dpc.wa.gov.au:${apiKey}`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Failed to fetch field options:', errorData);
            return null;
        }

        const data = await response.json();
        console.log('Field Options Data:', JSON.stringify(data, null, 2)); // Debug output

        if (!data.values) {
            console.error('Unexpected response format: No values field');
            return null;
        }

        // Log all available options
        data.values.forEach(option => {
            console.log(`Option ID: ${option.id}, Option Value: ${option.value}`);
        });

        // Ensure that `urgencyName` is not undefined or null
        if (!urgencyName) {
            console.error('Urgency name is undefined or null');
            return null;
        }

        // Find the option with the matching value
        const option = data.values.find(opt => opt.value.trim() === urgencyName.trim());

        if (!option) {
            console.error(`No matching option found for urgency name: ${urgencyName}`);
        } else {
            console.log('Selected Option:', JSON.stringify(option, null, 2)); // Debug output
        }

        return option ? option.id : null;

    } catch (error) {
        console.error('Error occurred while fetching urgency option ID:', error);
        throw error;
    }
};


app.post('/create-ticket', async (req, res) => {
    const apiKey = process.env.JIRA_API_KEY;
    const jiraUrl = 'https://dpcwagov.atlassian.net/rest/api/3/issue';
    const requesterEmail = req.body.requester; // Assuming requester field contains email
    const technicianEmail = req.body.technician; // Assuming technician field contains email
    const urgencyName = req.body.urgency; // Assuming urgency field contains name

    try {
        const requesterAccountId = await getAccountIdFromEmail(requesterEmail);
        const technicianAccountId = await getAccountIdFromEmail(technicianEmail);
        const urgencyIdNumber = await getUrgencyOptionId(urgencyName);

        if (!requesterAccountId) {
            return res.status(404).json({ success: false, message: 'Requester not found' });
        }

        if (!technicianAccountId) {
            return res.status(404).json({ success: false, message: 'Technician not found' });
        }

        if (urgencyIdNumber === null) {
            return res.status(404).json({ success: false, message: 'Urgency option not found' });
        }

        const ticketData = {
            fields: {
                project: {
                    key: 'TEST'
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
                    name: '[System] Service request'
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

                customfield_10064: {
                    id: urgencyIdNumber.toString() // Use the formatted urgencyId
                }
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
app.listen(PORT, () => 
    {
    console.log(`Server is running on port ${PORT}`);
    }
);