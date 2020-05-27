<?php

/**
 * Spikkl Address Lookup
 *
 * @class Spikkl_States
 * @package Spikkl Address Lookup
 * @category Class
 * @author Spikkl
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( 'Spikkl_States' ) ) {

    class Spikkl_States {

        /**
         * @var array
         */
        public static $_countries = array(
            'NL' => array(
                'DR' => 'Drenthe',
                'FL' => 'Flevoland',
                'FR' => 'Friesland',
                'GD' => 'Gelderland',
                'GR' => 'Groningen',
                'LB' => 'Limburg',
                'NB' => 'Noord-Brabant',
                'NH' => 'Noord-Holland',
                'OV' => 'Overijssel',
                'UT' => 'Utrecht',
                'ZL' => 'Zeeland',
                'ZH' => 'Zuid-Holland'
            )
        );

        protected static $_instance;

        public function __construct() {
            add_filter( 'woocommerce_states', array( $this, 'add_states' ) );
        }

        public static function instance() {
            if ( self::$_instance === null ) {
                self::$_instance = new self();
            }

            return self::$_instance;
        }

        public function add_states( $states ) {
            foreach ( self::$_countries as $country_iso2_code => $province ) {
                $states[ $country_iso2_code ] = $province;
            }

            return $states;
        }
    }
}

Spikkl_States::instance();