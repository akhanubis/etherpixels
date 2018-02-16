import React, { PureComponent } from 'react'
import PriceFormatter from './utils/PriceFormatter'
import { Form, FormControl, FormGroup, ControlLabel, HelpBlock, InputGroup, Button, ButtonToolbar, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import Switch from 'react-toggle-button'
import BigNumber from 'bignumber.js'
import './Settings.css'

class Settings extends PureComponent {
  constructor(props) {
    super(props)
    this.max_name_length = 45
    this.max_price_increase = 100
    this.min_price_increase = 10
    this.state = {
      name: '',
      gas_price: new BigNumber(props.settings.gas_price).mul(PriceFormatter.unit_exps.gwei).toNumber(),
      default_price_increase: props.settings.default_price_increase
    }
  }

  componentWillUpdate(new_props) {
    if (new_props.name != this.props.name)
      this.setState({ name: new_props.name })
  }

  change_name = e => {
    this.setState({ name: e.target.value })
  }

  submit_name = e => {
    e.preventDefault()
    this.props.on_name_update(this.state.name)
  }

  valid_name = () => this.state.name.length < this.max_name_length

  change_unit = new_unit => {
    PriceFormatter.set_unit(new_unit)
    this.props.on_update({ unit: new_unit })
  }

  change_humanized_units = v => {
    v = !v
    PriceFormatter.set_humanized(v)
    this.props.on_update({ humanized_units: v })
  }

  change_gas_price = e => {
    let gwei_gas = e.target.value === '' ? 1 : e.target.value
    this.setState({ gas_price: e.target.value })
    this.props.on_update({ gas_price: new BigNumber(gwei_gas).div(PriceFormatter.unit_exps.gwei).toNumber() })
  }

  valid_default_price_increase = () => this.state.default_price_increase <= this.max_price_increase && this.state.default_price_increase >= this.min_price_increase

  change_default_price_increase = e => {
    this.setState({ default_price_increase: e.target.value }, () => {
      if (this.valid_default_price_increase())
        this.props.on_update({ default_price_increase: this.state.default_price_increase })
    })
  }

  change_zoom_at_pointer = v => {
    v = !v
    this.props.on_update({ zoom_at_pointer: v })
  }

  style = () => {
    let right = this.props.expand ? 0 : - this.props.panel_width
    return { right: right, width: this.props.panel_width }
  }

  render() {
    return (
      <div className="settings-panel" style={this.style()}>
        <Form>
          <FormGroup className="name-control" controlId="name" validationState={this.valid_name() ? 'success' : 'error'}>
            <ControlLabel>Nickname</ControlLabel>
            <InputGroup>
              <FormControl
                type="text"
                value={this.state.name}
                placeholder={this.props.account}
                onChange={this.change_name}
              />
              <InputGroup.Button><Button onClick={this.submit_name} disabled={!this.valid_name()}>Save</Button></InputGroup.Button>
            </InputGroup>
            <FormControl.Feedback/>
          </FormGroup>
          <HelpBlock><span className="glyphicon glyphicon-alert"></span>&nbsp;Everyone will be able to see your nickname in association with your address</HelpBlock>
          <hr/>
          <FormGroup controlId="unit">
            <ControlLabel>Display values in</ControlLabel>
            <ButtonToolbar>
              <ToggleButtonGroup type="radio" name="units" defaultValue={this.props.settings.unit} onChange={this.change_unit}>
                {Object.entries(PriceFormatter.unit_labels).map(([key, label]) => <ToggleButton key={key} value={key}>{label}</ToggleButton>)}
              </ToggleButtonGroup>
            </ButtonToolbar>
          </FormGroup>
          <FormGroup controlId="humanized_units">
            <ControlLabel>Use k, m, g abbreviations</ControlLabel>
            <Switch
              value={this.props.settings.humanized_units}
              thumbStyle={{borderRadius: 2}}
              trackStyle={{borderRadius: 2}}
              onToggle={this.change_humanized_units}
            />
          </FormGroup>
          <FormGroup controlId="gas_price">
            <ControlLabel>Gas price in Gwei</ControlLabel>
            <FormControl
              type="number"
              value={this.state.gas_price}
              min={1}
              placeholder={1}
              onChange={this.change_gas_price}
            />
            <HelpBlock>Tx fee calculations will be done using this gas price</HelpBlock>
          </FormGroup>
          <FormGroup controlId="default_price_increase" validationState={this.valid_default_price_increase() ? 'success' : 'error'}>
            <ControlLabel>Default extra % to pay for each pixel</ControlLabel>
            <FormControl
              type="number"
              value={this.state.default_price_increase}
              min={this.min_price_increase}
              max={this.max_price_increase}
              placeholder={20}
              onChange={this.change_default_price_increase}
            />
            <FormControl.Feedback/>
          </FormGroup>
          <FormGroup controlId="zoom_at_pointer">
            <ControlLabel>Zoom into/out of cursor position</ControlLabel>
            <Switch
              value={this.props.settings.zoom_at_pointer}
              thumbStyle={{borderRadius: 2}}
              trackStyle={{borderRadius: 2}}
              onToggle={this.change_zoom_at_pointer}
            />
          </FormGroup>
        </Form>
      </div>
    )
  }
}

export default Settings