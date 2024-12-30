import React from 'react'
import { withRouter } from 'react-router'
import { IonModal, IonItem, IonButton, IonIcon } from '@ionic/react'
import { connect } from 'react-redux'
import { withTranslation } from '../../lib/translate'
import { validateProfileData } from '../../lib/utils'
import { Title, SmallText, Spacer } from '../common'
import { setModal, updateProfile, validateEmail } from '../../store/actions'
import ValidateInput from '../validateInput'
import { close } from 'ionicons/icons'
import './index.css'

class ValidateModal extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			first_name: this.props.profile.first_name || '',
			last_name: this.props.profile.last_name || '',
			email: this.props.profile.email || '',
			birthday: this.props.profile.birthday ? this.props.profile.birthday : ''
			// email_verified: false
		}
		this.handleInput = this.handleInput.bind(this)
		this.handleSave = this.handleSave.bind(this)
	}

	componentDidUpdate(prevProps) {
		if (this.props.profile.first_name !== prevProps.profile.first_name ) {
			this.setState({ first_name: this.props.profile.first_name })
		}
		if (this.props.profile.last_name !== prevProps.profile.last_name) {
			this.setState({ last_name: this.props.profile.last_name })
		}
		if (this.props.profile.email !== prevProps.profile.email) {
			this.setState({ email: this.props.profile.email })
		}
		if (this.props.profile.birthday !== prevProps.profile.birthday) {
			this.setState({ birthday: this.props.profile.birthday ? this.props.profile.birthday : '' })
		}
		if (this.props.profile.email_verified !== prevProps.profile.email_verified) {
			this.setState({ email_verified: this.props.profile.email_verified })
		}
	}

	handleSave () {
		const { dispatch } = this.props
		const { first_name, last_name, birthday, email, email_verified } = this.state
		const profile = { first_name: first_name, last_name: last_name, birthday: birthday, email: email, email_verified: email_verified }
		dispatch(updateProfile(profile, true))
		dispatch(setModal('isVerfiedModalOpen', false))
	}

		handleInput = (key, val) => {
			this.setState({ [key]: val })
		}

		handleValidateEmail = () => {
			const { dispatch } = this.props
			const { first_name, last_name, birthday, email, email_verified } = this.state
			const profile = { first_name: first_name, last_name: last_name, birthday: birthday, email: email, email_verified: email_verified }
			dispatch(validateEmail(profile))
		}

		render() {
			const { __, isVerfiedModalOpen, dispatch, profile } = this.props
			const { first_name, last_name, birthday, email, email_verified } = this.state
			const dateFormat = 'dd-mm-yy'
			const validatedData = validateProfileData({ ...profile, ...this.state })
			const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))

			return (
				<IonModal cssClass="validate-modal" isOpen={ isVerfiedModalOpen } onDidDismiss={ () => dispatch(setModal('isVerfiedModalOpen', false)) }>
					<div className="validate-modal-closer" onClick={ () => dispatch(setModal('isVerfiedModalOpen', false)) }>
						<IonIcon icon={ close } mode="ios" />
					</div>
					<div className="validate-modal-header">
						<Title>{ __('Verify your account') }</Title>
						<Spacer size={ 1 }/>
						<SmallText>{ __('Verify your account to place orders, redeem loyalty points and relevant promotions') }</SmallText>
					</div>

					<div className="modal-content">
						<IonItem lines="none">
							<ValidateInput label='First Name' type='text' onIonChange={ e => this.handleInput('first_name', e.target.value) } name='first_name' validatedData={ validatedData } value={ first_name } />
						</IonItem>

						<IonItem lines="none">
							<ValidateInput label='Last Name' type='text' onIonChange={ e => this.handleInput('last_name', e.target.value) } name='last_name' validatedData={ validatedData } value={ last_name } />
						</IonItem>
						<IonItem lines="none">
							<ValidateInput type='date' onIonChange={ e => this.handleInput('birthday', e.target.value) } name='birthday' dateFormat={dateFormat} validatedData={ validatedData } value={ birthday } max={ yesterday } />
						</IonItem>
						<IonItem lines="none">
							<ValidateInput label='Email Address' type="email" onIonChange={ e => this.handleInput('email', e.target.value) } name='email' validatedData={ validatedData } value={ email } />
						</IonItem>
						<IonItem lines="none">
							<ValidateInput type="email_verified" onIonChange={ e => this.handleInput('email_verified', e.target.value) } name='email_verified' validatedData={ validatedData } value={ email_verified } />
						</IonItem>
					</div>
					<div className="top-medium">
						{ validatedData.email_verified ? null :
							<IonButton expand="block" color="black" fill="outline" onClick={ () => this.handleValidateEmail() }>{ __('Resend Validation Email') }</IonButton>
						}
						<IonButton expand="block" color="primary" className="validation" onClick={ () => this.handleSave() }>{__('Save & Continue')}</IonButton>
					</div>
				</IonModal>
			)
		}

}

const stateToProps = store => {
	const { isVerfiedModalOpen, profile } = store.profile
	return {
		isVerfiedModalOpen,
		profile
	}
}

export default connect(stateToProps)(withRouter(withTranslation(ValidateModal)))
