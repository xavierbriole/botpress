import React from 'react'

export class FormComponent extends React.Component {
  render(props) {
    <form onSubmit={this.handleSubmit}>
      <input placeholder='First Name' id='fn'>{props.firstName}</input>
      <input placeholder='Last Name' id='ln'>{props.lastName} </input>
      <input placeholder='Phone Number' id='pn'>{props.phoneNumber} </input>
      <input placeholder='Business Email' id='be'>{props.businessEmail} </input>
      <input placeholder='Job Title' id='jt'>{props.jobTitle} </input>
      <input placeholder='Company' id='co'>{props.company}</input>
      <input placeholder='Use Case' id='uc'>{props.useCase} </input>
    </form>
  }
}
