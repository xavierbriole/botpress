export const schema = {
  firstName: {
    fieldName: 'First Name',
    dependsOn: [],
    validate: value => {
      if (value.trim() === '') {
        return 'First Name is required'
      }
      if (/[^a-zA-Z -]/.test(value)) {
        return 'Invalid characters'
      }
      if (value.trim().length < 3) {
        return 'First Name needs to be at least three characters'
      }
      return null
    }
  },
  lastName: {
    fieldName: 'Last Name',
    dependsOn: [],
    validate: value => {
      if (value.trim() === '') {
        return 'Last Name is required'
      }
      if (/[^a-zA-Z -]/.test(value)) {
        return 'Invalid characters'
      }
      if (value.trim().length < 3) {
        return 'Last Name needs to be at least three characters'
      }
      return null
    }
  },
  businessEmail: {
    fieldName: 'Business Email',
    dependsOn: ['firstName', 'lastName'],
    validate: value => {
      if (value.trim() === '') {
        return 'Business Email is required'
      }
      const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      if (!emailPattern.test(String(value).toLowerCase())) {
        return 'Please enter a valid Business Email'
      }

      return null
    }
  },
  phoneNumber: {
    fieldName: 'Phone Number',
    dependsOn: ['firstName', 'lastName'],
    validate: () => {
      return false
    }
  },
  jobTitle: {
    fieldName: 'Job Title',
    dependsOn: ['firstName', 'lastName', 'businessEmail'],
    validate: value => {
      if (value.trim() === '') {
        return 'Job Title is required'
      }
      if (value.trim().length < 3) {
        return 'Job Title needs to be at least three characters'
      }
      return null
    }
  },
  companyName: {
    fieldName: 'Company Name',
    dependsOn: ['firstName', 'lastName', 'businessEmail'],
    validate: value => {
      if (value.trim() === '') {
        return 'Company Name is required'
      }
      if (value.trim().length < 3) {
        return 'Company Name needs to be at least three characters'
      }
      return null
    }
  },
  useCase: {
    fieldName: 'Use Case',
    dependsOn: ['firstName', 'lastName', 'businessEmail'],
    validate: value => {
      if (value.trim() === '') {
        return 'Use Case is required'
      }
      if (value.trim().length < 3) {
        return 'Use Case needs to be at least three characters'
      }
      return null
    }
  }
}
