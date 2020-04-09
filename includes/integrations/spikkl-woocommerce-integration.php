<?php

/**
 * Spikkl Address Lookup
 *
 * @class Spikkl_Woocommerce_Integration
 * @package Spikkl Address Lookup
 * @category Class
 * @author Spikkl
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( 'Spikkl_Woocommerce_Integration' ) ) {

    class Spikkl_Woocommerce_Integration {

        private static $_api_endpoint = 'https://api.spikkl.nl/geo/nld/lookup.json';

        private static $_billing = array(
            'scope' => '#main',
            'prefix' => 'billing',
            'company' => '#billing_company',
            'country' => '#billing_country',
            'city' => '#billing_city',
            'state' => '#billing_state',
            'postcode' => '#billing_postcode',
            'street' => '#billing_address_1',
            'street_number' => '#billing_address_2',
            'street_number_suffix' => '#billing_address_3',
        );

        private static $_shipping = array(
            'scope' => '#main',
            'prefix' => 'shipping',
            'company' => '#shipping_company',
            'country' => '#shipping_country',
            'city' => '#shipping_city',
            'state' => '#shipping_state',
            'postcode' => '#shipping_postcode',
            'street_name' => '#shipping_address_1',
            'street_number' => '#shipping_address_2',
            'street_number_suffix' => '#shipping_address_3',
        );

        private static $_error_message = array(
            'status' => 'failed',
            'status_code' => 'Error.'
        );

        private static $_supported_countries = array( 'NL' );

        private static $_action = 'spikkl';

        protected static $_instance;

        protected $_settings;

        protected $_version_strings = array();

        public function __construct() {
            $this->_settings = new Spikkl_Settings();

            if ( $this->_settings->is_enabled() && $this->_settings->has_api_key() ) {
                $this->init_hooks();

                add_action( 'wp_enqueue_scripts', array( __CLASS__, 'load_scripts' ) );

                $this->add_version_string( 'Spikkl/' . Spikkl::$version );
                $this->add_version_string( 'PHP/' . PHP_VERSION );
                $this->add_version_string( 'Wordpress/' . get_bloginfo( 'version' ) );
                $this->add_version_string( 'Woocommerce/' . get_woocommerce_version() );
            }
        }

        public static function instance() {
            if ( self::$_instance === null ) {
                self::$_instance = new self();
            }

            return self::$_instance;
        }

        public function init_hooks() {
            add_filter( 'woocommerce_default_address_fields', array( __CLASS__, 'override_default_address_fields' ) );
            add_filter( 'woocommerce_get_country_locale', array( __CLASS__, 'overwrite_country_locale' ) );

            add_action( 'wp_ajax_' . self::$_action, array( __CLASS__, 'perform_lookup' ) );
            add_action( 'wp_ajax_nopriv_' . self::$_action, array( __CLASS__, 'perform_lookup' ) );

            add_action( 'woocommerce_after_checkout_validation', array( __CLASS__, 'after_checkout_validation' ) );
        }

        public function load_scripts() {
            if ( ! $this->_settings->is_enabled() ) {
                return;
            }

            $suffix = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

            wp_register_script( 'spikkl_address_lookup', plugins_url( '/assets/js/spikkl-address-lookup' . $suffix . '.js', SPIKKL_PLUGIN_FILE ), array( 'jquery', 'woocommerce' ) );

            wp_enqueue_script( 'spikkl_address_lookup' );

            wp_localize_script( 'spikkl_address_lookup', 'spikkl_billing_fields', self::$_billing );
            wp_localize_script( 'spikkl_address_lookup', 'spikkl_shipping_fields', self::$_shipping );

            wp_localize_script( 'spikkl_address_lookup', 'spikkl_params', array(
                'url' => admin_url( 'admin-ajax.php' ),
                'action' => self::$_action,
                'supported_countries' => self::$_supported_countries,
                'street_number_label' => __( 'Street number', 'woocommerce' ),
                'errors' => array(
                    'invalid_postal_code' => __( 'Invalid postcode format', 'spikkl' ),
                    'invalid_street_number' => __( 'Invalid street number format', 'spikkl' ),
                    'invalid_street_number_suffix' => __( 'Invalid street number suffix format', 'spikkl' )
                )
            ));

            wp_enqueue_style( 'spikkl_address_lookup', plugins_url( 'assets/css/spikkl-address-lookup.css', SPIKKL_PLUGIN_FILE ) );
        }

        public function override_default_address_fields( $fields ) {
            if ( ! $this->_settings->is_enabled() ) {
                return $fields;
            }

            $fields['address_3'] = array(
                'label'        => __( 'Street number suffix', 'woocommerce' ),
                'required'     => false,
                'type'         => 'text',
                'class'        => array( 'form-row-last' ),
                'validate'     => array( 'suffix' ),
                'autocomplete' => false,
                'priority'     => 55,
                'hidden'       => true
            );

            return $fields;
        }

        public function overwrite_country_locale( $locale )
        {
            if ( ! $this->_settings->is_enabled() ) {
                return $locale;
            }

            $locale[ 'NL' ] = array(
                'postcode'  => array(
                    'priority' => 40
                ),
                'address_2' => array(
                    'priority' => 50,
                    'placeholder' => '',
                    'required' => true
                ),
                'address_3' => array(
                    'priority' => 55,
                ),
                'address_1' => array(
                    'priority' => 70,
                    'placeholder' => ''
                ),
                'city' => array(
                    'priority' => 80
                ),
                'state' => array(
                    'priority' => 90,
                    'required' => true
                )
            );

            return $locale;
        }

        public function perform_lookup() {
            if ( $this->_settings->validate_referrer() ) {
                $this->validate_referrer();
            }

            if ( empty( $_GET[ 'postal_code' ] ) || empty( $_GET[ 'street_number' ] ) ) {
                $this->error_occurred( 'INVALID_REQUEST' );
            }

            if ( ! $this->_settings->has_api_key() ) {
                $this->error_occurred( 'API key required.' );
            }

            $postal_code = rawurldecode( $_GET[ 'postal_code' ] );
            $street_number = rawurldecode( $_GET[ 'street_number' ] );
            $street_number_suffix = rawurldecode( $_GET[ 'street_number_suffix' ] );

            if (
                ! $this->validate_postal_code( $postal_code ) ||
                ! $this->validate_street_number( $street_number ) ||
                ! $this->validate_street_number_suffix( $street_number_suffix ) ) {
                $this->error_occurred( 'INVALID_REQUEST' );
            }

            if ( ! headers_sent() ) {
                header( 'Content-Type: application/json' );
            }

            $params = array(
                'key' => $this->_settings->get_api_key(),
                'postal_code' => $postal_code,
                'street_number' => $street_number,
                'street_number_suffix' => $street_number_suffix
            );

            $headers = array();

            if ( function_exists('php_uname') ) {
                $headers[ 'X-Spikkl-Client-Info' ] = php_uname();
            }

            $useragent = implode( ' ', $this->_version_strings );

            $url = $this->get_api_url( $params );

            $lookup_service = new WP_Http();
            $response = $lookup_service->request( $url, array(
                'timeout' => 5 * 1000,
                'user-agent' => $useragent,
                'headers' => $headers
            ));

            if ($response instanceof WP_Error || ! in_array( $response[ 'response' ][ 'code' ], [ 200, 400, 404 ], true ) ) {
                $this->error_occurred( 'UNAVAILABLE' );
            } else {
                echo $response[ 'body' ];
            }

            wp_die();
        }

        public function validate_postal_code( $value ) {
            return (bool) preg_match( '/^[1-9][0-9]{3}\s*(?!sa|sd|ss)[a-z]{2}$/i', $value );
        }

        public function validate_street_number( $value ) {
            return (bool) preg_match( '/^\d{1,5}$/', $value );
        }

        public function validate_street_number_suffix( $value ) {
            return (bool) preg_match( '/^(?:[a-z])?\s?(?:[a-z0-9]{1,4})?$/i', $value );
        }

        public function get_api_url( $params = null ) {
            return ( isset( $params ) && is_array( $params ) ) ? self::$_api_endpoint . '?' . http_build_query( $params, '', '&' ) : self::$_api_endpoint;
        }

        public function error_occurred( $status_code ) {
            if ( ! headers_sent() ) {
                header( 'Content-Type: application/json' );
            }

            self::$_error_message[ 'status_code' ] = $status_code;

            echo json_encode( static::$_error_message );

            wp_die();
        }

        /**
         * Try to validate the origin of te request.
         */
        public function validate_referrer() {
            $status_code = 'ACCESS_RESTRICTED';

            preg_match( '~' . site_url() . '~', $_SERVER[ 'HTTP_REFERER' ], $matches );

            if ( ! isset( $matches[0] ) || ! wp_get_referer() ) {
                $this->error_occurred( $status_code );
            }
        }

        public function after_checkout_validation( $posted ) {
            if ( ! $this->_settings->is_enabled() ) {
                return $posted;
            }

            foreach ( ['billing', 'shipping' ] as $group ) {
                $number = $group . '_address_2';
                $suffix = $group . '_address_3';

                if ( isset( $posted[$suffix] ) && $posted[$suffix] ) {
                    $posted[$number] .= $posted[$suffix];
                }

                unset( $posted[$suffix] );
            }

            return $posted;
        }

        public function add_version_string( $version_string ) {
            $this->_version_strings[] = str_replace( [ ' ', "\t", "\n", "\r" ], '-', $version_string );
        }
    }
}

Spikkl_Woocommerce_Integration::instance();