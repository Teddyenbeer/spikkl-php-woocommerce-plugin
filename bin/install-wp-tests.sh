#!/usr/bin/env bash

if [ $# -lt 3 ]; then
    echo "usage: $0 <db-name> <db-user> <db-password> [db-host] [wp-version]"
    exit 1;
fi

DATABASE_NAME=$1
DATABASE_USER=$2
DATABASE_PASSWORD=$3
DATABASE_HOST=${4-localhost}
WORDPRESS_VERSION=${5-latest}

WORDPRESS_TEST_DIRECTORY=${WORDPRESS_TEST_DIRECTORY-/tmp/wordpress-tests}
WORDPRESS_CORE_DIRECTORY=/tmp/wordpress/

download() {
    if [ `which curl` ]; then
        curl -s "$1" > "$2"
    elif [ `which wget` ]; then
        wget -nv -O "$2" "$1"
    fi
}

if [[ $WP_VERSION =~ [0-9]+\.[0-9]+(\.[0-9]+)? ]]; then
    WORDPRESS_TESTS_TAG="tags/$WP_VERSION"
else
    download http://api.wordpress.org/core/version-check/1.7/ /tmp/wp-latest.json
    grep '[0-9]+\.[0-9]+(\.[0-9]+)?' /tmp/wp-latest.json

    LATEST_VERSION=$(grep -o '"version":"[^"]*' /tmp/wp-latest.json | sed 's/"version":"//')

    if [[ -z "$LATEST_VERSION" ]]; then
        echo "Latest Wordpress version could not be found.";
        exit 1
    fi

    WORDPRESS_TESTS_TAG="tags/$LATEST_VERSION"
fi

set -ex

install_wordpress() {

    if [ -d $WORDPRESS_CORE_DIRECTORY ]; then
        return;
    fi

    mkdir -p $WORDPRESS_CORE_DIRECTORY

    if [ "$WORDPRESS_VERSION" == 'latest' ]; then
        local ARCHIVE_NAME='latest'
    else
        local ARCHIVE_NAME="wordpress-$WORDPRESS_VERSION"
    fi

    download https://wordpress.org/${ARCHIVE_NAME}.tar.gz  /tmp/wordpress.tar.gz
    tar --strip-components=1 -zxmf /tmp/wordpress.tar.gz -C $WORDPRESS_CORE_DIRECTORY

    download https://raw.github.com/markoheijnen/wp-mysqli/master/db.php $WORDPRESS_CORE_DIRECTORY/wp-content/db.php
}

install_test_suite() {
    if [[ $(uname -s) == 'Darwin' ]]; then
        local ioption='-i .bak'
    else
        local ioption='-i'
    fi

    if [ ! -d $WORDPRESS_TEST_DIRECTORY ]; then
        mkdir -p $WORDPRESS_TEST_DIRECTORY
        svn co --quiet https://develop.svn.wordpress.org/${WORDPRESS_TESTS_TAG}/tests/phpunit/includes/ $WORDPRESS_TEST_DIRECTORY/includes
    fi

    cd $WORDPRESS_TEST_DIRECTORY

    if [ ! -f wp-tests-config.php ]; then
        download https://develop.svn.wordpress.org/${WORDPRESS_TESTS_TAG}/wp-tests-config-sample.php "$WORDPRESS_TEST_DIRECTORY"/wp-tests-config.php

        sed $ioption "s:dirname( __FILE__ ) . '/src/':'$WORDPRESS_CORE_DIRECTORY':" "$WORDPRESS_TEST_DIRECTORY"/wp-tests-config.php
        sed $ioption "s/youremptytestdbnamehere/$DATABASE_NAME/" "$WORDPRESS_TEST_DIRECTORY"/wp-tests-config.php
        sed $ioption "s/yourusernamehere/$DATABASE_USER/" "$WORDPRESS_TEST_DIRECTORY"/wp-tests-config.php
        sed $ioption "s/yourpasswordhere/$DATABASE_PASSWORD/" "$WORDPRESS_TEST_DIRECTORY"/wp-tests-config.php
        sed $ioption "s|localhost|${DATABASE_HOST}|" "$WORDPRESS_TEST_DIRECTORY"/wp-tests-config.php
    fi
}

install_database() {
  local PARTS=(${DATABASE_HOST//\:/ })
  local DATABASE_HOSTNAME=${PARTS[0]}
  local DATABASE_SOCKET_OR_PORT=${PARTS[1]}
  local EXTRA=""

  if [[ -n $DATABASE_HOSTNAME ]]; then
      if [ $(echo "$DATABASE_SOCKET_OR_PORT" | grep -e '^[0-9]\{1,\}$') ]; then
          EXTRA=" --host=$DATABASE_HOSTNAME --port=$DATABASE_SOCKET_OR_PORT --protocol=tcp"
      elif [[ -n $DATABASE_SOCKET_OR_PORT ]]; then
          EXTRA=" --socket=$DATABASE_SOCKET_OR_PORT"
      elif [[ -n $DATABASE_HOSTNAME ]]; then
          EXTRA=" --host=$DATABASE_HOSTNAME --protocol=tcp"
      fi
  fi

  mysqladmin create $DATABASE_NAME --user=$DATABASE_USER --password=$DATABASE_PASSWORD$EXTRA
}

install_wordpress
install_test_suite
install_database