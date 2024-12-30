import React from 'react'
import { connect } from 'react-redux'
import { IonButton,	IonTextarea, IonIcon, IonItem, IonLabel, IonList, IonRadioGroup, IonRadio, IonAlert } from '@ionic/react'
import { withRouter } from 'react-router'
import { starOutline, star } from 'ionicons/icons'
import Layout from '../../components/layout'
import Loading from '../../components/spinner'
import { sendFeedback, setCommonModal } from '../../store/actions'
import { FieldError, Title, StrongText, SmallText, FlexSpacer, Spacer } from '../../components/common'
import { validateForm, isDefined } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import Mobiscroll from '../../components/mobiscroll'
import './index.css'

const { SelectOption } = Mobiscroll

class Feedback extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			...this.resetState()
		}
		this.formConfig = {
			food: { type: 'integer', required: true, invalidValue: 0 },
			service: { type: 'integer', required: true, invalidValue: 0 },
			selectedRestaurant: { type: 'select', required: true, invalidValue: null }
		}
	}

	resetState = () => ({
		food: 0,
		service: 0,
		customerService: true,
		techSupport: false,
		commentService: '',
		commentTech: '',
		radioGroup: 'customerService',
		selectedRestaurant: null,
		formErrors: {}
	})

	createStarSet(size, name) {
		return (
			<>
				{
					[...Array(size).keys()].map(i => this.createStar(name, i + 1))
				}
			</>
		)
	}

	createStar = (name, value) => {
		if (this.state[name] >= value) {
			return <IonIcon key={ value } icon={ star } className="star" color="warning" onClick={ () => this.setValue(name, value) } />
		} else {
			return <IonIcon key={ value } icon={ starOutline } className="star" color="medium" onClick={ () => this.setValue(name, value) } />
		}
	}

	handleFeedback = () => {
		let formErrors = validateForm(this.formConfig, this.state)
		this.setState({ formErrors })
		if (Object.keys(formErrors).length === 0) {
			const { food, service, commentService, commentTech, selectedRestaurant, techSupport, customerService } = this.state
			const feedback = {
				food,
				service,
				commentService,
				commentTech,
				selectedRestaurant,
				techSupport,
				customerService
			}
			this.props.dispatch(sendFeedback(feedback))
			// reset state
			this.setState({ ...this.resetState() })
		}
	}

	selectRestaurant = (event, data) => {
		const selectedRestaurantId = data.getVal()
		this.setState({ selectedRestaurant: selectedRestaurantId })
		if (selectedRestaurantId !== null) {
			let formErrors = { ...this.state.formErrors }
			formErrors.selectedRestaurant = null
			this.setState({ formErrors })
		}
	}

	setValue(field, value) {
		if ([ 'customerService', 'techSupport' ].indexOf(field) !== -1) {
			const decheckedKey = field === 'customerService' ? 'techSupport' : 'customerService'
			this.setState({ [field]: value, [decheckedKey]: false })
		} else {
			this.setState({ [field]: value })
		}
	}

	formatDataForSelect = (stores) => {
		const { __ } = this.props
		let arrForSelect = []
		stores.forEach((store) => {
			if (isDefined(store.can_collection_order) && isDefined(store.is_published)) {
				if (store.can_collection_order && store.is_published) {
					arrForSelect.push({ text: store.name, value: store.id })
				}
			}
		})
		return [{ text: __('Select Shop'), value: null }, ...arrForSelect]
	}

	handleChange = (event) => {
		this.setValue(event.detail.value, true)
		this.setState({
			radioGroup: event.detail.value
		})
	}

	render() {
		const { __, isFeedbackModalOpen, restaurants } = this.props
		const { techSupport, commentService, commentTech, formErrors } = this.state
		const stores = restaurants.sort((a, b) => {
			if (isDefined(a.name) && isDefined(b.name)) {
				if (a.name < b.name) { return -1 }
				if (a.name > b.name) { return 1 }
				return 0
			}
			return 0
		})


		return (
			<Loading transparent>
				<Layout headerTitle={ __('Feedback')}>
					<div className="heading-wrapper">
					<Title>{ __('Feedback')}</Title>
					<SmallText>{ __('We\'ve fed you - now it\'s time for feedback! Let us know what you thought of your experience today')}</SmallText>
					{/* <IonItem>
						<IonLabel color="dark" position="floating">{ __('Location') }</IonLabel>
						<IonSelect onIonChange={ this.selectRestaurant } placeholder={ __('Select Restaurant') }>
							{ stores.map(restaurant => {
								const { id, name } = restaurant
								return (
								<IonSelectOption key={ 'store-option-' + id } value={ id }>{ name }</IonSelectOption>
							)})}
						</IonSelect>
					</IonItem> */}
					</div>
					<br />
					<div className="frm-wrapper">
						<div className="flex-col-wrapper flex-align-center bordered-bottom">
							<div className="flex-min">
								<StrongText>{ __('Location')}</StrongText>
							</div>
							<FlexSpacer size={ 20 }/>

							<div>
								<SelectOption
									display="center"
									onSet={ (e, a) => this.selectRestaurant(e, a) }
									data={ this.formatDataForSelect(stores) }
									label="Location"
									value={ this.state.selectedRestaurant }
									inputStyle="box"
									placeholder={ __('Select Restaurant')}
									setText={ __('OK') }
									cancelText = { __('Cancel')}/>
							</div>
						</div>
					{ formErrors.selectedRestaurant ? <FieldError className="field-error pad10" value={ __(formErrors.selectedRestaurant)} /> : null }
					<div className="box-holder box-holder-top no-padding">
						<IonList lines="none">
							<IonRadioGroup onIonChange={ event => this.handleChange(event)} value={ this.state.radioGroup }>
								<IonItem lines="full">
									<IonLabel>
										<h2><strong>{ __('Customer Service')}</strong></h2>
										<SmallText>{ __('Any comments related to your visit')}</SmallText>
									</IonLabel>
									<IonRadio slot="start" color="primary" className="margined-left margined-right" value={ 'customerService' } />
								</IonItem>
								<IonItem>
									<IonLabel>
										<h2><strong>{ __('Tech Support')}</strong></h2>
										<SmallText>{ __('Any technical comments related to our app')}</SmallText>
									</IonLabel>
									<IonRadio slot="start" color="primary" className="margined-left margined-right" value={ 'techSupport' } />
								</IonItem>
							</IonRadioGroup>
						</IonList>
					</div>
					{techSupport ?
						<div>
							<br />
							<div><StrongText>{ __('Additional Comments')}</StrongText></div>
							<div className="commentTech">
								<IonTextarea className="no-padding" value={ commentTech } onIonChange={ event => this.setValue('commentTech', event.detail.value)}></IonTextarea>
							</div>
						</div>
						:
						<>
							<div className="box-holder box-holder-top no-padding">
								<div className="stars-row bordered-bottom">
									<div className="flex-col-wrapper flex-align-center">
										<div><StrongText>{ __('Rate Our Food')}</StrongText></div>
										<div className="righted">
											{ this.createStarSet(5, 'food')}
										</div>
									</div>
									{ this.state.formErrors.food ? (
									<FieldError className="field-error pad5l" value={ __(this.state.formErrors.food)} />
									) : null }
								</div>
								<div className="stars-row">
									<div className="flex-col-wrapper flex-align-center">
										<div><StrongText>{ __('Rate Our Service')}</StrongText></div>
										<div className="righted">
											{ this.createStarSet(5, 'service')}
										</div>
									</div>
									{ this.state.formErrors.service ? (
									<FieldError className="field-error pad5l" value={ __(this.state.formErrors.service)} />
									) : null }
								</div>
							</div>
							<br />
							<div><StrongText>{ __('Additional Comments')}</StrongText></div>
							<div className="commentService">
								<IonTextarea value={ commentService } onIonChange={ event => this.setValue('commentService', event.detail.value)}></IonTextarea>
							</div>
						</>
					}
					</div>
					<br/>
					<div className="action-wrapper">
						<div className="separator"/>
						<Spacer/>
						<IonButton expand="block" color="primary" onClick={ this.handleFeedback }>{ __('Submit')}</IonButton>
					</div>
				</Layout>
				<IonAlert
					isOpen={ isFeedbackModalOpen }
					onDidDismiss={() => this.props.dispatch(setCommonModal('isFeedbackModalOpen', false))}
					header={ __('Thank you')}
					message={ __('Feedback is processed.')}
					buttons={[
						{
							text: __('OK'),
							role: 'cancel',
							cssClass: 'secondary',
							handler: () => {
								this.props.dispatch(setCommonModal(('isFeedbackModalOpen', false)))
								this.setState({
									food: 0,
									service: 0,
									customerService: true,
									techSupport: false,
									commentService: '',
									commentTech: ''
								})
							}
						}
					]}
				/>
			</Loading>
		)
	}
}
const stateToProps = store => {
	const { appVersion, isFeedbackModalOpen } = store.common
	const { restaurants } = store.restaurants
	return {
		appVersion,
		isFeedbackModalOpen,
		restaurants: restaurants || []
	}
}

export default connect(stateToProps)(withRouter(withTranslation(Feedback)))
