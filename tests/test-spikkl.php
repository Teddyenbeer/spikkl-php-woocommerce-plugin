<?php

class Spikkl_Test extends WP_UnitTestCase
{
    /**
     * Set up tests.
     */
    public function setUp() {
        parent::setUp();

        update_option( 'spikkl_settings', array(
            'is_enabled' => '1',
            'api_key' => 'some_api_key'
        ) );

        wp_set_current_user( self::factory()->user->create( [
            'role' => 'administrator'
        ] ) );
    }

    function test_link_to_settings() {
        $spikkl_admin = Spikkl_Admin::instance();

        $spikkl_admin->add_plugin_page();

        $this->assertNotEmpty( menu_page_url( 'spikkl_address_lookup_options' ) );
    }

    public function test_non_administrators_can_access_settings() {
        $spikkl_admin = Spikkl_Admin::instance();

        wp_set_current_user( self::factory()->user->create( [
            'role' => 'subscriber'
        ] ) );

        $this->assertNull( $spikkl_admin->create_admin_page() );
    }

    public function test_woocommerce_states() {
        $spikkl_states = Spikkl_States::instance();

        $countries = $expected = array(
            'GB' => array(
                'some_value'
            ),
            'NL' => array(
                'some' => 'value'
            )
        );

        $actual = $spikkl_states->add_states( $countries );

        $this->assertArrayHasKey( 'GB', $actual );
        $this->assertArrayHasKey( 'NL', $actual );

        $this->assertTrue( is_array( $actual[ 'NL' ] ) );

        $this->assertArrayNotHasKey( 'some', $actual[ 'NL' ] );

        $this->assertEquals( 12, count( $actual[ 'NL' ] ) );
    }

    public function test_override_address_fields() {
        $spikkl_integration = new Spikkl_Woocommerce_Integration();

        $fields = $expected = array(
            'address_2' => array(
                'some' => 'value'
            )
        );

        $actual = $spikkl_integration->override_default_address_fields( $fields );

        $this->assertEquals( 'value', $actual['address_2']['some'] );

        $this->assertArrayHasKey( 'address_3', $actual );

        $this->assertEquals( 'Street number suffix', $actual['address_3']['label'] );
        $this->assertEquals( array( 'form-row-last' ), $actual['address_3']['class'] );
    }

    public function test_overwrite_country_locale() {
        $spikkl_integration = new Spikkl_Woocommerce_Integration();

        $fields = $expected = array(
            'NL' => array(
                'some' => 'value'
            )
        );

        $actual = $spikkl_integration->overwrite_country_locale( $fields );

        $this->assertArrayHasKey( 'NL', $actual );

        $this->assertArrayHasKey( 'postcode', $actual[ 'NL' ] );
        $this->assertArrayHasKey( 'address_1', $actual[ 'NL' ] );
        $this->assertArrayHasKey( 'address_2', $actual[ 'NL' ] );
        $this->assertArrayHasKey( 'address_3', $actual[ 'NL' ] );
        $this->assertArrayHasKey( 'city', $actual[ 'NL' ] );
        $this->assertArrayHasKey( 'state', $actual[ 'NL' ] );
    }

    public function test_validate_postal_code() {
        $spikkl_integration = new Spikkl_Woocommerce_Integration();

        $this->assertTrue( $spikkl_integration->validate_postal_code( '2611KL' ) );
        $this->assertFalse( $spikkl_integration->validate_postal_code( '2611' ) );
    }

    public function test_validate_street_number() {
        $spikkl_integration = new Spikkl_Woocommerce_Integration();

        $this->assertTrue( $spikkl_integration->validate_street_number( 23 ) );
        $this->assertFalse( $spikkl_integration->validate_street_number( 'ab' ) );
    }

    public function test_validate_street_number_suffix() {
        $spikkl_integration = new Spikkl_Woocommerce_Integration();

        $this->assertTrue( $spikkl_integration->validate_street_number_suffix( null ) );
        $this->assertTrue( $spikkl_integration->validate_street_number_suffix( 'a' ) );
        $this->assertFalse( $spikkl_integration->validate_street_number_suffix( 'aabbccdd' ) );
    }

    public function test_get_api_url() {
        $spikkl_integration = new Spikkl_Woocommerce_Integration();

        $this->assertEquals( 'https://api.spikkl.nl/geo/nld/lookup.json', $spikkl_integration->get_api_url() );
        $this->assertEquals( 'https://api.spikkl.nl/geo/nld/lookup.json?some=value', $spikkl_integration->get_api_url( [ 'some' => 'value' ] ) );
    }

    public function test_error_occurred() {
        $this->expectException( WPDieException::class );

        $spikkl_integration = new Spikkl_Woocommerce_Integration();

        $error = $spikkl_integration->error_occurred( 'SOME_STATUS_CODE' );

        $this->assertTrue( is_string($error) );

        $this->assertArraHasKey( 'status'. json_decode( $error ) );
        $this->assertArraHasKey( 'status_code'. json_decode( $error ) );
    }

    public function test_invalid_referrer() {
        $this->expectException( WPDieException::class );

        $spikkl_integration = new Spikkl_Woocommerce_Integration();

        $_SERVER['HTTP_REFERER'] = 'some_domain';

        $this->assertNotEmpty( $spikkl_integration->validate_referrer() );
    }

    public function test_valid_referrer() {
        $spikkl_integration = new Spikkl_Woocommerce_Integration();

        $_SERVER['HTTP_REFERER'] = site_url() . '?some=value';

        $this->assertEmpty( $spikkl_integration->validate_referrer() );
    }
}