#!/bin/sh

if [ -z "$1" ] || [ "$1" != "android" ] && [ "$1" != "ios" ] && [ "$1" != "un" ]
  then
    echo "Usage: "
    echo "  ./runOnDevice.sh ios"
    echo "  ./runOnDevice.sh android"
    echo "  ./runOnDevice.sh un  --> for app uninstall"
    exit
fi

APP_ID="com.fiveloyalty.pureuk"

if [ "$1" = "un" ]
  then
    echo "Uninstalling:" $APP_ID
    adb uninstall $APP_ID
    return
fi

ionic build

npx cap sync

npx cap copy

if [ "$1" = "ios" ]
  then
    npx cap open ios
fi
if [ "$1" = "android" ]
  then
    adb uninstall $APP_ID
    npx cap open android
fi

# #Define all paths, constants here
# PROJECT_DIR='android/'
# OUTPUT_DIR='../'
# # Functions for customising print colors (Optional)
# print_red(){
#     printf "\e[1;31m$1\e[0m"
# }
# print_green(){
#     printf "\e[1;32m$1\e[0m"
# }
# print_yellow(){
#     printf "\e[1;33m$1\e[0m"
# }
# print_blue(){
#     printf "\e[1;34m$1\e[0m"
# }
# #Enter project dir
# cd $PROJECT_DIR
#
# echo `pwd`
# #Start Build Process
# print_blue "\n\n\nStarting"
# print_blue "\n\n\nCleaning...\n"
# ./gradlew clean
# print_blue "\n\n\ncleanBuildCache...\n"
# ./gradlew cleanBuildCache
# print_blue "\n\n\n build...\n"
# ./gradlew build
# print_blue "\n\n\n assembleDebug...\n"
# ./gradlew assembleDebug
# #Install APK on device / emulator
# print_blue "installDebug...\n"
# ./gradlew installDebug
# print_blue "\n\n\n Done Installing\n"
# #Launch Main Activity
# adb shell am start -n "com.fiveloyalty.pureuk/com.fiveloyalty.pureuk.MainActivity" -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
# print_blue "\n\n\n Launched main activity\n"
# #Copy APK to output folder
# cp "$PROJECT_DIR"app/build/outputs/apk/debug/app-debug.apk $OUTPUT_DIR
# print_blue "\n\n\n Copying APK to outputs Done\n"
#
