import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import { parseStringPromise } from 'xml2js';

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

const getFieldMappings = async () => 
{
    const xmlData = fs.readFileSync('Jira.xml', 'utf-8');
    const parsedXml = await parseStringPromise(xmlData);
    
    const mappings = parsedXml.mappings.mapping.reduce((acc, map) => 
        {
        acc[map.sourceField[0]] = map.targetField[0];
        return acc;
        }, {}
    );
    return mappings;
};

const mapFields = (source, mappings) => {
    const target = {};
    for (const [sourceField, targetField] of Object.entries(mappings)) {
        if (sourceField in source) {
            target[targetField] = source[sourceField];
        }
    }
    return target;
};

app.post('/create-ticket', async (req, res) => {
    const apiKey = process.env.JIRA_API_KEY;
    const jiraUrl = 'https://dpcwagov.atlassian.net/rest/api/3/issue';
    const email = req.body.requester;
    const technician = req.body.technician;

    try {
        const accountId = await getAccountIdFromEmail(email);
        const assigneeId = await getAccountIdFromEmail(technician);

        if (!accountId) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!assigneeId) {
            return res.status(404).json({ success: false, message: 'Technician not found' });
        }

        const mappings = await getFieldMappings();
        const ticketDataFields = mapFields(req.body, mappings);

        ticketDataFields.reporter = { id: accountId };
        ticketDataFields.assignee = { id: assigneeId };

        const ticketData = {
            fields: {
                project: {
                    key: 'TEST' // Replace with your actual project key
                },
                ...ticketDataFields,
                issuetype: {
                    name: '[System] Service request' // Ensure this matches an existing issue type in your Jira instance
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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
