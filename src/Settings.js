import React, { PureComponent } from 'react'
import NameUtils from './utils/NameUtils'
import { Form, FormControl, FormGroup, ControlLabel, HelpBlock, InputGroup, Button } from 'react-bootstrap'
import './Settings.css'

class Settings extends PureComponent {
  constructor(props) {
    super(props)
    this.max_name_length = 40
    this.state = {
      name: ''
    }
    NameUtils.set_after_init(() => {
      let stored_name = NameUtils.name(this.props.account)
      if (stored_name)
        this.setState({ name: NameUtils.name(this.props.account) })
    })
  }

  change_name = e => {
    this.setState({ name: e.target.value })
  }

  submit_name = e => {
    e.preventDefault()
    NameUtils.submit_name(this.state.name, this.props.account, this.props.web3.currentProvider)
  }

  name_validation = () => this.state.name.length < this.max_name_length ? 'success' : 'error'

  style = () => {
    let right = this.props.expand ? 0 : - this.props.panel_width
    return { right: right, width: this.props.panel_width }
  }

  render() {
    return (
      <div className="settings-panel" style={this.style()}>
        <Form>
          <FormGroup className="name-control" controlId="name" validationState={this.name_validation()}>
            <ControlLabel>Nickname</ControlLabel>
            <InputGroup>
              <FormControl
                type="text"
                value={this.state.name}
                placeholder={this.props.account}
                onChange={this.change_name}
              />
              <InputGroup.Button><Button onClick={this.submit_name}>Save</Button></InputGroup.Button>
            </InputGroup>
            <FormControl.Feedback/>
            <HelpBlock><span className="glyphicon glyphicon-alert"></span>&nbsp;Everyone will be able to see your nickname in association with your address</HelpBlock>
          </FormGroup>
        </Form>
      </div>
    )
  }
}

export default Settings