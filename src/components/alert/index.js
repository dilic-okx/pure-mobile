import React from 'react'
import { IonAlert } from '@ionic/react'
import { withTranslation } from '../../lib/translate'

class Alert extends React.Component {

	render() {
		const { showAlert, closeAlert, type, clearBasket, removeAppliedVoucher, __ } = this.props
		if (type && type === 'select') {
			return (
				<IonAlert
					isOpen={showAlert}
					// onDidDismiss={() => !!showAlert }
					header={__('Are you sure') + '?'}
					message={__('You have item(s) in your basket. Starting a new order will clear your order. Are you sure you wish to continue?')}
					buttons={[
						{
							text: __('No'),
							role: 'cancel',
							cssClass: 'secondary',
							handler: () => {
								closeAlert()
							}
						},
						{
							text: __('OK'),
							handler: () => {
								clearBasket()
							}
						}
					]}
				/>
			)
		} else if (type && type === 'voucher') {
			return (
				<IonAlert
					isOpen={showAlert}
					onDidDismiss={() => { closeAlert() }}
					header={__('Remove Voucher')}
					message={__('Remove from your basket')}
					buttons={[
						{
							text: __('No'),
							role: 'cancel',
							cssClass: 'secondary',
							handler: () => {
								closeAlert()
							}
						},
						{
							text: __('OK'),
							handler: () => {
								removeAppliedVoucher()
							}
						}
					]}
				/>
			)
		} else {
			return (
				<IonAlert
					isOpen={showAlert}
					onDidDismiss={() => { closeAlert() }}
					header={__('Alert')}
					message={__('Action required: Select Base')}
					buttons={['OK']}
				/>
			)
		}
	}
}

export default withTranslation(Alert)
