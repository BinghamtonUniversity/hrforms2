<?php
/**
 * Database Configuration
 *
 **/
$DBS = array(
	(0)=>array(               // defaults used when hostname is not matched ** DO NOT DELETE OR MOVE **
		"INSTANCE" => null,   // name of the application instance
		"DB" => null,         // database to connect to
		"DBUSER" => null,     // database user
		"DBPASS" => null,     // database password
		"NLS_LANG" => null    // database NLS_LANG, e.g. AL32UTF8, needed for connection to handle UTF-8 appropriately
	),
	(1)=>array(
		"INSTANCE" => "LOCAL",
		"DB" => "",
		"DBUSER" => "",
		"DBPASS" => "",
		"NLS_LANG" => "AL32UTF8"
	),
	(2)=>array(
		"INSTANCE" => "DEV",
		"DB" => "",
		"DBUSER" => "",
		"DBPASS" => "",
		"NLS_LANG" => "AL32UTF8"
	),
	(3)=>array(
		"INSTANCE" => "TEST",
		"DB" => "",
		"DBUSER" => "",
		"DBPASS" => "",
		"NLS_LANG" => "AL32UTF8"
	),
	(4)=>array(
		"INSTANCE" => "PROD",
		"DB" => "",
		"DBUSER" => "",
		"DBPASS" => "",
		"NLS_LANG" => "AL32UTF8"
	)
);
