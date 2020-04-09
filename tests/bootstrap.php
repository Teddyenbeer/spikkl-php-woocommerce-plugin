<?php

$_tests_directory = getenv( ' WP_TESTS_DIRECTORY' );

if ( ! $_tests_directory ) {
    $_tests_directory = '/tmp/wordpress-tests';
}

require_once( $_tests_directory . '/includes/functions.php' );

function _manually_load_plugin () {
    require( __DIR__ . '/../spikkl-address-lookup.php' );
}

tests_add_filter( 'plugins_loaded', '_manually_load_plugin' );

require( $_tests_directory . '/includes/bootstrap.php' );