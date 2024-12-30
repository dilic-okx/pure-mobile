import React from 'react'
import QRCode from 'qrcode-react'
import ValidateButton from '../../components/validateButton'
import { withTranslation } from '../../lib/translate'
import { isDefined, validateProfileData } from '../../lib/utils'
import { getConfig } from '../../appConfig'
import { SmallText, Spacer } from '../../components/common'

const Scan = ({ __, qr_code, profile }) => {
	const valid = validateProfileData(profile).isValid
	return (
		<>
			<div className="loyalty-content scan padded scrollable-y">
				<div>
					<div className="signature okx-font-tertiary-variant no-margin">{ profile.first_name + ' ' + profile.last_name }</div>
				</div>
				{ isDefined(qr_code) ?
					<div className="qr-holder">
						<QRCode value={ qr_code } size={ 150 } />
					</div>
					:
					<>
					<Spacer/>
					<div className="noQrCode"><h5>{ __('NO QR CODE')}</h5></div>
					</>
				}
				<ValidateButton />
				{ !valid && getConfig().appType.hasEmailValidationEnabled ?
					<div className="verified-content">
						<SmallText color="grey">{ __('You can earn, but not redeem points until your account is verified')}</SmallText>
					</div> : null
				}
			</div>
		</>
	)
}

export default withTranslation(Scan)
