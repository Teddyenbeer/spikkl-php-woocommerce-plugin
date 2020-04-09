<?php

/**
 * Spikkl Address Lookup
 *
 * @class Spikkl_Admin
 * @package Spikkl Address Lookup
 * @category Class
 * @author Spikkl
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( 'Spikkl_Admin' ) ) {

    class Spikkl_Admin {

        protected static $_instance;

        protected $_settings;

        public function __construct() {
            $this->_settings = Spikkl_Settings::instance();

            add_action( 'admin_menu', array( __CLASS__, 'add_plugin_page' ) );
            add_action( 'admin_init', array( __CLASS__, 'init_page' ) );

            add_action( 'plugin_action_links_' . plugin_basename( SPIKKL_PLUGIN_FILE ) , array( __CLASS__, 'add_plugin_link' ) );
        }

        public static function instance() {
            if ( self::$_instance === null ) {
                self::$_instance = new self();
            }

            return self::$_instance;
        }

        public function init_page() {
            register_setting( 'spikkl_settings_group', 'spikkl_settings', array( __CLASS__, 'validate_settings' ) );
        }

        public function validate_settings( $input ) {
            if ( trim( $input[ 'api_key' ] ) && preg_match( '/^[a-f0-9]{32}$/i', trim( $input['api_key'] ) ) === 0 ) {

                add_settings_error( 'spikkl_settings', esc_attr( 'settings_updated' ), 'Invalid API key provided. Your API key should have 32 characters and should consist of numbers and letters only.', 'spikkl' );
            }

            // If not valid api key is provided, disable lookup.
            if ( $input[ 'is_enabled' ] === '1' && ( trim( $input[ 'api_key' ] ) === '' || ! preg_match( '/^[a-f0-9]{32}$/i', trim( $input['api_key'] ) ) ) ) {

                $input[ 'is_enabled' ] = '0';

                add_settings_error( 'spikkl_settings', esc_attr( 'settings_updated' ), 'You cannot enable Spikkl Address Lookup without a valid API key.', 'spikkl' );
            }

            return $input;
        }

        public function add_plugin_page() {
            add_options_page(
                __( 'Spikkl Address Lookup', 'spikkl' ),
                __( 'Address Lookup', 'spikkl' ),
                'activate_plugins',
                'spikkl_address_lookup_options',
                array( __CLASS__, 'create_admin_page' )
            );
        }

        public function add_plugin_link( $links ) {
            $links = array_merge( array(
                '<a href="' . esc_url( menu_page_url( 'spikkl_address_lookup_options' ) ) . '">' . __( 'Settings', 'spikkl' ) . '</a>'
            ), $links );

            return $links;
        }

        public function create_admin_page() {
            if ( ! current_user_can( 'activate_plugins' ) ) {
                _e( 'Not accessible', 'spikkl' );
                return;
            }

            include_once( SPIKKL_PLUGIN_DIRECTORY . '/includes/admin/spikkl-admin-template.php' );
        }
    }

}

Spikkl_Admin::instance();