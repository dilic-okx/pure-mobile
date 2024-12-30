import React from 'react'
import { IonButton, IonInput, IonToggle, IonItem, IonLabel, IonList, IonAlert } from '@ionic/react'
import { connect } from 'react-redux'
import Layout from '../../components/layout'
import PasswordInput from '../../components/passwordInput'
import { forwardTo, getDefaultRoute } from '../../lib/utils'
import { registerRequest, setModal, setSysLocale, setRegisterForm } from '../../store/actions'
import { withTranslation } from '../../lib/translate'
import { FieldError, Title, SmallText, Spacer } from '../../components/common'
import { validateForm } from '../../lib/utils'
import Loading from '../../components/spinner'
import { Plugins } from '@capacitor/core'
import './index.css'

const { Device } = Plugins

class Register extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			formErrors: {}
		}
		this.handleInput = this.handleInput.bind(this)
		this.handleRegister = this.handleRegister.bind(this)
		this.navToTerms = this.navToTerms.bind(this)
		this.formConfig = {
			first_name: { type: 'text', required: false },
			last_name: { type: 'text', required: false },
			mobile: { type: 'text', required: false },
			email: { type: 'email', required: true },
			password: { type: 'password', required: true },
			accepted_terms_and_conditions: { type: 'toggle', toggle: true }
		}
	}

	handleInput (key, val) {
		const { dispatch } = this.props
		dispatch(setRegisterForm(key, val))
		if (key === 'accepted_terms_and_conditions') {
			let formErrors = { ...this.state.formErrors }
			formErrors.accepted_terms_and_conditions = undefined
			this.setState({ formErrors })
		}
	}

	handleRegister () {
		const { registerFormData } = this.props
		let formErrors = validateForm(this.formConfig, registerFormData)
		this.setState({ formErrors })
		if (Object.keys(formErrors).length === 0) {
			this.props.dispatch(registerRequest())
		}
	}

	componentDidMount() {
		const { loggedIn } = this.props.auth
		Device.getLanguageCode().then((res) => {
			const sysLocale = res.value.substr(0, 2)
			if (sysLocale) {
				this.props.dispatch(setSysLocale(sysLocale))
			}
		})
		if (loggedIn) {
			const defaultRoute = getDefaultRoute()
			forwardTo(defaultRoute.path)
		}
	}

	returnToLogin = (history) => history.goBack()

	navToTerms = () => forwardTo('/terms')

	render () {
		const { __, isRegisterModalOpen, registerFormData } = this.props
		const email = registerFormData.email
		const password = registerFormData.password
		const first_name = registerFormData.first_name
		const last_name = registerFormData.last_name
		const mobile = registerFormData.mobile
		const accepted_terms_and_conditions = registerFormData.accepted_terms_and_conditions
		const is_subscribed = registerFormData.is_subscribed

		return (
			<Loading transparent>
				<Layout headerTitle="Register" hideSecondToolbar={ true } color="transparent">
					<Title>{ __('Register')}</Title>
					<SmallText>{ __('To register please enter your email address and a password')}</SmallText>
					<Spacer/>
					<IonList>
						<IonItem>
							<IonInput placeholder={ __('Enter your email address') + ' *' } onIonChange={ e => this.handleInput('email', e.target.value) } required={ true } type="email" pattern="email" inputmode="email" value={ email }></IonInput>
						</IonItem>
						<FieldError className="field-error" value={ __(this.state.formErrors.email) } />
						<IonItem>
							<PasswordInput placeholder={ __('Enter your password') + ' *' } onIonChange={ e => this.handleInput('password', e.target.value) } value={ password }/>
						</IonItem>
						<FieldError className="field-error" value={ __(this.state.formErrors.password) } />
						<IonItem>
							<IonInput placeholder={ __('Enter your first name') } onIonChange={ e => this.handleInput('first_name', e.target.value) } required={ false } type="text" pattern="text" inputmode="text" value={ first_name }></IonInput>
						</IonItem>
						<IonItem>
							<IonInput placeholder={ __('Enter your last name') } onIonChange={ e => this.handleInput('last_name', e.target.value) } required={ false } type="text" pattern="text" inputmode="text" value={ last_name }></IonInput>
						</IonItem>
						<IonItem>
							<IonInput placeholder={ __('Enter your mobile number') } onIonChange={ e => this.handleInput('mobile', e.target.value) } required={ false } type="tel" pattern="tel" inputmode="tel" value={ mobile }></IonInput>
						</IonItem>
					</IonList>
					<Spacer/>
					<div className="box-holder no-padding">
						<IonList>
							<IonItem>
								<div className="toggle padded-small no-padding-right">
									<IonLabel>
										<h2>{ __('Accept T&Cs') }</h2>
										<IonLabel className="ion-text-wrap">
											<SmallText>{ __('By signing up you agree to our')} <span className="link underlined" onClick={ this.navToTerms }>{ __('terms and conditions of service')}</span> { __('and')} <span className="link underlined" onClick={() => forwardTo('/privacy')}>{ __('privacy policy')}</span></SmallText>
										</IonLabel>
									</IonLabel>
									<FieldError className="field-error" value={ __(this.state.formErrors.accepted_terms_and_conditions) } />
								</div>
								<IonToggle style={{ paddingRight: '16px' }} color="primary" slot="end" checked={ accepted_terms_and_conditions } onIonChange={ e => this.handleInput('accepted_terms_and_conditions', e.detail.checked)}/>
							</IonItem>
							<IonItem lines="none">
								<div className="padded-small no-padding-right">
									<IonLabel>
										<h2>{ __('Email Opt in') }</h2>
										<IonLabel className="ion-text-wrap">
											<SmallText>{ __('I\'d like to receive email updates that contain news, offers and promotions') }</SmallText>
										</IonLabel>
									</IonLabel>
								</div>
								<IonToggle style={{ paddingRight: '16px' }} color="primary" slot="end" checked={ is_subscribed } onIonChange={ e => this.handleInput('is_subscribed', e.detail.checked) } />
							</IonItem>
						</IonList>
					</div>
					<Spacer/>
					<div className="top-medium">
						<IonButton expand="block" color="primary" className="register-button" onClick={() => this.handleRegister()}>{ __('Register')}</IonButton>
					</div>
				</Layout>
				<IonAlert
					isOpen={ isRegisterModalOpen }
					onDidDismiss={ () => this.props.dispatch(setModal('isRegisterModalOpen', false)) }
					header={ __('Success') }
					message={ __('Register processed. Please check your mail') }
					buttons={[
						{
							text: __('Close'),
							role: 'cancel',
							cssClass: 'secondary',
							handler: () => this.props.dispatch(setModal(('isRegisterModalOpen', false)))
						}
					]}
				/>
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { auth, isRegisterModalOpen, registerFormData } = state.profile
	return {
		auth,
		isRegisterModalOpen,
		registerFormData
	}
}

export default connect(stateToProps)(withTranslation(Register))
