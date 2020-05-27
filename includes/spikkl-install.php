<?php

/**
 * Spikkl Address Lookup
 *
 * @class Spikkl_Install
 * @package Spikkl Address Lookup
 * @category Class
 * @author Spikkl
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( 'Spikkl_Install' ) ) {

    class Spikkl_Install {

        protected static $_instance;

        public function __construct() {
            register_activation_hook( SPIKKL_PLUGIN_FILE, array( $this, 'activate' ) );
            register_deactivation_hook( SPIKKL_PLUGIN_FILE, array( $this, 'deactivate' ) );
        }

        public static function instance() {
            if ( self::$_instance === null ) {
                self::$_instance = new self();
            }

            return self::$_instance;
        }

        public function activate() {
            register_setting( 'spikkl_settings_group', 'spikkl_settings' );
        }

        public function deactivate() {
            unregister_setting( 'spikkl_settings_group', 'spikkl_settings' );
        }
    }
}

Spikkl_Install::instance();