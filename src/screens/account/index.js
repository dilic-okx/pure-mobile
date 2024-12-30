import { Plugins, CameraResultType, CameraSource, Capacitor } from '@capacitor/core'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IonButton, IonItem, IonLabel,	IonInput, IonList, IonCheckbox,	IonNote, IonAlert, IonAvatar, IonIcon } from '@ionic/react'
import S3 from 'aws-s3'
import { getConfig } from '../../appConfig'
import Layout from '../../components/layout'
import { AltTitle, NormalText, SmallText, Spacer, FieldError } from '../../components/common'
import { validateForm, isDefined, forwardTo, goBack } from '../../lib/utils'
import moment from '../../lib/moment'
import { withTranslation } from '../../lib/translate'
import { updateProfile, setModal, loading } from '../../store/actions'
import { beforeShowTimePicker, beforeCloseTimePicker } from '../../store/actions'
import ValidateButton from '../../components/validateButton'
import Loading from '../../components/spinner'
import './index.css'
import defaultImg from '../../assets/images/gray-avatar.png'
import Mobiscroll from '../../components/mobiscroll'
import * as icons from 'ionicons/icons'

const { Camera } = Plugins
const { configS3 } = getConfig()
const S3Client = new S3(configS3)
const { DatePicker, SelectOption } = Mobiscroll
const camera = require('../../assets/images/camera-icon.svg')

class Account extends Component {
	constructor(props) {
		super(props)
		this.state = {
			first_name: this.props.profile.first_name || '',
			last_name: this.props.profile.last_name || '',
			email: this.props.profile.email || '',
			mobile: this.props.profile.mobile || '',
			birthday: this.props.profile.birthday ? this.props.profile.birthday : '',
			profile_image_url: this.props.profile.profile_image_url || defaultImg,
			imageFile: null,
			is_subscribed: this.props.profile.is_subscribed || false,
			formErrors: {},
			deleteAvatarImageAlert: false,
			locale: this.props.profile.locale || getConfig().localization.defaultLocale
		}
		this.handleInput = this.handleInput.bind(this)
		this.handleSave = this.handleSave.bind(this)
		this.formConfig = {
			email: { type: 'email', required: false },
			mobile: { type: 'tel', required: false },
			locale: { type: 'text', required: false }
		}
		this.triggerInputFile = this.triggerInputFile.bind(this)
		this.inputRef = React.createRef()
		this.onChangeFile = this.onChangeFile.bind(this)
	}

	componentDidUpdate(prevProps) {
		if (this.props.profile.first_name !== prevProps.profile.first_name ) {
			this.setState({ first_name: this.props.profile.first_name })
		}
		if (this.props.profile.last_name !== prevProps.profile.last_name) {
			this.setState({ last_name: this.props.profile.last_name })
		}
		if (this.props.profile.email !== prevProps.profile.email) {
			this.setState({ email: this.props.profile.email })
		}
		if (this.props.profile.mobile !== prevProps.profile.mobile) {
			this.setState({ mobile: this.props.profile.mobile })
		}
		if (this.props.profile.birthday !== prevProps.profile.birthday) {
			this.setState({ birthday: this.props.profile.birthday ? this.props.profile.birthday : '' })
		}
		if (this.props.profile.locale !== prevProps.profile.locale) {
			this.setState({ locale: this.props.profile.locale || getConfig().localization.defaultLocale })
		}
		if (this.props.profile.profile_image_url !== prevProps.profile.profile_image_url) {
			if (this.props.profile.profile_image_url) {
				this.setState({ profile_image_url: this.props.profile.profile_image_url })
			} else {
				this.setState({ profile_image_url: defaultImg })
			}
		}
		if (this.props.profile.is_subscribed !== prevProps.profile.is_subscribed) {
			this.setState({ is_subscribed: this.props.profile.is_subscribed })
		}
	}

	handleInput = (key, val) => {
		this.setState({ [key]: val })
		this.props.dispatch(beforeCloseTimePicker())
	}

	handleLanguageInput = (event, data) => {
		this.setState({ locale: data.getVal() })
	}

	async takePicture() {
		if (Capacitor.platform !== 'web') {
			await Camera.getPhoto({
				quality: 50,
				allowEditing: false,
				resultType: CameraResultType.DataUrl,
				source: CameraSource.Prompt
			}).then(imageData => {
				this.setState({
					imageFile: imageData.dataUrl,
					extension: imageData.format,
					profile_image_url: imageData.dataUrl
				})
			})
		}
	}

	getMimeType = extension => {
		switch (extension) {
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg'
		case 'png':
			return 'image/png'
		case 'gif':
			return 'image/gif'
		default:
			return undefined
		}
	}

	handleSave () {
		let formErrors = validateForm(this.formConfig, this.state)
		this.setState({ formErrors })
		if (Object.keys(formErrors).length === 0) {
			const { first_name, last_name, email, mobile, birthday, profile_image_url, imageFile, is_subscribed, locale } = this.state
			const profile = {
				first_name: first_name,
				last_name: last_name,
				email: email,
				mobile: mobile,
				birthday: birthday,
				profile_image_url: !this.props.profile.profile_image_url ? null : profile_image_url,
				is_subscribed,
				locale
			}

			if (!isDefined(imageFile)) {
				this.props.dispatch(updateProfile(profile))
			} else {
				const imageName = configS3.imageNamePrefix + this.props.profile.id //+ '.' + this.state.extension
				this.props.dispatch(loading(true))
				fetch(this.state.profile_image_url).then(res => res.blob()).then(blob => {
					const file = new window.File([blob], imageName, { type: this.getMimeType(this.state.extension) })
					S3Client.uploadFile(file, imageName).then(data => {
						profile.profile_image_url = data.location
						this.props.dispatch(updateProfile(profile))
						this.setState({ imageFile: null })
						this.props.dispatch(loading(false))
					}).catch(() => {
						this.props.dispatch(loading(false))
					})
				})
			}
		}
	}

	removeProfileImage = () => {
		const { profile } = this.props
		const profile_image_url = profile.profile_image_url
		this.handleAvatarDeleteAlert(false)
		if (profile_image_url) {
			let imageName = profile_image_url.split('/')
			if (imageName.length > 0) {
				imageName = imageName[imageName.length - 1]
				this.props.dispatch(updateProfile({ profile_image_url: null }))
				this.setState({ imageFile: null })
			}
		}
	}

	triggerInputFile () {
		if (Capacitor.platform === 'web') {
			if (this.inputRef) {
				this.inputRef.current.click()
			}
		} else {
			this.takePicture()
		}
	}

	onChangeFile(event) {
		event.stopPropagation()
		event.preventDefault()
		const imageFile = event.target.files[0]
		let reader = new window.FileReader()
		reader.readAsDataURL(imageFile)
		let extension = imageFile.name.split('.').pop()
		reader.onloadend = () => {
			this.setState({
				imageFile,
				profile_image_url: reader.result,
				extension
			})
		}
	}

	handleAvatarDeleteAlert = (flag = true) => this.setState({ deleteAvatarImageAlert: flag })

	handlePeriodicalSaga = flag => {
		const { dispatch } = this.props
		dispatch({ type: 'SET_COMMON_PROP', key: 'emitterFlag', value: flag })
	}

	formatDataForSelect = (langs) => {
		let arrForSelect = []
		Object.keys(langs).forEach(key => {
			arrForSelect.push({ text: langs[key], value: key })
		})
		return [{ text: '', value: null }, ...arrForSelect]
	}

	backHandler = () => {
		if (this.props.location && this.props.location.state && this.props.location.state.addCardFromAccount) {
			forwardTo('/dashboard')
		} else {
			goBack()
		}
	}

	render() {
		const { __, isProfileModalOpen, history, profile, isShowTimePicker } = this.props
		const { first_name, last_name, email, mobile, birthday, formErrors, profile_image_url, is_subscribed, deleteAvatarImageAlert, locale } = this.state
		// const dateFormat = moment()._locale._longDateFormat.L
		const languages = Object.keys(getConfig().localization.supportedLocales)
		const newClass = isShowTimePicker ? 'red' : 'gray'
		const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
		const defaultDateValue = moment().subtract(18, 'years')
		return (
			<Loading transparent>
				<Layout color="white" headerTitle="My Account" backHandler={this.backHandler}>
					<div className="avatar-image-wrapper">
						<div className="avatar-circle">
							<IonAvatar className="profile-image-content" >
								{ profile.profile_image_url || profile_image_url ? <img alt="" src={ profile_image_url + (profile_image_url.indexOf('http') !== -1 ? '?' + Date.now() : '') } /> : null }
								<div className="avatar-photo" onClick={ this.triggerInputFile }>
									<IonIcon icon={ camera } size="small" color="dark" />
								</div>
							</IonAvatar>
						</div>
						{ profile.profile_image_url ?
							<div className="avatar-delete">
								<IonIcon icon={ icons.closeCircle } size='large' color='danger' onClick={ () => this.handleAvatarDeleteAlert(true) }/>
							</div>
							: null }
					</div>
					<ValidateButton/>
					<input type="file" className="input-avatar" ref={ this.inputRef } onChange={ e => this.onChangeFile(e) }/>
					<Spacer/>
					<AltTitle className="okx-font-tertiary-variant">{ __('My Account')}</AltTitle>
					<SmallText>{ __('Manage your account and payment cards')}</SmallText>
					<Spacer/>
					<div className="frm-wrapper">
						<IonList>
							<IonItem lines="none">
								<IonLabel position="floating">{ __('First Name') }</IonLabel>
								<IonInput onIonChange={ e => this.handleInput('first_name', e.target.value) } clearInput required={ true } type="text" pattern="text" inputmode="text" value={ first_name }>
								</IonInput>
							</IonItem>
							<IonItem lines="none">
								<IonLabel position="floating">{ __('Last Name') }</IonLabel>
								<IonInput onIonChange={ e => this.handleInput('last_name', e.target.value) } clearInput required={ true } type="text" pattern="text" inputmode="text" value={ last_name }>
								</IonInput>
							</IonItem>
							<IonItem lines="none">
								<IonLabel position="floating">{ __('Email') }</IonLabel>
								<IonInput onIonChange={ e => this.handleInput('email', e.target.value) } clearInput required={ true } type="email" pattern="email" inputmode="email" value={ email }></IonInput>
								{ formErrors.email ? <FieldError className="field-error" value={ __(formErrors.email) } /> : null}
							</IonItem>
							<IonItem lines="none">
								<IonLabel position="floating">{ __('Mobile Number') }</IonLabel>
								<IonInput onIonChange={ e => this.handleInput('mobile', e.target.value) } clearInput required={ false } type="tel" pattern="tel" inputmode="tel" value={ mobile }>
								</IonInput>
								{formErrors.mobile ? <FieldError className="field-error" value={ __(formErrors.mobile) } /> : null}
							</IonItem>
							{/* <IonItem lines="none">
							<IonLabel position="floating">{ __('Date of Birth') }</IonLabel>
							<IonDatetime onIonChange={(e) => this.handleInput('birthday', e.target.value)} clearInput required={ true } displayFormat={ dateFormat } value={ birthday }></IonDatetime>
						</IonItem> */}
							<div className="date-picker-wrapper">
								<label className={`date-picker-label date-picker-label--${newClass}`} htmlFor="demo-non-form">{ __('Date of Birth') }</label>
								<DatePicker
									className="data-picker-input"
									display="bottom"
									setText={__('Done')}
									cancelText = {__('Cancel')}
									lang = {profile.locale}
									defaultValue={defaultDateValue}
									max={yesterday}
									value={ birthday }
									onSet={(e, a) => this.handleInput('birthday', a.element.value)}
									dateFormat="dd-mm-yy"
									onBeforeShow={ () => { this.props.dispatch(beforeShowTimePicker()) }}
									onClose={ () => {
										this.props.dispatch(beforeCloseTimePicker())
										this.handlePeriodicalSaga(true)
									}}
									onShow={ () => this.handlePeriodicalSaga(false) }
								/>
							</div>
							{languages.length <= 1 ? null :
								<>
									<label className={`select-picker-label select-picker-label--${newClass}`} htmlFor="demo-non-form">{ __('Language Preference')}</label>
									<SelectOption
										display="center"
										onSet={(e, a) => this.handleLanguageInput(e, a)}
										data={ this.formatDataForSelect(getConfig().localization.supportedLocales) }
										label="Location"
										value={ locale }
										inputStyle="box"
										placeholder={ __('Select one') }
										cancelText = {__('Cancel')}
										setText={__('OK')}
										disabled={ this.props.isShowTimePicker ? true : false }
										onClose={ () => { this.handlePeriodicalSaga(true) }}
										onShow={ () => this.handlePeriodicalSaga(false) }
									/>
								</>
							}
							<Spacer/>
							<NormalText>{ __('Communication Preferences') }</NormalText>
							<IonItem lines="none">
								<IonCheckbox color="primary" slot="start" checked={ is_subscribed } onIonChange={ e => this.handleInput('is_subscribed', e.detail.checked) } />
								<IonLabel className="ion-text-wrap">
									<IonNote>{ __('I would like to receive') + ' ' + __('updates and offers via email') }</IonNote>
								</IonLabel>
							</IonItem>
						</IonList>
					</div>

					<div className="top-medium">
						<IonButton expand="block" color="primary" onClick={ () => this.handleSave() }>{ __('Save') }</IonButton>
						<IonButton color="black" expand="block" fill="outline" onClick={ () => history.push('/cards', { addCardFromAccount: true }) }>{ __('Manage My Payment Cards') }</IonButton>
					</div>
				</Layout>
				<IonAlert
					isOpen={ isProfileModalOpen }
					onDidDismiss={ () => this.props.dispatch(setModal('isProfileModalOpen', false)) }
					header={ __('Success') }
					message={ __('Profile is updated.') }
					buttons={[
						{
							text: __('Close'),
							role: 'cancel',
							cssClass: 'secondary',
							handler: () => this.props.dispatch(setModal('isProfileModalOpen', false))
						}
					]}
				/>
				<IonAlert
					isOpen={ deleteAvatarImageAlert }
					onDidDismiss={ () => this.handleAvatarDeleteAlert(false) }
					header={ __('Remove') }
					message={ __('Do you want to remove profile image.') }
					buttons={[
						{
							text: __('Close'),
							role: 'cancel',
							cssClass: 'secondary',
							handler: () => this.handleAvatarDeleteAlert(false)
						},
						{
							text: __('Remove'),
							handler: () => this.removeProfileImage()
						}
					]}
				/>
			</Loading>
		)
	}
}

const stateToProps = (state) => {
	const { auth, profile, isProfileModalOpen } = state.profile
	const { isShowTimePicker } = state.restaurants
	return {
		auth,
		profile,
		isProfileModalOpen,
		isShowTimePicker
	}
}

export default connect(stateToProps)(withTranslation(Account))
