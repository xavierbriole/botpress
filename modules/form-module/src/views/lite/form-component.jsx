import React from 'react'

export class FormComponent extends React.Component {
  render() {
    return (
      <form>
        <input placeholder="First Name" id="fn" value={this.props.firstName} />
        <input placeholder="Last Name" id="ln" value={this.props.lastName} />
        <input placeholder="Phone Number" id="pn" value={this.props.phoneNumber} />
        <input placeholder="Business Email" id="be" value={this.props.businessEmail} />
        <input placeholder="Job Title" id="jt" value={this.props.jobTitle} />
        <input placeholder="Company" id="co" value={this.props.companyName} />
        <input placeholder="Use Case" id="uc" value={this.props.useCase} />
        <button>Submit!</button>
      </form>
    )
  }
}
