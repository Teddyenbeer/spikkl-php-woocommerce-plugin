=== Spikkl Address Lookup ===
Contributors: Spikkl
Tags: postcode, address validation, checkout, billing, shipping, address, address verification, lookup, postcode api, online service, postcode check, woocommerce
Requires at least: 4.4
Tested up to: 5.5
Stable tag: 1.6.8
Requires PHP: 5.6
License: GPLv3
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Spikkl Address Lookup validates the Dutch postcode and street number combination during checkout and fills additional address values automatically. Increase the ease-of-use for each of your customers and be assured of up-to-date and valid address data.

== Installation ==
The easiest way to install the Spikkl Address Lookup plugin is via the plugin menu. Click the 'Add new' button and search for the 'Spikkl Address Lookup' plugin in the search field. Once you found the plugin, click 'Install Now', and Wordpress will take if from there.

= Manual =
If you like to install the plugin manually, download the latest release of the Spikkl Address Lookup plugin and upload it to the web server using your FTP-client. Wordpress has provided the [instructions](https://wordpress.org/support/article/managing-plugins/#manual-plugin-installation) how to do that.

= Configure =
The configuration settings for the Spikkl Address Lookup plugin can be accessed from the *Address Lookup* page in the *Settings* menu.

Once installed, you will need to enter your Spikkl API key, which can be obtained from your [Spikkl account](https://www.spikkl.nl/account/credentials).

== Description ==
Spikkl Address Lookup validates the postcode and street number combination during checkout and fills additional address values automatically.

[Published on Github](https://github.com/spikkl/spikkl-php-woocommerce-plugin)

= Note =
The Spikkl Address Lookup service is a Dutch service only, and currently, will not work for any other country.

The plugin requires you to register at [Spikkl](https://www.spikkl.nl/signup) where you get 100 free request per months.

= Technical features: =
* 100% user friendly, easy to install, easy to uninstall
* Light weight and clean code
* Compatible with WooCommerce 3.1 - 4.4

= Support =
If you have questions or issues with the Wordpress Spikkl Address Lookup Plugin then the visit
the Spikkl [documentation](https://www.spikkl.nl/documentation) or the Spikkl [plugin page](https://www.spikkl.nl/modules/wordpress). Or you can email us at [support@spikkl.nl](mailto:support@spikkl.nl).

== Frequently Asked Questions ==

= Do I need a Spikkl account to use this plugin? =
Yes, you will need a Spikkl account in order to obtain your API key. Once registered, you will use the Spikkl API with 100 free requests per month.

= Which countries are supported currently? =
For now, only the Netherlands is supported for the checkout form. Customers from other countries will still be able to checkout, but their address will not be validated.

= Which WooCommerce versions are compatible? =
The Spikkl Address Lookup plugin is tested for WooCommerce version starting from 3.1 till 4.0.

== Screenshots ==

1. Install the Spikkl Address Lookup using the Wordpress plugin repository.
2. Simple settings interface to add your Spikkl API key.
3. Checkout page with default WooCommerce template.

== Changelog ==

= 1.0.0 =
* Initial Release;

= 1.1.0 =
* Update translations for some error messages during checkout
* Improved error handling during checkout
* Minor style change to align some address fields properly

= 1.1.1 =
* Unify release information

= 1.3.0 =
* Remove disabled property from input fields when changing country during checkout
* Validate referrer by default and remove administrator setting

= 1.3.2 =
* Minor changes in Readme.txt

= 1.4.0 =
* Load proper translation file when selecting Dutch

= 1.4.1 =
* Remove disabled fields and hide state fields for The Netherlands

= 1.4.2 =
* Fix auto fill for street name in shipping address
* Remove settings page URL from plugin page

= 1.4.3 =
* Add regex to validate postal code, street number and street number suffix
* Concat postal code, street number and street number suffix to single address line

= 1.4.4 =
* Update country-related checkout fields test

= 1.4.5 =
* Fix country selector to support single country checkout forms

= 1.4.6 =
* Fix jquery country selector

= 1.5.0 =
* Retrieve street number and street number suffix from the session
* Replace street number and street number suffix meta key for customers to auto fill customer address

= 1.5.1 =
* Fix address checkout key tests

= 1.5.2 =
* Disable input fields while fetching
* Abort request on newer input values

= 1.5.3 =
* Use debounce for postcode and street number fields

= 1.5.4 =
* Fix for reordering fields for unsupported countries

= 1.5.5 =
* Search API on blur instead of keyup
* Change address street key to address_3

= 1.5.6 =
* Fix wrong attribute to focus on during lookup

= 1.6.0 =
* Added compatibility for MyParcel plugin
* Fix support for non-supported countries

= 1.6.1 =
* Fix loading of js scripts

= 1.6.2 =
* Fix switch between supported and unsupported countries

= 1.6.3 =
* Fix lookup to search on blur

= 1.6.4 =
* Add space between street number and street number suffix when saving order

= 1.6.5 =
* Prevent loading plugin scripts on other pages than checkout

= 1.6.8 =
* Load plugin when selecting shipping address and minor fixes