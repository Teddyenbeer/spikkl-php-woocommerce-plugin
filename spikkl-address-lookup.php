<?php

/*
 *  Plugin Name: Spikkl Address Lookup
 *  Plugin URI: https://www.spikkl.nl/
 *  Description: Automatically validates the postcode and street number in the checkout form and fills in additional address data.
 *  Version: 1.0.0
 *  Author: Spikkl
 *  Author URI: https://www.spikkl.nl/
 *  Text Domain: spikkl
 *  Domain Path: /lang
 *  Requires at least: 4.4
 *  Tested up to: 5.4
 *  WC requires at least: 3.1.0
 *  WC tested up to: 4.0
 *  Requires PHP: 5.6
 *
 *  Copyright 2020 Spikkl
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! defined( 'SPIKKL_PLUGIN_FILE' ) ) {
    define( 'SPIKKL_PLUGIN_FILE', __FILE__ );
}

if ( ! defined( 'SPIKKL_PLUGIN_DIRECTORY' ) ) {
    define( 'SPIKKL_PLUGIN_DIRECTORY', __DIR__ );
}

if ( ! class_exists('Spikkl' ) ) {

    final class Spikkl {

        public static $version = '1.0.0';

        protected static $_instance;

        public static function instance() {
            if ( self::$_instance === null ) {
                self::$_instance = new self();
            }

            return self::$_instance;
        }

        public function __construct() {
            include_once( SPIKKL_PLUGIN_DIRECTORY . '/includes/spikkl-functions-core.php' );
            include_once( SPIKKL_PLUGIN_DIRECTORY . '/includes/spikkl-install.php' );
            include_once( SPIKKL_PLUGIN_DIRECTORY . '/includes/spikkl-states.php' );
            include_once( SPIKKL_PLUGIN_DIRECTORY . '/includes/spikkl-settings.php' );
            include_once( SPIKKL_PLUGIN_DIRECTORY . '/includes/admin/spikkl-admin.php' );
            include_once( SPIKKL_PLUGIN_DIRECTORY . '/includes/admin/spikkl-admin-notice.php' );

            include_once( SPIKKL_PLUGIN_DIRECTORY . '/includes/integrations/spikkl-woocommerce-integration.php' );

            add_action( 'plugins_loaded', array( __CLASS__, 'load_text_domain' ) );
        }

        public function load_text_domain() {
            load_plugin_textdomain( 'spikkl', false, '/spikkl/lang/' );
        }
    }
}

Spikkl::instance();

