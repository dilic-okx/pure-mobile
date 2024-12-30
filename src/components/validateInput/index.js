import React from 'react'
import { IonIcon, IonInput, IonButton, IonLabel } from '@ionic/react'
import './index.css'
import { isDefined } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import Mobiscroll from '../../components/mobiscroll'
import { beforeShowTimePicker, beforeCloseTimePicker } from '../../store/actions'
import moment from '../../lib/moment'

const check = require('../../assets/images/Deli_Check.svg')
const wrong = require('../../assets/images/Deli_Wrong.svg')

const { DatePicker } = Mobiscroll

class ValidateInput extends React.Component {
	state = {
		value: this.props.value || '',
		show: false
	}

	componentDidMount() {
		if (this.props.name) {
			const valid = this.props.validatedData[this.props.name]
			this.setState({ show: valid })
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.value !== this.props.value) {
			this.setState({ value: this.props.value })
		}
		if (prevProps.validatedData[this.props.name] !== this.props.validatedData[this.props.name]) {
			if (this.props.name ) {
				const valid = this.props.validatedData[this.props.name]
				this.setState({ show: valid })
			}
		}
	}

	togglePass = () => {
		const { type } = this.props
		if (type && type === 'email') {
			const value = isDefined(this.state.value) && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(this.state.value)
			this.setState({ show: value })
		} else {
			const value = isDefined(this.state.value) && this.state.value !== ''
			this.setState({ show: value })
		}
	}

	handlePeriodicalSaga = flag => {
		const { dispatch } = this.props
		dispatch({ type: 'SET_COMMON_PROP', key: 'emitterFlag', value: flag })
	}

	onChange = e => {
		const { onIonChange } = this.props
		this.setState({ value: e.target.value }, () => {
			this.togglePass()
		})
		if (onIonChange) {
			onIonChange(e)
		}
	}

	render () {
		const { show, value } = this.state
		const { __, label, type, ...rest } = this.props
		const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
		const defaultDateValue = moment().subtract(18, 'years')
		return (
			<div className="okx-validate-input-wrapper">
				<div className="okx-validate-input-holder">
					{ label ?
						<IonLabel position="floating">{ __(label) }</IonLabel>
						: null }
					{type === 'date' ? <div className="date-picker-wrapper">
						<label className="date-picker-modal-label" htmlFor="demo-non-form">{ __('Date of Birth') }</label>
						<DatePicker
							className="data-picker-input"
							display="bottom"
							max={yesterday}
							setText="Done"
							defaultValue={defaultDateValue}
							onSet={ (e, a) => this.onChange({ target: { value: a.element.value }}) }
							onBeforeShow={ () => this.props.dispatch(beforeShowTimePicker()) }
							{ ...rest }
							value={ value }
							onClose={ () => {
								this.props.dispatch(beforeCloseTimePicker())
								this.handlePeriodicalSaga(true)
							}}
							onShow={ () => this.handlePeriodicalSaga(false) }
						/>
					</div>: null}
					{type === 'text' ? <IonInput { ...rest } value={ value } onIonChange={ this.onChange }></IonInput> : null}
					{type === 'email' ? <IonInput readonly { ...rest } value={ value } onIonChange={ this.onChange }></IonInput> : null}
					{type === 'email_verified' ? <p>{ __('Email Address Validated') }</p> : null }
				</div>
				<IonButton fill="clear" size="small" onTouchStart={ () => this.togglePass() } onTouchEnd={ () => this.togglePass() }>
					<IonIcon slot="icon-only" icon={ show ? check : wrong }/>
				</IonButton>
			</div>
		)
	}
}

export default withTranslation(ValidateInput)
