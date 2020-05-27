#!/usr/bin/env bash

build_release () {
    zip -r ./spikkl-address-lookup.zip assets includes lang readme.txt spikkl-address-lookup.php
}

build_release