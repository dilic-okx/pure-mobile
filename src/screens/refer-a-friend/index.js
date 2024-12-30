import React from 'react'
import { IonCard, IonCardContent, IonButton, IonInput, IonItem } from '@ionic/react'

import Layout from '../../components/layout'
import Loading from '../../components/spinner'
import { Title, Spacer, FieldError } from '../../components/common'
import { validateForm } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import { sendRefer } from '../../store/actions'

import './index.css'

class ReferAFriend extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			email: '',
			formErrors: {}
		}
		this.formConfig = {
			email: { type: 'email', required: true }
		}
	}

	handleInput (key, val) {
		this.setState({ [key]: val })
	}

	handleRefer = () => {
		const { dispatch, __ } = this.props
		let formErrors = validateForm(this.formConfig, this.state, __)
		this.setState({ formErrors })
		if (Object.keys(formErrors).length === 0) {
			const { email } = this.state
			const data = { email: email }
			this.setState({ email: '' })
			dispatch(sendRefer(data))
		}
	}

	render () {
		const { __ } = this.props
		const { email } = this.state
		return (
			<Loading transparent>
				<Layout noPadding={ true } color="transparent" headerTitle={ __('Refer A Friend')}>
					<div className="absolute-content refer-a-friend"/>
					<div className="title-bar relative okx-bgcolor-primary"><Title className="centered"><strong>{ __('Refer A Friend')}</strong></Title></div>
					<IonCard color="white" class="raf-card">
						<IonCardContent>
							<div className="web-only">
								<Title>{ __('Refer A Friend')}</Title>
								<Spacer size="3"/>
							</div>
							<IonItem>
								<IonInput onIonChange={ e => this.handleInput('email', e.target.value)} required placeholder={ __('Friend\'s email address')} type="email" pattern="email" inputmode="email" value={ email }/>
							</IonItem>
							<FieldError className="field-error" value={ __(this.state.formErrors.email)} />
							<Spacer size="1"/>
							<IonButton expand="block" color="primary" strong={ true } onClick={() => this.handleRefer()}>
								{ __('Send Invitation')}
							</IonButton>
							<div className="raf-info">
								{ __('Once your friend has signed up and used the app you will both receive a reward of 10 points!')}
							</div>
						</IonCardContent>
					</IonCard>
				</Layout>
			</Loading>
		)
	}
}

export default withTranslation(ReferAFriend)
