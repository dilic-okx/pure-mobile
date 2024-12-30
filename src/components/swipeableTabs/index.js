import React, { Component } from 'react'
import { IonSegment, IonContent, IonSegmentButton, IonLabel, IonSlides, IonSlide, IonIcon } from '@ionic/react'
import { isDefined } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import './index.css'

class SwipableTabs extends Component {
	constructor(props) {
		super(props)
		const { defaultTab } = this.props
		this.state = {
			selectedTab: defaultTab || 0
		}
	}

	componentDidMount() {
		this.segment = document.querySelector('ion-segment')
		this.slides = document.querySelector('ion-slides')

		this.segment.addEventListener('ionChange', ev => this.onSegmentChange(ev))
		this.slides.addEventListener('ionSlideDidChange', ev => this.onSlideDidChange(ev))

		if (this.props.history && this.props.history.state && this.props.history.state.tab === 'order') {
			this.segmentChanged(1)
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.history && prevProps.history.state !== this.props.history.state) {
			// fix: redirect to the scan tab if user is located in 'loyalty' page but on the first tab
			// and that he clicks on scan icon in header
			if (this.props.history && this.props.history.state && this.props.history.state.tab === 'scan') {
				this.segmentChanged(1)
			} else if (this.props.history && this.props.history.state && this.props.history.state.tab === 'points') {
				this.segmentChanged(0)
			} else if (this.props.history && this.props.history.state && this.props.history.state.tab === 'loyalty') {
				this.segmentChanged(0)
			}
		}
	}

	segmentChanged = value => {
		this.setState({ selectedTab: value })
	}

	// On Segment change slide to the matching slide
	onSegmentChange = ev => {
		this.slideTo(ev.detail.value)
	}

	slideTo = index => {
		this.slides.slideTo(index)
	}

	// On Slide change update segment to the matching value
	onSlideDidChange = async () => {
		const index = await this.slides.getActiveIndex()
		this.clickSegment(index)
	}

	clickSegment = index => {
		this.segment.value = index
	}

	render() {
		const { selectedTab } = this.state
		const { available_balance, __, displayFooter, displayFooterTab } = this.props
		const tabs = this.props.tabs || []

		return (
			<div className="tabs">
				<div className="segment-holder">
					<IonSegment onIonChange={ e => this.segmentChanged(e.detail.value) } value={ selectedTab } mode="md">
						{ tabs.map((tab, index) => {
							const { label, icon } = tab
							return (
								<IonSegmentButton key={ index + '_segment' } value={ index }>
									{ isDefined(icon) ? <IonIcon name={ icon }></IonIcon> : null }
									<IonLabel>{ label || '' }</IonLabel>
								</IonSegmentButton>
							)
						})}
					</IonSegment>
				</div>
				<IonSlides options={{ initialSlide: selectedTab }}>
					{ tabs.map((tab, index) => {
						return (
							<IonSlide key={ index + 'slide' } class={ 'slide-' + (index + 1) }>
								<IonContent scrollY = { (isDefined(tab.canScroll) ? tab.canScroll : true) }>
									{ tab.tabContent || null }
								</IonContent>
							</IonSlide>
						)
					})}
				</IonSlides>
				{
					displayFooter && displayFooter === 'balance' && isDefined(displayFooterTab) && displayFooterTab + '' === selectedTab + '' ?
						<div className="loyalty-bar">
							<div>
								<div className="flex-col-wrapper flex-align-center flex-justify-start">
									<div className="righted">
										<div className="loyalty-badge"/>
									</div>
									<div>
										<IonLabel color="dark">{ __('Loyalty Balance')}</IonLabel>
									</div>
								</div>
							</div>
							<div>
								<IonLabel color="dark" className="loyalty-balance">{available_balance} {__('Points')}</IonLabel>
							</div>
						</div>
						: null
				}
			</div>
		)
	}
}

export default withTranslation(SwipableTabs)
