import React from 'react'
import { withRouter } from 'react-router'
import { IonGrid, IonRow, IonCol, IonIcon } from '@ionic/react'
import { helpCircleOutline } from 'ionicons/icons'
import { connect } from 'react-redux'
import { withTranslation } from '../../lib/translate'
import { validateProfileData } from '../../lib/utils'
import { SmallText } from '../common'
import { setModal } from '../../store/actions'
import { getConfig } from '../../appConfig'
import './index.css'

const check = require('../../assets/images/Deli_Check.svg')

const ValidateButton = ({ __, dispatch, profile, auth }) => {
	const isAuth = auth.loggedIn
	const valid = validateProfileData(profile).isValid
	if (!getConfig().appType.hasEmailValidationEnabled) {
		return null
	}
	return (
		<>
			{
				isAuth && !valid ?
					<>
						<IonGrid className="validate-button-wrapper bottom unverified">
							<IonRow onClick={ () => dispatch(setModal('isVerfiedModalOpen', true)) }>
								<IonCol className="mixed-right"><SmallText>{ __('Not Verified') }</SmallText></IonCol>
								<IonCol className="mixed-left"><div style={{ display: 'flex' }}><IonIcon slot="icon-only" icon={ helpCircleOutline } /></div></IonCol>
							</IonRow>
						</IonGrid>
					</>
					: isAuth && valid ?
						<IonGrid className="validate-button-wrapper">
							<IonRow>
								<IonCol className="mixed-right"><div style={{ display: 'flex' }}><IonIcon slot="icon-only" icon={ check } /></div></IonCol>
								<IonCol className="verified-right"><SmallText color="dark">{ __('Account Verified') }</SmallText></IonCol>
							</IonRow>
						</IonGrid>
						:
						null
			}
		</>
	)
}

const stateToProps = store => {
	const { isVerfiedModalOpen, profile, auth } = store.profile
	return {
		isVerfiedModalOpen,
		profile,
		auth
	}
}

export default connect(stateToProps)(withRouter(withTranslation(ValidateButton)))
