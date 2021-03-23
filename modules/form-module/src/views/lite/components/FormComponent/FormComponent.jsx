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
    props.store.composer.setLocked(true)
    // this.props.store.composer.setLocked(true)

    const formFields = _.pick(props, Object.keys(schema))
    const errorState = setErrorsState(formFields)
    setShowState(formFields, errorState)
    setValues({ ...values, ...formFields })
  }, [])

  const handleChange = (key, event) => {
    const newValues = {
      ...values,
      [key]: event.target.value
    }

    const errorState = { ...errors }
    const error = schema[key].validate(newValues[key])
    errorState[key] = error

    setShowState(values, errorState)
    setErrors(errorState)
    setValues(newValues)
  }

  const handleSubmit = event => {
    event.preventDefault()
    props.onSendData({ type: 'form-data', data: values })
    props.store.composer.setLocked(false)
    // this.props.store.composer.setHidden(false)
  }

  const handleBlur = key => {
    const errorState = { ...errors }
    const error = schema[key].validate(values[key])
    errorState[key] = error
    setShowState(values, errorState)
    setErrors(errorState)
  }

  return (
    <form onSubmit={handleSubmit} className={classes.Form}>
      {Object.entries(values).map(([key, value]) => (
        <div className={classes.Group} style={!shouldShow[key] ? { height: '0px' } : {}} key={key}>
          <input
            style={
              shouldShow[key]
                ? { opacity: '1' }
                : { opacity: '0', height: '0px', border: '0px', margin: '0px', cursor: 'default' }
            }
            className={errors[key] ? classes.Input + ' ' + classes.InputError : classes.Input}
            value={value}
            placeholder={schema[key].fieldName || ''}
            onChange={event => {
              handleChange(key, event)
            }}
            onBlur={
              shouldShow[key]
                ? () => handleBlur(key)
                : e => {
                    e.preventDefault()
                  }
            }
          />
          {
            <div className={classes.Error} style={!errors[key] ? { height: '0px', opacity: '0' } : { opacity: '1' }}>
              {errors[key] && errors[key]}
            </div>
          }
        </div>
      ))}
      <input className={classes.Button} type="submit" value="Submit" />
    </form>
  )
}
