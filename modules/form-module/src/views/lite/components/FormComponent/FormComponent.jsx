import React, { useState, useEffect, useCallback, useMemo } from 'react'
import _ from 'lodash'
import { schema } from './formSchema'
import classes from './FormComponent.scss'

const ERROR_WAIT = 1000

const Input = ({ schema, onChange, onValidation, value, show, ...props }) => {
  const [error, setError] = useState(null)

  useEffect(() => {
    let newError = schema.validate(value)
    newError = value.trim() === '' ? null : error
    const errorAlreadyShown = error && newError
    if (errorAlreadyShown) {
      setError(newError)
      return
    }
    const timeoutHandle = setTimeout(() => {
      setError(newError)
    }, ERROR_WAIT)
    return () => clearTimeout(timeoutHandle)
  }, [value, setError, error])

  useEffect(() => {
    onValidation(error)
  }, [error])

  return (
    <div className={classes.Group} style={show ? { height: '0px' } : {}}>
      <input
        style={
          show ? { opacity: '1' } : { opacity: '0', height: '0px', border: '0px', margin: '0px', cursor: 'default' }
        }
        className={error ? classes.Input + ' ' + classes.InputError : classes.Input}
        value={value}
        placeholder={schema.fieldName || ''}
        onChange={onChange}
        {...props}
      />
      <div className={classes.Error} style={error ? { opacity: '1' } : { height: '0px', opacity: '0' }}>
        {error}
      </div>
    </div>
  )
}

export const FormComponent = props => {
  // if (!(props.isLastGroup && props.isLastOfGroup)) {
  //   return <p>{'[A form was here!]'}</p>
  // }

  const [values, setValues] = useState({})
  const [valid, setValid] = useState({})
  const [show, setShow] = useState({})

  const formFields = useMemo(() => _.pick(props, Object.keys(schema)), [])
  // const setShowState = (formFields, errorState) => {
  //   const showInputs = { ...shouldShow }

  //   Object.keys(schema).forEach(key => {
  //     if (showInputs[key]) {
  //       // Already been shown, do not remove it
  //       return
  //     }

  //     const dependencies = schema[key].dependsOn
  //     if (dependencies.length > 0) {
  //       // Check if there is an error for a dependency in the errorState
  //       const foundError = !!dependencies.find(key => {
  //         return !!errorState[key] || formFields[key].trim() === ''
  //       })

  //       showInputs[key] = !foundError
  //       return !foundError
  //     }
  //     showInputs[key] = true
  //   })

  // setShouldShow(showInputs)

  useEffect(() => {
    props.store.composer.setLocked(true)
    props.store.composer.setHidden(true)

    // const errorState = setErrorsState(formFields)
    // setShowState(formFields, errorState)
    setValues({ ...values, ...formFields })
  }, [])

  const showFields = useMemo(() => {
    return Object.keys(formFields).map(field => schema[field].dependsOn.every(() => valid[field]))
  }, [setShow, show, formFields, valid])

  const handleChange = (key, event) => {
    const newValues = {
      ...values,
      [key]: event.target.value
    }

    // setShowState(values, errorState)
    setValues(newValues)
  }

  const handleSubmit = event => {
    event.preventDefault()
    props.onSendData({ type: 'form-data', data: values })
    props.store.composer.setLocked(false)
    props.store.composer.setHidden(false)
  }

  const handleValidation = useCallback(
    (key, validation) => {
      setValid({ ...valid, [key]: validation })
    },
    [setValid, valid]
  )

  return (
    <form onSubmit={handleSubmit} className={classes.Form}>
      {Object.entries(values).map(([key, value]) => (
        <Input
          key={key}
          value={value}
          schema={schema[key]}
          show={showFields[key] || true}
          onChange={evt => handleChange(key, evt)}
          onValidation={v => handleValidation(key, v)}
        />
      ))}
    </form>
  )
}

// const handleBlur = key => {
//   const errorState = { ...errors }
//   const error = schema[key].validate(values[key])
//   errorState[key] = error
//   setShowState(values, errorState)
//   setErrors(errorState)
// }

// const setErrorsState = formFields => {
//   const formErrors = {}
//   Object.keys(schema).forEach(key => {
//     const error = schema[key].validate(formFields[key])
//     formErrors[key] = formFields[key].trim() === '' ? null : error
//   })

//   setErrors(formErrors)
//   return formErrors
// }
// return (
//   <form onSubmit={handleSubmit} className={classes.Form}>
//     {Object.entries(values).map(([key, value]) => (
//       <div className={classes.Group} style={!shouldShow[key] ? { height: '0px' } : {}} key={key}>
//         <input
//           style={
//             shouldShow[key]
//               ? { opacity: '1' }
//               : { opacity: '0', height: '0px', border: '0px', margin: '0px', cursor: 'default' }
//           }
//           className={errors[key] ? classes.Input + ' ' + classes.InputError : classes.Input}
//           value={value}
//           placeholder={schema[key].fieldName || ''}
//           onChange={event => {
//             handleChange(key, event)
//           }}
//           // onBlur={
//           //   shouldShow[key]
//           //     ? () => handleBlur(key)
//           //     : e => {
//           //         e.preventDefault()
//           //       }
//           // }
//         />
//         {errors[key] && (
//           <div className={classes.Error} style={!errors[key] ? { height: '0px', opacity: '0' } : { opacity: '1' }}>
//             {errors[key]}
//           </div>
//         )}
//       </div>
//     ))}
//     <input className={classes.Button} type="submit" value="Submit" />
//   </form>
// )
