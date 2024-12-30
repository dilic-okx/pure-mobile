import React from 'react'
import { connect } from 'react-redux'
import { IonButton, IonList, IonItem, IonInput, IonTextarea, IonLabel } from '@ionic/react'
import Layout from '../../components/layout'
import { Title, NormalText, SmallText, Spacer, FieldError } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { validateForm, forwardTo } from '../../lib/utils'
import { addDeliveryAddress, storeDeliveryAddress, showToast } from '../../store/actions'
import Loading from '../../components/spinner'
import Basket from '../../lib/basket'

import './index.css'

class DeliveryAddressAdd extends React.Component {
	state = {
		form: {
			addressLine1: this.props.deliveryAddress ? this.props.deliveryAddress.addressLine1 : '',
			addressLine2: this.props.deliveryAddress ? this.props.deliveryAddress.addressLine2 : '',
			place: this.props.deliveryAddress ? this.props.deliveryAddress.place : '',
			postalCode: this.props.deliveryAddress ? this.props.deliveryAddress.postalCode : '',
			driverNotes: null
		},
		formErrors: {}
	}
	formConfig = {
		addressLine1: { required: true },
		place: { required: true },
		postalCode: { required: true }
	}
	handleInput = (key, val) => {
		const form = {
			...this.state.form,
			[key]: val
		}
		this.setState({
			form,
			formErrors: validateForm(this.formConfig, form)
		})
	}
	save = () => {
		const { __, auth, profile, dispatch } = this.props
		if (auth && auth.loggedIn) {
			let found = !!(profile.address_list || []).find(al => this.state.form.addressLine1 + this.state.form.place + this.state.form.postalCode === al.addressLine1 + al.place + al.postalCode)
			if (!found) {
				this.props.dispatch(addDeliveryAddress(this.state.form))
			} else {
				dispatch(showToast(__('Address already exist'), 'warning'))
			}
			Basket.setDeliveryAddress(this.state.form)
		} else {
			this.props.dispatch(storeDeliveryAddress(this.state.form))
			Basket.setDeliveryAddress(this.state.form)
		}
		forwardTo('/delivery-time')
	}
	componentDidMount () {
		this.setState({
			formErrors: validateForm(this.formConfig, this.state.form)
		})
	}
	render () {
		const { __, deliveryAddress } = this.props
		const { form, formErrors } = this.state
		const formValid = Object.keys(formErrors).length === 0

		const postalCodeReadOnly = deliveryAddress && Object.keys(deliveryAddress).length === 1 && Object.keys(deliveryAddress)[0] === 'postalCode'

		const postalCodeReadOnlyAttr = postalCodeReadOnly ? { readonly: true } : {}
		return (
			<Loading transparent>
				<Layout>
					<div className="flex-row-wrapper absolute-content">
						<div className="flex-min">
							<Title>{ __('Complete Your Address')}</Title>
							<SmallText>{ __('Complete your full delivery address details')}</SmallText>
							<Spacer/>
							<NormalText>{ __('Your order will be delivered from:')}</NormalText>
							<br /><NormalText>{ Basket.getRestauranName() }</NormalText>
							{/* <Spacer/> */}
							{/* <Spacer/> */}
						</div>
						<div className="scrollable-y">
							<IonList lines="full">
								<IonItem>
									<IonLabel className="normal-text" position="floating">{ __('Address Line 1')}</IonLabel>
									<IonInput required={ true } value={ form.addressLine1 } onIonChange={ e => this.handleInput('addressLine1', e.target.value)} type="text" clearInput/>
								</IonItem>
								{ formErrors.addressLine1 ? <FieldError className="field-error" value={ __(formErrors.addressLine1)} /> : null }
								<IonItem>
									<IonLabel className="normal-text" position="floating">{ __('Address Line 2')}</IonLabel>
									<IonInput value={ form.addressLine2 } onIonChange={ e => this.handleInput('addressLine2', e.target.value)} type="text" clearInput/>
								</IonItem>
								<IonItem>
									<IonLabel className="normal-text" position="floating">{ __('Town')}</IonLabel>
									<IonInput required={ true } value={ form.place } onIonChange={ e => this.handleInput('place', e.target.value)} type="text" clearInput/>
								</IonItem>
								{ formErrors.place ? <FieldError className="field-error" value={ __(formErrors.place)} /> : null }
								<IonItem>
									<IonLabel className="normal-text" position="floating">{ __('Postcode')}</IonLabel>
									<IonInput required={ true } { ...postalCodeReadOnlyAttr } value={ form.postalCode.toUpperCase() } onIonChange={ e => { return postalCodeReadOnly ? null : this.handleInput('postalCode', e.target.value)}} type="text" clearInput/>
								</IonItem>
								{ formErrors.postalCode ? <FieldError className="field-error" value={ __(formErrors.postalCode)} /> : null }
								<IonItem>
									<IonLabel className="normal-text" position="floating">{ __('Driver Notes')}</IonLabel>
									<IonTextarea value={ form.driverNotes } onIonChange={ e => this.handleInput('driverNotes', e.target.value)} type="text" clearInput/>
								</IonItem>
							</IonList>
						</div>
						<div className="flex-min">
							<Spacer/>
							<IonButton disabled={ !formValid } expand="block" color="primary" onClick={ this.save }>{ __('Save Address & Continue')}</IonButton>
						</div>
					</div>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { profile, auth } = state.profile
	const { deliveryAddress } = state.orders
	return {
		profile,
		auth,
		deliveryAddress,
		isLoggedIn: profile.auth && profile.auth.loggedIn
	}
}

export default connect(stateToProps)(withTranslation(DeliveryAddressAdd))
