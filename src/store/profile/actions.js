import { LOGIN_REQUEST, REGISTER_REQUEST, LOGOUT, GET_PROFILE, UPDATE_PROFILE, SET_MODAL, RESTORE_AUTH, RESET_PASSWORD, SET_PROTECTED_REFERRER, SET_SYS_LOCALE, VALIDATE_EMAIL, SET_REGISTER_FORM, SET_VALIDATE_MODAL, SEND_REFER, SEND_VOUCHER_CODE, GET_VOUCHERS } from './constants'
/**
 * Tells the app we want to log in a user
 * @param { object } data The data we're sending for log in
 * @param { string } data.username The username of the user to log in
 * @param { string } data.password The password of the user to log in
 */
export const loginRequest = data => ({ type: LOGIN_REQUEST, ...data })

/**
 * Tells the app we want to register a user
 * @param { object } data The data we're sending for registration
 * @param { string } data.email The email of the user to register
 * @param { string } data.password The password of the user to register
 */
export const registerRequest = data => ({ type: REGISTER_REQUEST, data })

export const resetPassword = email => ({ type: RESET_PASSWORD, email })

export const getProfile = () => ({ type: GET_PROFILE })

export const updateProfile = (data, skipAlert = false) => ({ type: UPDATE_PROFILE, data, skipAlert })

export const setModal = (modal, value) => ({ type: SET_MODAL, modal, value })

export const logout = (cb = null) => ({ type: LOGOUT, cb })

export const restoreAuth = () => ({ type: RESTORE_AUTH })

export const setProtectedReferrer = path => ({ type: SET_PROTECTED_REFERRER, path })

export const setSysLocale = sysLocale => ({ type: SET_SYS_LOCALE, sysLocale })

export const validateEmail = (validate_profile) => ({ type: VALIDATE_EMAIL, validate_profile })

export const setRegisterForm = (key, value) => ({ type: SET_REGISTER_FORM, key, value })

export const setValidateModal = isValidetePopUpDisplayed => ({ type: SET_VALIDATE_MODAL, isValidetePopUpDisplayed })

export const sendRefer = data => ({ type: SEND_REFER, data })

export const sendVoucherCode = data => ({ type: SEND_VOUCHER_CODE, data })

export const getVouchers = () => ({ type: GET_VOUCHERS })
