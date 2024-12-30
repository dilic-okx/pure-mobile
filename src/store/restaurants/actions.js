import { GET_RESTAURANTS, GET_REWARDS, GET_IKENTOO_MENU, GET_IKENTOO_MENUS_FOR_LOCATION, BEFORE_CLOSE_TIME_PICKER, BEFORE_SHOW_TIME_PICKER, GET_RESTAURANTS_SNOOZED_DATA, CLEAR_IKENOO_MENU } from './constants'

export const getRestaurants = () => ({ type: GET_RESTAURANTS })

export const getRewards = () => ({ type: GET_REWARDS })

export const getIkentooMenu= (menuId, businessLocationId, redirect = true) => ({ type: GET_IKENTOO_MENU, menuId, businessLocationId, redirect })

export const getIkentooMenusForLocation = (businessLocationId, additionalData = {}, isDelivery) => ({ type: GET_IKENTOO_MENUS_FOR_LOCATION, businessLocationId, additionalData, isDelivery })

export const beforeShowTimePicker = () => ({ type: BEFORE_SHOW_TIME_PICKER })

export const beforeCloseTimePicker = () => ({ type: BEFORE_CLOSE_TIME_PICKER })

export const getRestaurantSnoozeData = () => ({ type: GET_RESTAURANTS_SNOOZED_DATA })

export const clearIkentooMenu = () => ({ type: CLEAR_IKENOO_MENU })
