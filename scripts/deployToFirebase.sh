#!/bin/sh

if [ -z "$1" ] || [ "$1" != "init" ] && [ "$1" != "deploy" ]
  then
    printf "\e[36m\nUsage: \n\e[0m"
    printf "\e[36m  ./deployToFirebase.sh init        --> only first time\n\e[0m"
    if [ -z "$2" ] || [ "$2" != "prod" ] && [ "$2" != "dev" ]
      then
        printf "\e[36m  ./deployToFirebase.sh deploy prod --> deploy new version to the production url\n\e[0m"
        printf "\e[36m  ./deployToFirebase.sh deploy dev  --> deploy new version to the development url\n\e[0m"
        printf "\e[36m  ./deployToFirebase.sh deploy web  --> deploy new version to the web-app url\n\e[0m"
        printf "\n"
    fi
    exit
else
  if [ "$1" = "deploy" ]
    then
      if [ -z "$2" ] || [ "$2" != "prod" ] && [ "$2" != "dev" ] && [ "$2" != "web" ]
      then
        printf "\e[36m\nUsage: \n\e[0m"
        printf "\e[36m  ./deployToFirebase.sh deploy prod --> deploy new version to the production url\n\e[0m"
        printf "\e[36m  ./deployToFirebase.sh deploy dev  --> deploy new version to the development url\n\e[0m"
        printf "\e[36m  ./deployToFirebase.sh deploy web  --> deploy new version to the web-app url\n\e[0m"
        printf "\n"
        exit
      fi
  fi
fi


if [ "$1" = "init" ]
  then
    printf "\e[93m\nFIREBASE INIT...\e[0m\n\n"
    printf "\e[93m\ninstaling firebase-tools (e.g. npm install -g firebase-tools)\e[0m\n"
    printf "\e[93m\e[5m\n   hint: script maybe must be executed with sudo permisions if location for global npm modules is in root directory\e[0m\n"
    printf "\e[93m\e[5m\n   instalation will start in 5 seconds, STOP the script if sudo is needed\e[0m\n\n"

    sleep 5

    npm install -g firebase-tools
    printf "\n"
    firebase login
    printf "\n"

    printf "\e[93mHELPER:\e[0m\n\n"
    printf "\e[93m++++ 1. Select (with space keybord key) 'Hosting' option\e[0m\n"
    printf "\e[93m++++ 2. Select 'Use un existing project' option\n"
    printf "\e[93m++++ 3. What do you want to use as your public directory?  --> enter 'build'\e[0m\n"
    printf "\e[93m++++ 4. Configure as a single-page app (rewrite all urls to /index.html)?   --> 'y' then Enter key\e[0m\n"
    printf "\e[93m++++ 5. File public/index.html already exists. Overwrite?   --> 'n' then Enter key\e[0m\n\n"
    firebase init
fi

if [ "$1" = "deploy" ]
  then
    if which jq >/dev/null; then
      printf '\n\e[93mjq is installed\e[0m\n'
    else
      printf '\n\n \e[31mjq is not installed\e[0m\n\n'

      while true; do
        read -p "Do you want to install jq??? [Y/n]: " inst
        if [ "$inst" = "y" ] || [ "$inst" = "Y" ] || [ "$inst" = "yes" ] || [ "$inst" = "Yes" ] || [ "$inst" = "" ]
        then
          sudo apt install jq
          break
        fi
        if [ "$inst" = "n" ] || [ "$inst" = "N" ] || [ "$inst" = "no" ] || [ "$inst" = "No" ]
        then
          exit 0
        fi
      done
    fi

    firebase projects:list
    printf "\e[33m\n\nPLEASE SELECT CORRECT PROJECT:\n\n\e[0m"
    while true; do
        read -p "Is currently selected project OK for deploy??? [Y/n]: " prompt
        if [ "$prompt" = "y" ] || [ "$prompt" = "Y" ] || [ "$prompt" = "yes" ] || [ "$prompt" = "Yes" ] || [ "$prompt" = "" ]
        then

          # printf "\n\e[33m\n\nPLEASE SELECT CORRECT PROJECT:\n\n\e[0m"
          # printf "Git brances:\n"
          # git branch

          branch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')

          if [ "$2" = "prod" ] && [ "$branch" != "master" ]
            then
              printf "\e[36m\nYou have selected: \e[32m"$2"\e[0m\e[36m deploy type as script parameter\n\e[0m"
              printf "\e[36m   - deploy type \e[32mprod\e[0m\e[36m must use \e[32mmaster\e[0m\e[36m branch. But you are using \e[31m"$branch"\e[0m\e[36m branch.\n\e[0m"
              printf "\e[36mplease:\n\e[0m"
              printf "\e[36m   1. select correct branch\n\e[0m"
              printf "\e[36m   2. pull changes from dev branch\n\e[0m"
              printf "\e[36m   3. update master branch with changes (e.g. push master)\n\e[0m"
              printf "\e[36mand than start script again.\n\e[0m"
              printf "\n"
              exit
          fi

          if [ "$2" = "dev" ] && [ "$branch" != "dev" ]
            then
              printf "\e[36m\nYou have selected: \e[32m"$2"\e[0m\e[36m deploy type as script parameter\n\e[0m"
              printf "\e[36m   - deploy type \e[32mdev\e[0m\e[36m must use \e[32mdev\e[0m\e[36m branch. But you are using \e[31m"$branch"\e[0m\e[36m branch.\n\e[0m"
              printf "\e[36mplease:\n\e[0m"
              printf "\e[36m   1. select correct branch\n\e[0m"
              printf "\e[36m   2. pull changes from dev branch\n\e[0m"
              printf "\e[36m   3. update dev branch with changes (e.g. push dev)\n\e[0m"
              printf "\e[36mand than start script again.\n\e[0m"
              printf "\n"
              exit
          fi

          # if [ "$2" = "web" ] && [ "$branch" != "web" ]
          #   then
          #     printf "\e[36m\nYou have selected: \e[32m"$2"\e[0m\e[36m deploy type as script parameter\n\e[0m"
          #     printf "\e[36m   - deploy type \e[32mweb\e[0m\e[36m must use \e[32mweb\e[0m\e[36m branch. But you are using \e[31m"$branch"\e[0m\e[36m branch.\n\e[0m"
          #     printf "\e[36mplease:\n\e[0m"
          #     printf "\e[36m   1. select correct branch\n\e[0m"
          #     printf "\e[36m   2. pull changes from dev branch\n\e[0m"
          #     printf "\e[36m   3. update web branch with changes (e.g. push web)\n\e[0m"
          #     printf "\e[36mand than start script again.\n\e[0m"
          #     printf "\n"
          #     exit
          # fi

          packageJsonVersion=`jq -r ".version" < package.json`
          printf "\n\nCurrent version from package.json: \e[32m"$packageJsonVersion"\e[0m\n\n"

          version=$(echo $packageJsonVersion | grep -o '[^-]*$')

          build=$(echo $version | cut -d. -f1)
          minor=$(echo $version | cut -d. -f2)
          patch=$(echo $version | cut -d. -f3)


          printf "\t\t%-30s  %-30s  %-30s" "BUILD" "MINOR" "PATCH"
          printf "\n"
          printf "\t\t%-30s  %-30s  %-30s" "$build" "$minor" "$patch"
          printf "\n\n"

          new_build="$(echo $build + 1 | bc).$minor.$patch"
          new_minor="$build.$(echo $minor + 1 | bc).$patch"
          new_patch="$build.$minor.$(echo $patch + 1 | bc)"

          new_version_for_package_json=$packageJsonVersion
          while true; do
              printf "What to increment?\n
  1) build  (result will be: \e[93m$new_build)\e[0m\n
  2) minor  (result will be: \e[93m$new_minor)\e[0m\n
  3) patch  (result will be: \e[93m$new_patch)\e[0m\n\n
  4) SKIP version update  (result will be:\e[93m $new_version_for_package_json\e[0m)\n
  5) Enter version number manualy  (format: \e[93mx.x.x\e[0m)\n"
              read -p "answer:  " inc
              if [ "$inc" = "1" ]
                then
                  new_version_for_package_json=$new_build
                  break
              fi
              if [ "$inc" = "2" ]
                then
                  new_version_for_package_json=$minor
                  break
              fi
              if [ "$inc" = "3" ]
                then
                  new_version_for_package_json=$new_patch
                  break
              fi
              if [ "$inc" = "4" ]
                then
                  break
              fi
              if [ "$inc" = "5" ]
                then
                  read -p "Version number (x.x.x): " manualy_entered_version_number
                  new_version_for_package_json=$manualy_entered_version_number
                  break
              fi
          done

          printf "\e[33m\nNEW package.json version is:  \e[0m\e[32m$new_version_for_package_json\n\n\e[0m"
          echo "`jq '.version="'$new_version_for_package_json'"' package.json`" > package.json

          printf '\e[93mMAKING BUILD\e[0m\n\n'
          ionic build
          printf '\e[93mDEPLOY\e[0m\n\n'

          echo "`jq '.hosting.target="'$2'"' firebase.json`" > firebase.json
          firebase deploy --only hosting:$2
          git checkout firebase.json

          if [ "$2" = "dev" ] && [ "$3" = "-fm" ]
          then
            # deploy code to the and and also to the prod (this is used only until app is released)
            printf "\n\e[31m\e[5mIMPORTANT: This will deploy current build to the production url also\n\n\e[0m"
            while true; do
              read -p "Do you want to make this deploy??? [Y/n]: " inst
              if [ "$inst" = "y" ] || [ "$inst" = "Y" ] || [ "$inst" = "yes" ] || [ "$inst" = "Yes" ] || [ "$inst" = "" ]
              then
                echo "`jq '.hosting.target="prod"' firebase.json`" > firebase.json
                firebase deploy --only hosting:prod
                git checkout firebase.json
                break
              fi
            done
          fi

          printf "\n"

          if [ "$version" != "$new_version_for_package_json" ]
          then
            printf "\e[31m\e[5mIMPORTANT: Commit & Push changed package.json\n\n\e[0m"
          fi

          printf "\e[32mDONE\e[0m\n\n"

          exit 0
        else
          printf '\n\e[93mChange project using:\n\n       firebase use project_id   \n\nand run this script again.\e[0m\n'
          exit 0
        fi #project checker if end
    done #project checker while end
fi #script argument checker end (if argument=deploy)
