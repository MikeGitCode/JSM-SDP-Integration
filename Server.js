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

const { JIRA_API_KEY, EMAIL, DOMAIN, PORT, PROJ_KEY } = process.env; // If you change or add anything in the .env file, add/change it here


const getAccountIdFromEmail = async (email) => {
    const userSearchUrl = `https://${DOMAIN}.atlassian.net/rest/api/3/user/search?query=${encodeURIComponent(email)}`;

    try {
        const response = await fetch(userSearchUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${EMAIL}:${JIRA_API_KEY}`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.length > 0) {
            return data[0].accountId;
        } else {
            console.error('User not found or failed to fetch user:', data);
            return null;
        }
    } 
    catch (error) {
        console.error('Error occurred while fetching accountId:', error);
        throw error;
    }
};


const getFieldOptionId = async (fieldId, optionName) => {
    const fieldOptionsUrl = `https://${DOMAIN}.atlassian.net/rest/api/3/customField/${fieldId}/option`;

    try {
        const response = await fetch(fieldOptionsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${EMAIL}:${JIRA_API_KEY}`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Failed to fetch field options:', errorData);
            return null;
        }

        const data = await response.json();

        if (!data.values) {
            console.error('Unexpected response format: No values field');
            return null;
        }

        // Log all available options
        data.values.forEach(option => {
            console.log(`Option ID: ${option.id}, Option Value: ${option.value}`);
        });

        if (!optionName) {
            console.error('Option name is undefined or null');
            return null;
        }

        const option = data.values.find(opt => opt.value.trim() === optionName.trim());

        if (!option) {
            console.error(`No matching option found for option name: ${optionName}`);
        } else {
            console.log('Selected Option:', JSON.stringify(option, null, 2));
        }

        return option ? option.id : null;
    } 
    catch (error) {
        console.error('Error occurred while fetching option ID:', error);
        throw error;
    }
};


const mapImpactNameToJira = (impactName) => {  // If you need any more custom fields mapped, create new functions for each like these ones.
    const mappings = {
        'Low - Impact One Client': 'Minor / Localized',
        'Medium - Impact A few Clients': 'Moderate / Limited',
        'High - Impact Site, Department or VIP': 'Extensive / Widespread'
    };
    return mappings[impactName] || null;
};


const mapUrgencyNameToJira = (urgencyName) => {
    const mappings = {
        'Low - Minor Inconvenience': 'Low',
        'Normal - Major Inconvenience': 'Medium',
        'High - Significant Work Impact': 'High',
        'Urgent - Unable to Work': 'Critical'
    };
    return mappings[urgencyName] || null;
};


const mapPriorityNameToJira = (priorityName) => {
    const mappings = {
        'Low': 'Lowest',
        'Normal': 'Low',
        'Medium': 'Medium',
        'High': 'High',
        'Critical': 'Highest'
    };
    return mappings[priorityName] || null;
};


const mapIssueTypeToJira = (issueTypeName) => {
    const mappings = {
        'Request For Service or Information': '[System] Service request',
        'Incident': '[System] Incident'
    };
    return mappings[issueTypeName] || null;
};


app.post('/create-ticket', async (req, res) => {
    const jiraUrl = `https://${DOMAIN}.atlassian.net/rest/api/3/issue`;

    const { requester, technician, urgency, impact, priority, request_type, subject, description, department } = req.body;

    try {
        const requesterAccountId = await getAccountIdFromEmail(requester);
        const technicianValue = (technician && technician.trim() !== 'Not Specified') ? technician : 'Unassigned';
        const technicianAccountId = technicianValue === 'Unassigned' ? null : await getAccountIdFromEmail(technicianValue);
        

        const mappedUrgencyName = mapUrgencyNameToJira(urgency);
        const urgencyIdNumber = mappedUrgencyName ? await getFieldOptionId('10064', mappedUrgencyName) : null; // If you add more customfields, you just need to copy what has been done with urgency or impact.
                                                                                                               // i.e. call the function that maps what is inputted to what is in Jira, and then get that field ID.
        const mappedImpactName = mapImpactNameToJira(impact);
        const impactIdNumber = mappedImpactName ? await getFieldOptionId('10004', mappedImpactName) : null;

        const mappedPriorityName = mapPriorityNameToJira(priority);
        const mappedIssueType = mapIssueTypeToJira(request_type);


        if (!requesterAccountId) return res.status(404).json({ success: false, message: 'Requester not found' });

        if (urgencyIdNumber === null) return res.status(404).json({ success: false, message: 'Urgency option not found' });
        if (impactIdNumber === null) return res.status(404).json({ success: false, message: 'Impact option not found' });
        if (mappedIssueType === null) return res.status(404).json({ success: false, message: 'Issue type not found' });

        const ticketData = {
            fields: {
                project: { key: `${PROJ_KEY}` },
                summary: subject || 'No Subject Provided',
                description: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: description || 'No Description Provided' }]
                        }
                    ]
                },
                issuetype: { name: mappedIssueType || '[System] Service Request'},
                reporter: { id: requesterAccountId },
                ...(technicianAccountId ? { assignee: { id: technicianAccountId } } : { assignee: { name: 'Unassigned' } }),
                priority: { name: mappedPriorityName },
                customfield_10064: { id: urgencyIdNumber.toString() },
                customfield_10004: { id: impactIdNumber.toString() },  // When you add more custom fields, copy what is done with these
                customfield_10111: department
            }
        };

        console.log('Payload:', JSON.stringify(ticketData, null, 2));

        const response = await fetch(jiraUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${EMAIL}:${JIRA_API_KEY}`).toString('base64')}`,
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


app.listen(PORT || 3000, () => {  // If no port is specified in the .env file, this will default to port 3000.
    console.log(`Server is running on port ${PORT || 3000}`);
});
