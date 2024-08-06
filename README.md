**Files Needed:**
- server.js
- CREATE_JIRA_TICKET.html
- Create your own .env file that contains your API key, email and domain. Make sure all files are in the same directory.


**.env Format:**

JIRA_API_KEY=[api key]     <-- without the []'s on both

EMAIL=[email]

DOMAIN=[domain]     <-- The domain will look something like: [organisation].atlassian.net

============================================================================================


To submit a ticket via this html form, first run the server.js file via the command prompt (node server.js is the command to do while you are in the same directory as the file).
Once the server.js file is running, you can then run the .html file and it should open up in the browser. Fill out the fields as shown below.

When filling out the .html form you need to fill in these fields with one of the options shown (Copy exactly how it is written here):
Required fields:

**- Requester**
  - Needs to be a valid requester under Jira, can see valid users when you click on the field in a ticket.
    
**- Technician**
  - Needs to be a valid technician under Jira, can see valid users when you click on the field in a ticket.
    
**- Priority**
  - Low
  - Medium
  - High
  - Critical
    
**- Urgency**
  - Low - Minor Inconvenience
  - Normal - Major Inconvenience
  - High - Significant Work Impact
  - Urgent - Unable to Work
    
**- Impact**
  - Low - Impact One Client
  - Medium - Impact A few Clients
  - High - Impact Site, Department or VIP
    
**- Request Type**
  - Incident
  - Request for Service or Information
 
 
The options here are taken directly from the ServiceDesk Plus options you are given when creating a ticket.
These are automatically mapped within the Server.js file to the relevant fields in Jira.

Some automation rules have already been set up to detect certain keywords in the Subject (Summary in jira), so that Jira knows what request type to set for the ticket.
  - By default, it looks for "Locked" and sets the request type to Issue with Account and it looks for Monitor and sets the request type to Report Hardware Problem.
