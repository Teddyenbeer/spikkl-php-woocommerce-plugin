<?php

/**
 * Spikkl Address Lookup
 *
 * @class Spikkl_Admin_Notice
 * @package Spikkl Address Lookup
 * @category Class
 * @author Spikkl
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( 'Spikkl_Admin_Notice' ) ) {

    class Spikkl_Admin_Notice {

        protected static $_instance;

        protected $_settings;

        public function __construct() {
            $this->_settings = Spikkl_Settings::instance();

            add_action( 'admin_notices', array( $this, 'admin_notices' ) );
        }

        public static function instance() {
            if ( self::$_instance === null ) {
                self::$_instance = new self();
            }

            return self::$_instance;
        }

        public function admin_notices() {
            if ( ! class_exists( 'WooCommerce' ) ) {
                vprintf(
                    '<div class="notice notice-error is-dismissible"><h3>%s</h3><p>%s</p></div>',
                    array(
                        __( 'Spikkl Address Lookup: WooCommerce is required.', 'spikkl' ),
                        __( 'The WooCommerce plugin is required and to be activated in order to add address validation and lookup to the checkout form.', 'spikkl' )
                    )
                );
            }

            $page = get_current_screen();
            if ( $page !== null && $page->id === 'settings_page_spikkl_address_lookup_options') {
                return;
            }

            if ( ! $this->_settings->has_api_key() ) {
                vprintf(
                    '<div class="notice notice-error"><h3>%s</h3><p>%s</p></div>',
                    array(
                        __( 'Spikkl Address Lookup: Set the API key', 'spikkl' ),
                        __( 'An API key is required in order to use address validation and lookup in the checkout form. Set your API key in the settings.', 'spikkl' )
                    )
                );
            }
        }
    }

}

Spikkl_Admin_Notice::instance();