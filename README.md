# External Ticket Creation for Jira Service Management
These files are intended to be used in the integration between ServiceDesk Plus and Jira Service Management.
As the documentation for this process is unclear and seemingly outdated, I took it upon myself to design my own way based on the documentation provided.

Even though this process I have created works running of my computer, it has yet to be tested in a live environment

## Files Needed:
- server.js
- CREATE_JIRA_TICKET.html
- Create your own .env file that contains your API key, email and domain. Make sure all files are in the same directory.

The server.js file is what does most of the heavy lifting and uses the .env file to store organisation-specific or secret variables that are best not shared.

The only things you need to change in the server.js file are any of the field mapping that does not match your field values, and if you wish to use other custom fields you can copy what is done with the current custom fields in the file.

All custom fields will be able to use the getFieldOptionId function, so you can run any custom field you have through that. Then add your own mapping function by copying one of the current ones and changing the values to suit yours.
The most important part is creating the .env file and storing the required variables as shown below. The file should just be called ".env" and should be stored in the same place as the .js and .html files.

## **.env Format:**

JIRA_API_KEY=[api key]     <-- without the []'s on both

EMAIL=[email]

DOMAIN=[domain]     <-- The domain will look something like: [organisation].atlassian.net, you only need the [organisation] part in the DOMAIN variable.

PORT=[port]

PROJ_KEY=[project key]

## HTML file
The HTML file provided will create an online form with what should be all the required fields for converting a ticket in ServiceDesk Plus to a ticket in Jira.

Some fields in SD+ are used in Jira but Jira uses a different name (e.g. Subject in SD+ is Summary in Jira). This field mapping is done within the .js file.
The HTML file current has the values of each field on the form pre-filled with the variable names that are used in our ServiceDesk Plus template, but can be edited manually if you need.

To ensure the ticket is successfully submitted, you must input a valid choice in each of the fields outlined below. If you do not provide a valid requester for example, it will not push the ticket through.
You can change this by getting rid of the relevant if statements in the .js file.

## Running the code
To submit a ticket via this html form, first run the server.js file via the command prompt (node server.js is the command to do while you are in the same directory as the file).
Once the server.js file is running, you can then run the .html file and it should open up in the browser. Fill out the fields as shown below.

## Required fields:

The options here are taken directly from the ServiceDesk Plus options we have when creating a ticket. This will vary based on your own values.

These fields are automatically mapped within the Server.js file to the relevant fields in Jira.

When filling out the .html form you need to fill in these fields with one of the options shown (Copy exactly how it is written here):

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
  - Request for Service or Information
 
 


