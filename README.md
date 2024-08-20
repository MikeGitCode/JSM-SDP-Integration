# External Ticket Creation for Jira Service Management
These files are intended to be used in the integration between ServiceDesk Plus and Jira Service Management.
As the documentation for this process is unclear and seemingly outdated, I took it upon myself to design my own way based on the documentation provided.

I have created 2 files, a server.js file and a triggerScript.js file. The server.js file is designed to be run constantly and the triggerScript.js file will be executed whenever a ticket is created in ServiceDesk Plus.

Simple Outline of Process:
1. User selects a template in ManageEngine and fills out the information.
2. The user then submits this ticket, triggering a custom trigger that is set to run every time a ticket is created.
3. The custom trigger will execute the triggerScript.js file which will take any information provided in the ticket.
    - At the moment no field is required so if the user misses any information it will not affect the process.
4. The triggerScript.js file will then send the information its collected to the server.js file.
5. The server.js file re-maps the fields to the same names as what Jira uses and puts it into the JSON payload format that Jira takes.
6. Once the payload is sent, Jira then creates a ticket using that payload.

## Files Needed:
- server.js
- triggerScript.js
- Create your own .env file that contains your API key, email, domain, project key, and port (if no port is set it will default to port 3000). Make sure all files are in the same directory.

The server.js file is what does most of the heavy lifting and uses the .env file to store organisation-specific or secret variables that are best not shared.

The only things you need to change in the server.js file are any of the field mapping that do not match your field values, and if you wish to use other custom fields you can copy what is done with the current custom fields in the file.

All custom fields will be able to use the getFieldOptionId function, so you can run any custom field you have through that. Then add your own mapping function by copying one of the current ones and changing the values to suit yours.

The most important part is creating the .env file and storing the required variables as shown below. The file should just be called ".env" and should be stored in the same place as the other files.

## **.env Format:**
_The name for the .env file should just be .env. If this is not the case then the other files will not have the necessary information_

The format of the file is as follows:

JIRA_API_KEY=[api key]     <-- without the []'s on both

EMAIL=[email]

DOMAIN=[domain]     <-- The domain will look something like: [organisation].atlassian.net, you only need the [organisation] part in the DOMAIN variable.

PORT=[port]

PROJ_KEY=[project key]

## triggerScript file
Previously I was using the CREATE-JIRA-TICKET.html file to fill out a form which was then sent to Jira as a ticket. I have now replaced this with a second .js file that automatically takes information and sends it off without any need for manual input.

Currently the file has hardcoded values for testing purposes, but in the live version these will be replaced with placeholder variables that ServiceDesk Plus can fill out when a ticket is created.

## Running the code
To submit a ticket, first run the server.js file via the command prompt (node server.js is the command to do while you are in the same directory as the file).

Once the server.js file is running, you can then run the triggerScript.js file. Depending on whether your inputs are valid, it will either say the ticket was successfully created or failed.

Regardless of whether it was successful or not, the console you are running the server.js file in will display the payload and the data its getting the information from for the payload.

## Mapping fields:

The options here are taken directly from the ServiceDesk Plus options we have when creating a ticket. This will vary based on your own values.

These fields are automatically mapped within the Server.js file to the relevant fields in Jira.

The following fields are what are automatically mapped within the server.js file. If these do not match your values in ServiceDesk Plus then you will need to change them in the mapping functions in the server.js file.

### **- Requester**
  - Needs to be a valid requester under Jira, can see valid users when you click on the field in a ticket.
    
### **- Technician**
  - Needs to be a valid technician under Jira, can see valid users when you click on the field in a ticket.
    
### **- Priority**
  - Low
  - Medium
  - High
  - Critical
    
### **- Urgency**
  - Low - Minor Inconvenience
  - Normal - Major Inconvenience
  - High - Significant Work Impact
  - Urgent - Unable to Work
    
### **- Impact**
  - Low - Impact One Client
  - Medium - Impact A few Clients
  - High - Impact Site, Department or VIP
    
### **- Request Type**
  - Incident
  - Request For Service or Information
