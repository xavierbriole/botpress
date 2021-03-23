/**
 * Small description of your action
 * @title Render Lead Form
 * @category Form
 * @author Botpress
 * @param {string} firstName - An example string variable
 * @param {string} lastName - An example string variable
 * @param {string} phoneNumber - An example string variable
 * @param {string} companyName - An example string variable
 * @param {string} businessEmail - An example string variable
 * @param {string} jobTitle - An example string variable
 * @param {string} useCase - An example string variable
 */
const myAction = async (firstName, lastName, phoneNumber, companyName, businessEmail, jobTitle, useCase) => {
  const payload = [
    {
      type: 'custom',
      module: 'form-module',
      component: 'FormComponent',
      firstName,
      lastName,
      phoneNumber,
      companyName,
      businessEmail,
      jobTitle,
      useCase
    }
  ]

  bp.events.replyToEvent(event, payload, event.id)
}

return myAction(
  args.firstName,
  args.lastName,
  args.phoneNumber,
  args.companyName,
  args.businessEmail,
  args.jobTitle,
  args.useCase
)
