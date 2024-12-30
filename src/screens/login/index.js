import React from 'react'
import { IonItem, IonInput, IonButton, IonIcon } from '@ionic/react'
import { connect } from 'react-redux'
import { lockClosed, mail } from 'ionicons/icons'
import { getConfig } from '../../appConfig'
import Layout from '../../components/layout'
import PasswordInput from '../../components/passwordInput'
import { forwardTo, getDefaultRoute } from '../../lib/utils'
import { loginRequest } from '../../store/actions'
import { withTranslation } from '../../lib/translate'
import Loading from '../../components/spinner'
import { FieldError, AltTitle, Spacer } from '../../components/common'
import { validateForm } from '../../lib/utils'
import './index.css'

class Login extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			username: '',
			password: '',
			formErrors: {}
		}
		this.handleInput = this.handleInput.bind(this)
		this.handleLogin = this.handleLogin.bind(this)
		this.formConfig = {
			username: { type: 'email', required: true },
			password: { type: 'password', required: true }
		}
	}

	handleInput (key, val) {
		this.setState({ [key]: val })
	}

	handleLogin () {
		let formErrors = validateForm(this.formConfig, this.state)
		this.setState({ formErrors })
		if (Object.keys(formErrors).length === 0) {
			const { protectedReferrer } = this.props
			const { username, password } = this.state
			this.props.dispatch(loginRequest({ username, password, referrer: protectedReferrer }))
		}
	}

	checkLoginStatus = () => {
		const { loggedIn } = this.props.auth
		if (loggedIn) {
			const defaultRoute = getDefaultRoute()
			forwardTo(defaultRoute.path)
		}
	}

	componentDidUpdate() {
		this.checkLoginStatus()
	}

	componentDidMount() {
		this.checkLoginStatus()
	}

	render () {
		const { __ } = this.props
		const { username, password } = this.state
		return (
			<Loading transparent>
				<Layout hideSecondToolbar={ true } headerTitle={ __('Login')} color="transparent">
					<div className="absolute-content flex-row-wrapper">
						<div className="flex-min">
							{ getConfig().theme.showHeaderOnAuthRoutes ?
								<>
									<AltTitle className="okx-font-tertiary-variant">{ __('Welcome Back!')}</AltTitle>
									<Spacer/>
								</>
								:
								<h3 className="login-header">{ __('Click below to register or login')}</h3>
							}
						</div>
						<div>
							<IonItem>
								{ getConfig().theme.showInputIconsOnLogin ?
									<IonIcon slot="start" className="login-icon" size="small" icon={ mail } />
									: null }
								<IonInput name="username" placeholder={ __('Enter your email address') } onIonChange={ e => this.handleInput('username', e.target.value) } onIonBlur={(e) => {
									const usernameInput = document.querySelector('input[type="email"]:-webkit-autofill')
									if (usernameInput) {
										this.handleInput('username', usernameInput.value)
									}
									this.handleInput('username', e.target.value)
								}} type="email" pattern="email" autocomplete="username" value={ username }/>
							</IonItem>
							<FieldError className="field-error" value={ __(this.state.formErrors.username) } />
							<IonItem>
								{ getConfig().theme.showInputIconsOnLogin ?
									<IonIcon slot="start" className="login-icon" size="small" icon={ lockClosed }/>
									: null }
								<PasswordInput placeholder={ __('Enter your password') } __={ __ } onIonChange={ e => this.handleInput('password', e.target.value) } value={ password }/>
							</IonItem>
							<FieldError className="field-error" value={ __(this.state.formErrors.password) } />
							<Spacer size={ 3 }/>
							<IonButton expand="block" color="primary" className="default-button login-button" onClick={() => this.handleLogin()}>{ __('Sign In') }</IonButton>
							<IonButton expand="block" color="dark" fill="clear" className="link underlined" onClick={ () => forwardTo('/reset-password')}>{ __('Forgot Password')}</IonButton>
						</div>
						<div className="flex-min">
							<IonButton expand="block" fill="outline" color="dark" onClick={() => forwardTo('/register')}>{ __('New User? Create An Account') }</IonButton>
						</div>
					</div>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { auth, protectedReferrer } = state.profile
	const { storedDeliveryAddress, storedPickUpPoint } = state.orders
	return {
		auth,
		protectedReferrer,
		storedDeliveryAddress,
		storedPickUpPoint
	}
}

export default connect(stateToProps)(withTranslation(Login))
