## Overview

This is a Custom Module which displays a Form for the user to enter and send multiple lines of information.

The Form is connected to SALES FORCE, it requires the SF Integration Module & Working credentials.

## Quick Start

1. Copy the .TGZ file to your studios 
2. Also copy the SF integration to your modules page
3. Lastly, you need to create a Hook Before outgoing Middleware: 

```
{
  /** Your code starts below */
  const axios = require('axios')
  if (event.type != 'form-data') return

  bp.logger.info(event.payload)

  const crud = async (objectType, operation, data) => {
    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
    try {
      const createResp = await axios.post(`/mod/salesforce/objects/${objectType}/${operation}`, data, axiosConfig)
      if (createResp.data.errors.length > 0) {
        throw new Error('something happened')
      }
      // resp.data:
      // {
      // "id": "<ID of modified/created Object>",
      // "success": <true or false>,
      // "errors": [<errors if any>]
      // }
    } catch (err) {
      bp.logger.error(err.message)
    }
  }

  const data = event.payload.data

  const body = {
    Status: 'Lead-In',
    // CurrencyIsoCode: "CAD",
    FirstName: data.firstName,
    LastName: data.lastName,
    Phone: data.phoneNumber,
    Email: data.email,
    Company: data.companyName,
    Title: data.jobTitle
    //ProjectGoal__c: event.payload.useCase
  }

  bp.logger.info(JSON.stringify(body))

  crud('Lead', 'create', body)
}
/** Your code ends here */

4. Restart the server
5. Connect the variables given conversationally to the values given to the action.
