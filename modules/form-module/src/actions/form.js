  /**
   * Small description of your action
   * @title The title displayed in the flow editor
   * @category Custom
   * @author Your_Name
   * @param {string} name - An example string variable
   * @param {any} value - Another Example value
   */
  const myAction = async (name, value) => {


    const payload = [
      {
        type: 'custom',
        module: 'form-module',
        component: 'FormComponent',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        company: '',
        businessEmail: '',
        jobTitle: '',
        useCase: '',
        userId: event.target
      }
    ]

    bp.events.replyToEvent(event, payload)
    
  }

  return myAction(args.name, args.value)

