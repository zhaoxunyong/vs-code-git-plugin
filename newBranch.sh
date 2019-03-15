#!/bin/sh
export PATH="/usr/local/bin:/usr/bin:$JAVA_HOME/bin:$MVN_HOME/bin:$PATH"
echo "11111111"
exit -1
sedi() {
  case $(uname) in
    Darwin*) sedi=('-i' '') ;;
    *) sedi='-i' ;;
  esac

  sed "${sedi[@]}" "$@"
}

# script replace, don't delete.
#cd #{project}

#检查是否已经保存过git的账户与密码
git ls-remote
if [[ $? != 0 ]]; then
	echo "=================Authentication error================="
	echo "Authentication error. Please execute the following command through git bash, and enter the account and password:"
	echo "git config --global credential.helper store"
	echo "git ls-remote"
	echo "=================Authentication error================="
	exit -1
fi

NEW_BRANCH=$1

if [[ "$NEW_BRANCH" == "" || ($NEW_BRANCH != *.x) ]]; then
  # echo "branchVersion must be not empty!"
  echo "Usage: $0 branch"
  echo "$0 1.0.x"
  exit -1
fi

function SwitchBranch() {
    branchVersions=$1
    git add .
    git commit -m "Commit by new branch:${NEW_BRANCH}."
    git checkout -b ${branchVersions} > /dev/null
    if [[ $? != 0 ]]; then
        git checkout ${branchVersions} > /dev/null
        if [[ $? != 0 ]]; then
            echo "Switch branch to ${branchVersions} error."
            exit -1
        fi
    fi
    echo "Switch branch to ${branchVersions} successful."
    git branch
}

function Push() {
    branchVersions=$1
    git add .
    git commit -m "Mod New branch version to ${branchVersions}"
    git push origin ${branchVersions}
    if [[ $? != 0 ]]; then
        echo "Push ${branchVersions} error."
        exit -1
    fi
    echo "Push ${branchVersions} successful."
}

SwitchBranch $NEW_BRANCH
# bash changeVersion.sh $NEW_VERSION
Push $NEW_BRANCH