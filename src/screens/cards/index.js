import React from 'react'
import { IonList, IonItem, IonRadioGroup, IonRadio, IonLabel, IonNote, IonButtons, IonButton, IonAlert } from '@ionic/react'
import Loading from '../../components/spinner'
import Layout from '../../components/layout'
import { Title, Sectiontitle, SmallText, Spacer } from '../../components/common'
import { withTranslation } from '../../lib/translate'
import { updateProfile, removePaymentCard } from '../../store/actions'
import { connect } from 'react-redux'
import { isDefined, forwardTo, goBack } from '../../lib/utils'
import './index.css'

class Cards extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			removeCardAlert: null,
			selectPaymentCard: this.props.profile.cardToken || null
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.profile.cardToken !== this.props.profile.cardToken) {
			this.setState({ selectPaymentCard: this.props.profile.cardToken })
		}
	}

	changeDefaultPaymentCard = event => this.setState({ selectPaymentCard: event.detail.value }, () => {
		this.props.dispatch(updateProfile({ cardToken: event.detail.value }, true))
	})

	removePaymentCard = () => {
		const { __ } = this.props
		this.props.dispatch(removePaymentCard(
			this.state.removeCardAlert,
			{ __, cb: () => this.setState({ removeCardAlert: null }) }
		))
	}

	handleRemoveCardAlert = cardId => this.setState({ removeCardAlert: cardId })

	backHandler = () => {
		if (this.props.location && this.props.location.state && this.props.location.state.addCardFromAccount) {
			forwardTo('/account', { addCardFromAccount: true })
		} else {
			goBack()
		}
	}

	render () {
		const { __, cards } = this.props
		const { removeCardAlert } = this.state

		return (
			<Loading transparent>
				<Layout color="white" headerTitle={ __('My Payment Card') } backHandler={this.backHandler}>
					<div className="flex-row-wrapper absolute-content">
						<div className="scrollable-y">
							<Title>{ __('My Payment Card')}</Title>
							<SmallText>{ __('Manage your default payment card')}</SmallText>
							<Spacer size={ 3 }/>
							<IonList lines="none">
								<IonRadioGroup onIonChange={ this.changeDefaultPaymentCard } value={ this.state.selectPaymentCard }>
									{ cards.length > 0 ?cards.map(card => {
										const { id, last4, brand, exp_month, exp_year, name } = card
										return (
											<IonItem key={ id }>
												<IonLabel className="ion-text-wrap">
													<Sectiontitle className="single-item">{ name }</Sectiontitle>
													<Sectiontitle className="no-margin">**** **** **** { last4 }</Sectiontitle>
													<IonNote>{ __(brand) } - { exp_month }/{ exp_year }</IonNote>
												</IonLabel>
												<IonRadio
													slot="start"
													value={ id }
												/>
												<IonButtons slot="end">
													<IonButton onClick={ () => this.handleRemoveCardAlert(id) } className="link">{ __('Delete') }</IonButton>
												</IonButtons>
											</IonItem>
										)
									}) :
										<IonItem lines="none">
											<div className="sectiontitle" style={{ width: '100vh', textAlign: 'center' }}>{ __('No payment cards') }</div>
										</IonItem>
									}
								</IonRadioGroup>
							</IonList>
							<IonButton fill="clear" className="link underlined" color="dark" onClick={() => forwardTo('/card-add', { ...this.props.location && this.props.location.state ? this.props.location.state : {}})}>{ __((cards.length > 0 ? 'Or add another' : 'Add') + ' payment card')}</IonButton>
						</div>
						{/*<div className="flex-min">
							<IonButton onClick={ () => forwardTo('/card-add', { ...this.props.location && this.props.location.state ? this.props.location.state : {}}) } expand="block">{ __('Add Payment Card') }</IonButton>
						</div>*/}
					</div>
				</Layout>
				<IonAlert
					isOpen={ isDefined(removeCardAlert) }
					onDidDismiss={ () => this.handleRemoveCardAlert(null) }
					header={ __('Confirm') }
					message={ __('Do you you want to remove this card?') }
					buttons={[
						{
							text: __('Cancel'),
							role: 'cancel',
							cssClass: 'secondary'
						},
						{
							text: __('Remove'),
							handler: () => this.removePaymentCard()
						}
					]}
				/>
			</Loading>
		)
	}
}

const mapStateToProps = store => {
	return {
		cards: store.orders.cards || [],
		profile: store.profile.profile || {}
	}
}

export default connect(mapStateToProps)(withTranslation(Cards))
