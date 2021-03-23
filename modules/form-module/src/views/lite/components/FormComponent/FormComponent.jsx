import React, { useState, useEffect, useCallback } from 'react'
import _ from 'lodash'
import { schema } from './formSchema'
import classes from './FormComponent.scss'

export const FormComponent = props => {
  if (!(props.isLastGroup && props.isLastOfGroup)) {
    return <p>{'[A form was here!]'}</p>
  }

  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [shouldShow, setShouldShow] = useState({})

  const setErrorsState = formFields => {
    const formErrors = {}
    Object.keys(schema).forEach(key => {
      const error = schema[key].validate(formFields[key])
      formErrors[key] = formFields[key].trim() === '' ? null : error
    })

    setErrors(formErrors)
    return formErrors
  }

  const setShowState = (formFields, errorState) => {
    const showInputs = { ...shouldShow }

    Object.keys(schema).forEach(key => {
      if (showInputs[key]) {
        // Already been shown, do not remove it
        return
      }

      const dependencies = schema[key].dependsOn
      if (dependencies.length > 0) {
        // Check if there is an error for a dependency in the errorState
        const foundError = !!dependencies.find(key => {
          return !!errorState[key] || formFields[key].trim() === ''
        })

        showInputs[key] = !foundError
        return !foundError
      }
      showInputs[key] = true
    })

    setShouldShow(showInputs)
  }

  useEffect(() => {
    const formFields = _.pick(props, Object.keys(schema))
    const errorState = setErrorsState(formFields)
    setShowState(formFields, errorState)

    setValues({ ...values, ...formFields })
  }, [])

  const handleChange = (key, event) => {
    setValues({ ...values, [key]: event.target.value })
  }

  const handleSubmit = event => {
    event.preventDefault()
    props.onSendData({ type: 'form-data', data: values })
    // props.onSendData({ type: 'text', text: 'Looks good!' })
  }

  const handleBlur = key => {
    const errorState = { ...errors }

    console.log('handle blur')
    console.log(values)
    console.log(values[key])

    const error = schema[key].validate(values[key])
    errorState[key] = error

    setShowState(values, errorState)
    setErrors(errorState)
  }

  const delayedChange = useCallback(
    _.debounce(key => handleBlur(key, values), 3000),
    []
  )

  return (
    <form onSubmit={handleSubmit} className={classes.Form}>
      {Object.entries(values).map(([key, value]) => (
        <div className={classes.Group} style={!shouldShow[key] ? { height: '0px' } : {}} key={key}>
          <input
            style={shouldShow[key] ? { opacity: '1' } : { opacity: '0', height: '0px', border: '0px', margin: '0px' }}
            className={errors[key] ? classes.Input + ' ' + classes.InputError : classes.Input}
            value={value}
            placeholder={schema[key].fieldName || ''}
            onChange={event => {
              handleChange(key, event)
              delayedChange(key)
            }}
            onBlur={
              shouldShow[key]
                ? () => handleBlur(key)
                : e => {
                    e.preventDefault()
                  }
            }
          />
          {<div className={classes.Error}>{errors[key] && errors[key]}</div>}
        </div>
      ))}
      <input className={classes.Button} type="submit" value="Submit" />
    </form>
  )
}
