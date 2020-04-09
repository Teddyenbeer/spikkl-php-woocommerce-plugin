<?php

/**
 * Spikkl Address Lookup
 *
 * @package Spikkl Address Lookup
 * @author Spikkl
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'get_woocommerce_version' ) ) {

    function get_woocommerce_version() {
        if ( ! function_exists( 'get_plugins' ) ) {
            require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
        }

        $plugin_folder = get_plugins( '/' . 'woocommerce' );
        $plugin_file = 'woocommerce.php';

        if ( isset( $plugin_folder[ $plugin_file ][ 'Version' ] ) ) {
            return $plugin_folder[ $plugin_file ][ 'Version' ];
        }

        return null;
    }
}