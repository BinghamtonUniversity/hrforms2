<?php
/**
 * Email Configuration
 *
 **/
$EMAIL = array(
	(0)=>array(                 // defaults used when hostname is not matched ** DO NOT DELETE OR MOVE **
		"SMTP_HOST" => "",           // Server Hostname
		"SMTP_PORT" => null,           // Server Port (e.g 587)
		"SMTP_AUTH" => false,        // Use SMTP Authentication
		"SMTP_USERNAME" => "",       // SMTP Username
		"SMTP_PASSWORD" => "",       // SMTP User Password
        "SMTP_DEBUG" => true         // Display Debug Information
	),
	(1)=>array(
		"SMTP_HOST" => "smtp.gmail.com",
		"SMTP_PORT" => 587,
		"SMTP_AUTH" => true,
		"SMTP_USERNAME" => "",
		"SMTP_PASSWORD" => "",
        "SMTP_DEBUG" => true
	),
	(2)=>array(
		"SMTP_HOST" => "localhost",
		"SMTP_PORT" => "",
		"SMTP_AUTH" => false,
		"SMTP_USERNAME" => "",
		"SMTP_PASSWORD" => "",
        "SMTP_DEBUG" => true
	),
	(3)=>array(
		"SMTP_HOST" => "",
		"SMTP_PORT" => "",
		"SMTP_AUTH" => false,
		"SMTP_USERNAME" => "",
		"SMTP_PASSWORD" => "",
        "SMTP_DEBUG" => false
	),
	(4)=>array(
		"SMTP_HOST" => "",
		"SMTP_PORT" => "",
		"SMTP_AUTH" => false,
		"SMTP_USERNAME" => "",
		"SMTP_PASSWORD" => "",
        "SMTP_DEBUG" => false
	)
);
