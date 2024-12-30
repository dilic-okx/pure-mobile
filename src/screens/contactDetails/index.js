import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IonButton, IonItem, IonLabel,	IonInput, IonList } from '@ionic/react'
import Layout from '../../components/layout'
import Loading from '../../components/spinner'
import { FieldError, Title, SmallText } from '../../components/common'
import { validateForm, forwardTo } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import { updateProfile } from '../../store/actions'
import Basket from '../../lib/basket'
import './index.css'

const { getMobile, setMobile } = Basket

class ContactDetails extends Component {
	constructor(props) {
		super(props)
		this.state = {
			first_name: this.props.profile.first_name || '',
			last_name: this.props.profile.last_name || '',
			mobile: getMobile() || this.props.profile.mobile || '',
			formErrors: {}
		}
		this.handleInput = this.handleInput.bind(this)
		this.handleSave = this.handleSave.bind(this)
		this.formConfig = {
			first_name: { type: 'first_name', required: true },
			mobile: { type: 'tel', required: true }
		}
		// this.triggerInputFile = this.triggerInputFile.bind(this)
		// this.inputRef = React.createRef()
		// this.onChangeFile = this.onChangeFile.bind(this)
	}

	componentDidMount() {
		if (this.state.first_name !== '' && this.state.mobile !== '') {
			forwardTo('/checkout', { skipContactDetails: true })
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.profile.first_name !== prevProps.profile.first_name ) {
			this.setState({ first_name: this.props.profile.first_name })
		}
		if (this.props.profile.last_name !== prevProps.profile.last_name) {
			this.setState({ last_name: this.props.profile.last_name })
		}
		if (this.props.profile.mobile !== prevProps.profile.mobile) {
			this.setState({ mobile: this.props.profile.mobile ? this.props.profile.mobile : getMobile() })
		}
	}

	handleInput = (key, val) => {
		if (key === 'mobile') {
			setMobile(val)
		}
		this.setState({ [key]: val })
	}

	handleSave () {
		const { cards } = this.props
		let formErrors = validateForm(this.formConfig, this.state)
		this.setState({ formErrors })
		if (Object.keys(formErrors).length === 0) {
			const { first_name, last_name, mobile } = this.state
			const profile = {
				first_name: first_name,
				last_name: last_name,
				mobile: mobile ? mobile : getMobile()
			}
			if (mobile) {
				this.props.dispatch(updateProfile(profile, true))
			}
			if (cards && cards.length >= 1) {
				forwardTo('/checkout')
			} else {
				forwardTo('/card-add')
			}
		}
	}

	render() {
		const { __ } = this.props
		const { first_name, last_name, mobile, formErrors } = this.state

		return (
			<Loading transparent>
				<Layout headerTitle="Contact Details">
					<div className="absolute-content flex-row-wrapper">
						<div className="scrollable-y checkout">
							<Title>{ __('Contact Details')}</Title>
							<SmallText color="gray">
								{ __('To complete your order, please provide a few details in case we need to contact you') }
							</SmallText>
							<IonList>
								<IonItem lines="none">
									<IonLabel position="floating">{ __('First Name') }</IonLabel>
									<IonInput onIonChange={ e => this.handleInput('first_name', e.target.value) } clearInput required={ true } type="text" pattern="text" inputmode="text" value={ first_name }>
									</IonInput>
									{formErrors.first_name ? <FieldError className="field-error" value={ __(formErrors.first_name) } />: null}
								</IonItem>
								<IonItem lines="none">
									<IonLabel position="floating">{ __('Last Name')}</IonLabel>
									<IonInput onIonChange={ e => this.handleInput('last_name', e.target.value) } clearInput required={ true } type="text" pattern="text" inputmode="text" value={ last_name }>
									</IonInput>
								</IonItem>
								<IonItem lines="none">
									<IonLabel position="floating">{ __('Mobile Number')}</IonLabel>
									<IonInput onIonChange={ e => this.handleInput('mobile', e.target.value) } clearInput required={ true } type="tel" pattern="tel" inputmode="tel" value={ mobile }>
									</IonInput>
									{formErrors.mobile ? <FieldError className="field-error" value={ __(formErrors.mobile) } />: null}
								</IonItem>
							</IonList>
						</div>
						<div className="flex-min">
							<IonButton onClick={ this.handleSave } expand="block">{ __('Checkout') }</IonButton>
						</div>
					</div>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = (state) => {
	const { auth, profile } = state.profile
	const { cards } = state.orders
	return {
		auth,
		profile,
		cards
	}
}

export default connect(stateToProps)(withTranslation(ContactDetails))

