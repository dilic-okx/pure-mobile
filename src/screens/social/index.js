import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IonIcon, IonGrid, IonCol, IonRow, IonRippleEffect } from '@ionic/react'
import { logoTwitter, logoFacebook,	logoLinkedin, logoInstagram, globe } from 'ionicons/icons'
import { getSocials } from '../../store/actions'
import Layout from '../../components/layout'
import Loading from '../../components/spinner'
import { Title, SmallText, Spacer } from '../../components/common'
import NoData from '../../components/noData'
import { ucWords, isDefined, isEmptyObject } from '../../lib/utils'
import { withTranslation } from '../../lib/translate'
import './index.css'

const openExternalLink = url => window.open(url, '_system', 'location=yes')

class Social extends Component {
	componentDidMount() {
		this.props.dispatch(getSocials())
	}

	parseSocialItem(key = '', value = '') {
		let label = key
		let icon = key
		let link = value
		switch (key) {
		case 'facebook':
			icon = logoFacebook
			break
		case 'twitter':
			icon = logoTwitter
			break
		case 'instagram':
			icon = logoInstagram
			break
		case 'linkedin':
			icon = logoLinkedin
			break
		default:
			icon = globe
			break
		}
		return {
			link,
			icon,
			label
		}
	}

	render() {
		const { __, social } = this.props
		return (
			<Loading>
				<Layout color="white" headerTitle={ __('Social Media')}>
					<div className="header-wrapper">
						<Title>{ __('Social Media')}</Title>
						<SmallText>{ __('Follow us on our social channels to stay up to date with all things Pure')}</SmallText>
					</div>
					<Spacer size={ 2 }/>
					<div className="frm-wrapper">
						{ isDefined(social) && !isEmptyObject(social) ?
							<IonGrid className="no-padding social">
								<IonRow>
									{ Object.keys(social || {}).map((key, index) => {
										const value = social[key]
										const { link, icon, label } = this.parseSocialItem(key, value)
										const capitalizeLabel = ucWords(label)
										return <IonCol key={ 'soc-item-' + index } size="4">
											<div className="square ion-activatable" onClick={() => openExternalLink(link)}>
												<div className="content">
													<div className="soc-icon">
														<IonIcon icon={ icon } color="white" />
													</div>
												</div>
												<IonRippleEffect></IonRippleEffect>
											</div>
											<SmallText color="gray" className="soc-label centered okx-font-secondary">{ __(capitalizeLabel)}</SmallText>
										</IonCol>
									})}
								</IonRow>
							</IonGrid>
							:
							<NoData label={ __('No social networks') }/>
						}
					</div>
				</Layout>
			</Loading>
		)
	}
}

const stateToProps = state => {
	const { social } = state.common
	return {
		social
	}
}

export default connect(stateToProps)(withTranslation(Social))
