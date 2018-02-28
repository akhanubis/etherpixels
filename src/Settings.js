import React, { PureComponent } from 'react'
import PriceFormatter from './utils/PriceFormatter'
import { Form, FormControl, FormGroup, ControlLabel, HelpBlock, InputGroup, Button, ButtonToolbar, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import Switch from 'react-toggle-button'
import BigNumber from 'bignumber.js'
import Slider from 'react-rangeslider'
import './Settings.css'
import 'react-rangeslider/lib/index.css'

class Settings extends PureComponent {
  constructor(props) {
    super(props)
    this.max_name_length = 45
    this.max_price_increase = 100
    this.min_price_increase = 10
    this.max_translation_speed = 200
    this.min_translation_speed = 1
    this.state = {
      name: '',
      gas_price: new BigNumber(props.settings.gas_price).mul(PriceFormatter.unit_exps.gwei).toNumber(),
      default_price_increase: props.settings.default_price_increase,
      translation_speed: parseInt(props.settings.translation_speed, 10)
    }
  }

  componentWillUpdate(new_props) {
    if (new_props.name !== this.props.name)
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

  change_price_option = new_option => {
    PriceFormatter.set_options(new_option)
    this.props.on_update(new_option)
  }

  change_unit = new_unit => this.change_price_option({ unit: new_unit })

  change_humanized_units = v => this.change_price_option({ humanized_units: !v })

  change_gas_price = v => {
    this.setState({ gas_price: v })
    this.props.on_update({ gas_price: new BigNumber(v).div(PriceFormatter.unit_exps.gwei).toNumber() })
  }

  valid_default_price_increase = () => this.state.default_price_increase <= this.max_price_increase && this.state.default_price_increase >= this.min_price_increase

  change_default_price_increase = e => {
    this.setState({ default_price_increase: e.target.value }, () => {
      if (this.valid_default_price_increase())
        this.props.on_update({ default_price_increase: this.state.default_price_increase })
    })
  }

  change_translation_speed = v => {
    this.setState({ translation_speed: v }, () => {
      this.props.on_update({ translation_speed: this.state.translation_speed })
    })
  }

  change_zoom_at_pointer = v => {
    v = !v
    this.props.on_update({ zoom_at_pointer: v })
  }

  change_with_usd = v => this.change_price_option({ with_usd: !v })

  expand = () => this.props.current_panel === 'settings'

  style = () => {
    let right = this.expand() ? 0 : - this.props.panel_width
    return { right: right, width: this.props.panel_width }
  }

  render() {
    return (
      <div className="right-panel settings-panel" style={this.style()}>
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
          <HelpBlock><i className="fas fa-exclamation-triangle" />&nbsp;Everyone will be able to see your nickname in association with your address</HelpBlock>
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
            <Slider
              value={this.state.gas_price}
              min={1}
              max={100}
              labels={{1: 1, 50: 50, 100: 100}}
              step={1}
              orientation="horizontal"
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
          <FormGroup controlId="translation_speed">
            <ControlLabel>Panning speed when using arrow keys</ControlLabel>
            <Slider
              value={this.state.translation_speed}
              min={this.min_translation_speed}
              max={this.max_translation_speed}
              labels={{1: 1, 100: 100, 200: 200}}
              step={1}
              orientation="horizontal"
              onChange={this.change_translation_speed}
            />
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
          <FormGroup controlId="with_usd">
            <ControlLabel>Show values in USD</ControlLabel>
            <Switch
              value={this.props.settings.with_usd}
              thumbStyle={{borderRadius: 2}}
              trackStyle={{borderRadius: 2}}
              onToggle={this.change_with_usd}
            />
          </FormGroup>
        </Form>
      </div>
    )
  }
}

export default Settings