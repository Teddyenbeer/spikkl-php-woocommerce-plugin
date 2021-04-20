/* global spikkl_params */
/* global woocommerce_params */
/* global spikkl_billing_fields */
/* global spikkl_shipping_fields */
jQuery( document ).ready( function( $ ) {

	if ( typeof spikkl_params === 'undefined' ) {
		return false;
	}

	const DUTCH_POSTCODE_REGEX = new RegExp('^[1-9][0-9]{3}\\s*(?!sa|sd|ss)[a-z]{2}$', 'i');
	const DUTCH_STREET_NUMBER_REGEX = new RegExp('^[0-9]{1,5}$');
	const DUTCH_STREET_NUMBER_SUFFIX_REGEX = new RegExp('^(?:[a-z])?(?:\\s?[a-z0-9]{1,4})?$', 'i');

	const LookupHandler = function ( fields ) {
		this.cache = {};

		this.xhr = null;
		this.lookupTimeout = null;

		this.prefix = fields.prefix;

		this.$countryField = $( fields.country + '_field' );
		this.$stateField = $( fields.state + '_field' );
		this.$cityField = $( fields.city + '_field' );
		this.$address1Field = $( fields.address_1 + '_field' );
		this.$address2Field = $( fields.address_2 + '_field' );
		this.$streetField = $( fields.street + '_field' );
		this.$postcodeField = $( fields.postcode + '_field' );
		this.$streetNumberField = $( fields.street_number + '_field' );
		this.$streetNumberSuffixField = $( fields.street_number_suffix + '_field' );

		this.$country = this.$countryField.find( ':input' );
		this.$state = this.$stateField.find( ':input' );
		this.$city = this.$cityField.find( ':input' );
		this.$address1 = this.$address1Field.find( ':input' );
		this.$address2 = this.$address2Field.find( ':input' );
		this.$street = this.$streetField.find( ':input' );
		this.$postcode = this.$postcodeField.find( ':input' );
		this.$streetNumber = this.$streetNumberField.find( ':input' );
		this.$streetNumberSuffix = this.$streetNumberSuffixField.find( ':input' );

		if (! this.isCheckout()) {
			return;
		}

		this.setHelperElements();

		this.$country.on( 'change', () => {
			this.setupFields();
		});

		this.setupFields( fields.prefix );
	};

	LookupHandler.prototype.setupFields = function ( prefix ) {
		let selectedCountryCode = this.getSelectedCountryCode();

		this.reorderFields( selectedCountryCode );
		this.listen( selectedCountryCode );

		this.autoFillMyParcelFields( prefix );
	};

	LookupHandler.prototype.listen = function ( selectedCountryCode ) {
		if ( this.isCountryEligibleForLookup( selectedCountryCode ) ) {

			this.$postcode.on( 'blur input', this.debounce( this.validatePostcode, 250 ) );
			this.$streetNumber.on( 'blur input', this.debounce( this.validateStreetNumber, 250 ) );
			this.$streetNumberSuffix.on( 'blur input', this.debounce( this.validateStreetNumberSuffix, 250 ) );

			this.applyFieldsLock();

		} else {
			this.$postcode.off( 'blur input' );
			this.$streetNumber.off( 'blur input' );
			this.$streetNumberSuffix.off( 'blur input' );

			this.hardResetFields();
			this.releaseFieldsLock();
		}
	};

	LookupHandler.prototype.autoFillMyParcelFields = function ( prefix ) {
		$( document.body ).on( 'update_checkout', () => {
			$('#' + prefix + '_street_name_field' ).find( ':input' ).val( this.$street.val() );
			$('#' + prefix + '_house_number_field' ).find( ':input' ).val( this.$streetNumber.val() );
			$('#' + prefix + '_house_number_suffix_field' ).find( ':input' ).val( this.$streetNumberSuffix.val() );
		})
	};

	LookupHandler.prototype.applyFieldsLock = function () {
		this.$postcode.attr( 'autocomplete', 'off' );
		this.$postcode.attr( 'maxlength', 7 );

		this.$street.attr( 'readonly', true );
		this.$city.attr( 'readonly', true );
		this.$state.attr( 'readonly', true );

		this.$stateField.addClass( 'spikkl-hidden' );
	};

	LookupHandler.prototype.releaseFieldsLock = function () {
		this.$postcode.removeAttr( 'autocomplete' );
		this.$postcode.removeAttr( 'maxlength' );

		this.$street.removeAttr( 'readonly' );
		this.$city.removeAttr( 'readonly'  );
		this.$state.removeAttr( 'readonly' );

		this.$stateField.removeClass( 'spikkl-hidden' );
	};

	LookupHandler.prototype.softResetFields = function () {
		this.$street.val( '' );
		this.$city.val( '' );
		this.$state.val( '' ).trigger( 'change' );

		if ( typeof this.$spinner !== 'undefined' ) {
			this.stopLoading()
		}
	};

	LookupHandler.prototype.hardResetFields = function () {
		this.$postcode.val( '' );
		this.$streetNumber.val( '' );
		this.$streetNumberSuffix.val( '' );

		if ( typeof this.$message !== 'undefined' ) {
			this.$message.hide();
		}

		this.softResetFields();
	};

	LookupHandler.prototype.debounce = function (func, wait = 450) {
		let timeout;
		const context = this;

		return function () {
			const delay = function () {
				timeout = null;
				func.apply(context);
			}

			clearTimeout(timeout);

			timeout = setTimeout(delay, wait);
		};
	};

	LookupHandler.prototype.performLookup = function () {
		if (
			! this.isValidPostcode() ||
			! this.isValidStreetNumber() ||
			! this.isValidStreetNumberSuffix()
		) {
			this.softResetFields();

			return;
		}

		const postcode = this.$postcode.val();
		const streetNumber = this.$streetNumber.val();
		const streetNumberSuffix = this.$streetNumberSuffix.val();

		this.startLoading();

		this.$message.hide();

		const params = {
			action: spikkl_params.action,
			postal_code: encodeURIComponent( postcode ),
			street_number: encodeURIComponent( streetNumber ),
			street_number_suffix: encodeURIComponent( streetNumberSuffix ),
		};

		this.cachedGet( params );
	};

	LookupHandler.prototype.cachedGet = function ( params ) {

		const cacheKey = spikkl_params.url + JSON.stringify( Object.values( params ) );

		if ( this.xhr ) {
			this.xhr.abort();
		}

		if ( this.cache.hasOwnProperty( cacheKey ) ) {
			this.fillFields( this.cache[ cacheKey ] );
		} else {
			this.xhr = $.ajax({
				crossDomain: true,
				type: 'GET',
				dataType: 'json',
				timeout: 5 * 1000,
				url: spikkl_params.url,
				data: params,

				success: ( data, textStatus ) => {
					if ( ! data || textStatus !== 'success' ) {
						this.fillFields( {
							status: 'failed',
							status_code: 'UNAVAILABLE'
						} );

						this.releaseFieldsLock();
						return;
					}

					this.cache[ cacheKey ] = data;

					this.fillFields( data );
				}
			});
		}
	};

	LookupHandler.prototype.startLoading = function () {
		this.$spinner.show();

		this.$postcode.attr('disabled', true);
		this.$streetNumber.attr('disabled', true);
		this.$streetNumberSuffix.attr('disabled', true);
	}

	LookupHandler.prototype.stopLoading = function () {
		this.$spinner.hide();

		this.$postcode.attr('disabled', false);
		this.$streetNumber.attr('disabled', false);
		this.$streetNumberSuffix.attr('disabled', false);
	}

	LookupHandler.prototype.fillFields = function ( json ) {
		this.stopLoading();

		if ( json.status === 'ok' && json.results.length >= 1) {

			this.fillDefaultFields( json.results[0] );

		} else {
			let translatedMessage;

			if ( json.status_code === 'ZERO_RESULTS') {
				translatedMessage = spikkl_params.errors.invalid_address;
			}

			if ( json.status_code === 'INVALID_REQUEST' ) {
				translatedMessage = spikkl_params.errors.invalid_postal_code_or_street_number;
			}

			if ( json.status_code === 'UNAVAILABLE' || json.status_code === 'ACCESS_RESTRICTED' ) {
				translatedMessage = spikkl_params.errors.unknown_error;

				this.releaseFieldsLock();
			}

			this.softResetFields();

			this.$message.empty().append( '<li>' + translatedMessage + '</li>' );
			this.$message.show();
		}
	};

	LookupHandler.prototype.fillDefaultFields = function ( results ) {
		this.$postcode.val( results.postal_code ).change();

		this.$street.val( results.street_name ).change();
		this.$streetNumber.val( results.street_number ).change();
		this.$streetNumberSuffix.val( results.street_number_suffix ).change();

		this.$city.val( results.city ).change();

		this.$state.val( results.administrative_areas[0].abbreviation ).change();
	};

	LookupHandler.prototype.validatePostcode = function () {
		const postcode = this.$postcode.val();

		this.$message.hide();

		if ( postcode === null || postcode === '' ) {
			return;
		}

		if ( DUTCH_POSTCODE_REGEX.test( postcode ) ) {
			this.$postcodeField.removeClass('woocommerce-invalid');

			if ( !this.$postcode.is( ':focus') ) {
				this.performLookup();
			}

		} else {
			this.$postcodeField.addClass('woocommerce-invalid');
		}
	}

	LookupHandler.prototype.validateStreetNumber = function () {
		const streetNumber = this.$streetNumber.val();

		this.$message.hide();

		if ( streetNumber === null || streetNumber === '' ) {
			return;
		}

		if ( DUTCH_STREET_NUMBER_REGEX.test( streetNumber ) ) {
			this.$streetNumberField.removeClass('woocommerce-invalid');

			if ( !this.$streetNumber.is( ':focus' ) ) {
				this.performLookup();
			}
		} else {
			this.$streetNumberField.addClass('woocommerce-invalid');
		}
	}

	LookupHandler.prototype.validateStreetNumberSuffix = function () {
		const streetNumberSuffix = this.$streetNumberSuffix.val();

		this.$message.hide();

		if ( DUTCH_STREET_NUMBER_SUFFIX_REGEX.test( streetNumberSuffix ) ) {
			this.$streetNumberSuffixField.removeClass('woocommerce-invalid');

			if ( !this.$streetNumberSuffix.is( ':focus' ) ) {
				this.performLookup();
			}
		} else {
			this.$streetNumberSuffixField.addClass('woocommerce-invalid');
		}
	};

	LookupHandler.prototype.isValidPostcode = function () {
		const postcode = this.$postcode.val();

		return postcode !== null && postcode !== '' && DUTCH_POSTCODE_REGEX.test( postcode );
	};

	LookupHandler.prototype.isValidStreetNumber = function () {
		const streetNumber = this.$streetNumber.val();

		return streetNumber !== null && streetNumber !== '' && DUTCH_STREET_NUMBER_REGEX.test( streetNumber );
	};

	LookupHandler.prototype.isValidStreetNumberSuffix = function () {
		const streetNumberSuffix = this.$streetNumberSuffix.val();

		return DUTCH_STREET_NUMBER_SUFFIX_REGEX.test( streetNumberSuffix );
	};

	LookupHandler.prototype.markFieldsAsRequired = function ( fields ) {
		const required = '<abbr class="required" title="">*</abbr>';

		fields.forEach( field => {
			field.find('label').children().remove();
			field.addClass( 'validated-required' ).find('label').append(required);
		});
	};

	LookupHandler.prototype.setHelperElements = function () {
		this.$spinner = $( '<div>', {
			id: 'spikkl-' + this.prefix + '-spinner',
			class: 'spikkl-loader',
			style: 'display:none;'
		});

		this.$message = $( '<ul>', {
			id: 'spikkl-' + this.prefix + '-message',
			class: 'woocommerce-error',
			style: 'display:none;'
		});

		this.$postcode.after( this.$spinner );
		this.$postcode.before( this.$message );
	};

	LookupHandler.prototype.reorderFields = function ( selectedCountryCode ) {
		if ( this.isCountryEligibleForLookup( selectedCountryCode ) ) {
			this.markFieldsAsRequired( [ this.$streetField, this.$streetNumberField ] );

			this.$streetField.show();
			this.$streetNumberField.show();
			this.$streetNumberSuffixField.show();

			this.$address1Field.hide();
			this.$address2Field.hide();

			this.$countryField.after(this.$postcodeField);
		} else {
			this.$streetField.hide();
			this.$streetNumberField.hide();
			this.$streetNumberSuffixField.hide();

			this.$address1Field.show();
			this.$address2Field.show();

			this.$cityField.before(this.$postcodeField);
		}
	};

	LookupHandler.prototype.getSelectedCountryCode = function () {
		return this.$country.val().trim();
	};

	LookupHandler.prototype.isCheckout = function () {
		return this.$country.length > 0 && this.$postcode.length > 0 && this.$city.length > 0;
	};

	LookupHandler.prototype.isCountryEligibleForLookup = function ( selectedCountryCode ) {
		selectedCountryCode = selectedCountryCode || this.getSelectedCountryCode();

		return spikkl_params.supported_countries.indexOf( selectedCountryCode ) >= 0;
	};

	if ( typeof spikkl_billing_fields !== 'undefined' ) {
		new LookupHandler( spikkl_billing_fields );
	}

	if ( typeof spikkl_shipping_fields !== 'undefined' && $( '#ship-to-different-address-checkbox' ).length ) {
		new LookupHandler( spikkl_shipping_fields );
	}
});