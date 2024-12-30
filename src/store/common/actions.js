import { REQUEST_ERROR, CLEAR_ERROR, LOADING, SEND_FIREBASE_TOKEN, SHOW_TOAST, RESET_TOAST, INIT, GET_SOCIALS, SEND_FEEDBACK, SET_COMMON_MODAL, GET_TERMS, GET_PRIVACY_POLICY, GET_FAQ, CHANGE_CONNECTIONS_STATUS, LOCATION, REMOVE_TOAST, GET_ALLERGENS } from './constants'

/**
 * Sets the `error` state to the error received
 * @param { object } error The error we got when trying to make the request
 */
export const requestError = error => ({ type: REQUEST_ERROR, error })

/* Sets the `error` state as empty */
export const clearError = () => ({ type: CLEAR_ERROR })

export const loading = flag => ({ type: LOADING, loading: flag })

export const sendFirebaseToken = args => ({ type: SEND_FIREBASE_TOKEN, args })

export const showToast = (message, toastType = 'warning') => ({ type: SHOW_TOAST, message, toastType })

export const resetToast = () => ({ type: RESET_TOAST })

export const removeToast = () => ({ type: REMOVE_TOAST })

export const getSocials = () => ({ type: GET_SOCIALS })

export const sendFeedback = data => ({ type: SEND_FEEDBACK, data })

export const setCommonModal = (modal, value) => ({ type: SET_COMMON_MODAL, modal, value })

export const init = () => ({ type: INIT })

export const getTermsAndConditions = () => ({ type: GET_TERMS })

export const getPrivacyPolicy = () => ({ type: GET_PRIVACY_POLICY })

export const getFaq = () => ({ type: GET_FAQ })

export const changeConnectionStatus = status => ({ type: CHANGE_CONNECTIONS_STATUS, status })

export const setMyLocation = (data) => ({ type: LOCATION, value: data })

export const getAllergensInfo = () => ({ type: GET_ALLERGENS })
