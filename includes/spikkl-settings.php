<?php

/**
 * Spikkl Address Lookup
 *
 * @class Spikkl_Settings
 * @package Spikkl Address Lookup
 * @category Class
 * @author Spikkl
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( 'Spikkl_Settings' ) ) {

    class Spikkl_Settings {

        public $api_key;

        public $is_enabled = '0';

        protected static $_instance;

        public function __construct() {
            $current_settings = get_option( 'spikkl_settings', array() );

            if ( isset( $current_settings[ 'is_enabled' ] ) ) {
                $this->is_enabled = $current_settings[ 'is_enabled' ];
            }

            if ( isset ( $current_settings[ 'api_key' ] ) ) {
                $this->api_key = $current_settings[ 'api_key' ];
            }
        }

        public static function instance() {
            if ( self::$_instance === null ) {
                self::$_instance = new self();
            }

            return self::$_instance;
        }

        public function get_api_key() {
            return $this->api_key;
        }

        public function has_api_key() {
            return (bool) $this->api_key;
        }

        public function is_enabled() {
            return (bool) $this->is_enabled;
        }
    }
}