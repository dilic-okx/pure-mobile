import React from 'react'
import { connect } from 'react-redux'
import { IonItem, IonButton, IonInput, IonAlert, IonList } from '@ionic/react'
import Layout from '../../components/layout'
import { FieldError, Title, SmallText, Spacer } from '../../components/common'
import { resetPassword, setModal } from '../../store/actions'
import { withTranslation } from '../../lib/translate'
import { validateForm } from '../../lib/utils'
import './index.css'

class ResetPassword extends React.Component {
	constructor (props) {
		super(props)
		this.state = {
			email: '',
			formErrors: {}
		}
		this.handleInput = this.handleInput.bind(this)
		this.handleResetPassword = this.handleResetPassword.bind(this)
		this.formConfig = {
			email: { type: 'email', required: true }
		}
	}

	handleResetPassword() {
		let formErrors = validateForm(this.formConfig, this.state)
		this.setState({ formErrors })
		if (Object.keys(formErrors).length === 0) {
			const { email } = this.state
			this.props.dispatch(resetPassword(email))
		}
	}

	handleInput = (key, val) => this.setState({ [key]: val })

	returnToLogin = (history) => history.goBack()

	render() {
		const { __, isResetPasswordModalOpen } = this.props
		const { email, formErrors } = this.state
		return (
			<>
				<Layout headerTitle={ __('Forgot Password')} hideSecondToolbar={ true } color="transparent">
					<div className="flex-row-wrapper absolute-content">
						<div className="scrollable-y">
							<Title>{ __('Forgot Password')}</Title>
							<SmallText>{ __('We all do it, don\'t worry. Check your email - we\'ll send you a reminder.')}</SmallText>
							<Spacer size={ 2 }/>
							<IonList>
								<IonItem className="single-item">
									<IonInput placeholder={ __('Enter your email address')} onIonChange={ e => this.handleInput('email', e.target.value)} clearInput required={ true } type="email" pattern="email" inputmode="email" value={ email } />
								</IonItem>
								{ formErrors.email ? <FieldError className="field-error" value={ __(formErrors.email)}/> : null}
							</IonList>
						</div>
						<div className="flex-min">
							<IonButton expand="block" color="primary" onClick={() => this.handleResetPassword()}>{ __('Reset Password')}</IonButton>
						</div>
					</div>
				</Layout>
				<IonAlert
					isOpen={ isResetPasswordModalOpen }
					onDidDismiss={() => this.props.dispatch(setModal('isResetPasswordModalOpen', false))}
					header={ __('Bingo.')}
					message={ __('Please check your email')}
					buttons={[
						{
							text: __('Close'),
							role: 'cancel',
							cssClass: 'secondary',
							handler: () => this.props.dispatch(setModal(('isResetPasswordModalOpen', false)))
						}
					]}
				/>
			</>
		)
	}
}

const stateToProps = state => {
	const { auth, isResetPasswordModalOpen } = state.profile
	return {
		auth,
		isResetPasswordModalOpen
	}
}

export default connect(stateToProps)(withTranslation(ResetPassword))
