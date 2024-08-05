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

const getImpactOptionId = async (impactName) => {
    const apiKey = process.env.JIRA_API_KEY;
    const fieldOptionsUrl = `https://dpcwagov.atlassian.net/rest/api/3/customField/10004/option`; // Replace with your actual Impact custom field ID

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
        console.log('Impact Field Options Data:', JSON.stringify(data, null, 2)); // Debug output

        if (!data.values) {
            console.error('Unexpected response format: No values field');
            return null;
        }

        // Log all available options
        data.values.forEach(option => {
            console.log(`Option ID: ${option.id}, Option Value: ${option.value}`);
        });

        // Ensure that `impactName` is not undefined or null
        if (!impactName) {
            console.error('Impact name is undefined or null');
            return null;
        }

        // Find the option with the matching value
        const option = data.values.find(opt => opt.value.trim() === impactName.trim());

        if (!option) {
            console.error(`No matching option found for impact name: ${impactName}`);
        } else {
            console.log('Selected Impact Option:', JSON.stringify(option, null, 2)); // Debug output
        }

        return option ? option.id : null;

    } catch (error) {
        console.error('Error occurred while fetching impact option ID:', error);
        throw error;
    }
};

const mapImpactNameToJira = (impactName) => {
    switch (impactName) {
        case 'Low - Impact One Client':
            return 'Minor / Localized'; // Jira Impact Value
        case 'Medium - Impact A few Clients':
            return 'Moderate / Limited'; // Jira Impact Value
        case 'High - Impact Site, Department or VIP':
            return 'Extensive / Widespread'; // Jira Impact Value
        default:
            return null;
    }
};

const mapUrgencyNameToJira = (urgencyName) => {
    switch (urgencyName) {
        case 'Low - Minor Inconvenience':
            return 'Low'; // Jira Impact Value
        case 'Normal - Major Inconvenience':
            return 'Medium'; // Jira Impact Value
        case 'High - Significant Work Impact':
            return 'High'
        case 'Urgent - Unable to Work':
            return 'Critical'; // Jira Impact Value
        default:
            return null;
    }
};

const mapPriorityNameToJira = (priorityName) => {
    switch (priorityName) {
        case 'Low':
            return 'Lowest'; // Jira Impact Value
        case 'Normal':
            return 'Low'; // Jira Impact Value
        case 'Medium':
            return 'Medium'
        case 'High':
            return 'High'; // Jira Impact Value
        case 'Critical':
            return 'Highest'; // Jira Impact Value
        default:
            return null;
    }
};

const mapIssueTypeToJira = (issueTypeName) => {
    switch (issueTypeName) {
        case 'Request For Service or Information':
            return '[System] Service request';
        case 'Incident':
            return '[System] Incident'
    }
}


app.post('/create-ticket', async (req, res) => {
    const apiKey = process.env.JIRA_API_KEY;
    const jiraUrl = 'https://dpcwagov.atlassian.net/rest/api/3/issue';
    const requesterEmail = req.body.requester;
    const technicianEmail = req.body.technician;
    const urgencyName = req.body.urgency;
    const impactName = req.body.impact;
    const priorityName = req.body.priority
    const issueTypeName = req.body.request_type

    try {
        // Fetch account IDs
        const requesterAccountId = await getAccountIdFromEmail(requesterEmail);
        const technicianAccountId = await getAccountIdFromEmail(technicianEmail);

        // Map urgency name and fetch ID
        const mappedUrgencyName = mapUrgencyNameToJira(urgencyName);
        const urgencyIdNumber = mappedUrgencyName ? await getUrgencyOptionId(mappedUrgencyName) : null;

        // Map impact name and fetch ID
        const mappedImpactName = mapImpactNameToJira(impactName);
        const impactIdNumber = mappedImpactName ? await getImpactOptionId(mappedImpactName) : null;

        // Map priority name
        const mappedPriorityName = mapPriorityNameToJira(priorityName);

        // Map Request Type to Issue Type
        const mappedIssueType = mapIssueTypeToJira(issueTypeName);

        if (!requesterAccountId) {
            return res.status(404).json({ success: false, message: 'Requester not found' });
        }

        if (!technicianAccountId) {
            return res.status(404).json({ success: false, message: 'Technician not found' });
        }

        if (urgencyIdNumber === null) {
            return res.status(404).json({ success: false, message: 'Urgency option not found' });
        }

        if (impactIdNumber === null) {
            return res.status(404).json({ success: false, message: 'Impact option not found' });
        }
        
        if (mappedIssueType === null) {
            return res.status(404).json({ success: false, message: 'Issue type not found' });
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
                    name: mappedIssueType
                },

                reporter: {
                    id: requesterAccountId
                },

                assignee: {
                    id: technicianAccountId
                },

                priority: {
                    name: mappedPriorityName
                },

                customfield_10064: {
                    id: urgencyIdNumber.toString()
                },

                customfield_10004: {
                    id: impactIdNumber.toString() // Add the Impact field mapping here
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