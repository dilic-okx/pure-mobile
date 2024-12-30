import React, { Component } from 'react'
import { withTranslation } from '../../lib/translate'
import Layout from '../../components/layout'
import { IonButton, IonIcon, IonModal, IonInput, IonLabel, IonSelect, IonSelectOption } from '@ionic/react'
import { restaurant, close } from 'ionicons/icons'
import './index.css'

class orderIntro extends Component {
	state = {
		isOpen: false
	}

	toggleModal = (toggle) => {
		this.setState({ isOpen: toggle })
	}

	render() {
		const { isOpen } = this.state
		const { __ } = this.props
		return (
			<Layout noPadding headerTitle={ __('Click & Collect') }>
				<div className='order-intro-wrapper'>
					<div className='order-intro-image-wrapper'>
						Click&amp;Collect
					</div>
					<div className='order-intro-content'>
						<IonButton onClick={ () => this.toggleModal(true) } expand='full'>
							<IonIcon icon={ restaurant } mode='ios' />
							New Order
						</IonButton>
						<p>After completing your order you will be able to collect from the location in <strong>15 minutes</strong></p>
						<p>This service is currently only avaliable for collection to take away.</p>
					</div>
					<IonModal cssClass='order-intro-modal' isOpen={ isOpen }>
						<h2>Collection Details</h2>
						<div className='order-intro-modal-inner'>
							<div>
								<IonLabel position='floating'>Location</IonLabel>
								<IonSelect className='location-select' interface="popover" placeholder="Select Location">
									<IonSelectOption value="one">Location One</IonSelectOption>
									<IonSelectOption value="two">Location Two</IonSelectOption>
									<IonSelectOption value="three">Location Three</IonSelectOption>
									<IonSelectOption value="four">Location Four</IonSelectOption>
								</IonSelect>
							</div>
							<div>
								<IonLabel>
									Pickup Time
								</IonLabel>
								<IonInput className='pickup-time' placeholder='Select pickup time'>
								</IonInput>
								{/* IonPicker to be added instead of IonInput */}
							</div>
						</div>
						<IonButton expand='full'>Next</IonButton>
						<IonIcon onClick={ () => this.toggleModal(false) } icon={ close } slot='end' />
					</IonModal>
				</div>
			</Layout>
		)
	}
}

export default withTranslation(orderIntro)
