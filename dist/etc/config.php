<?php
/**
 * Configuration for HR Forms 2
 *
**/
set_include_path(implode(PATH_SEPARATOR, array(get_include_path(),'../')));
include_once 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']."/..");
$dotenv->load();

$defaultEnv = ['TIMEZONE'=>'America/New_York','DATE_FMT'=>'DD-MMM-YY','NLS_LANG'=>'AL32UTF8'];
$requiredEnv = ['CAS_HOST','SMTP_HOST','SMTP_PORT','SMTP_USERNAME','SMTP_PASSWORD'];
$notEmptyEnv = ['INSTANCE','VERSION','REVISION','TITLE','API_PATH','DB','DBUSER','DBPASS'];
$booleanEnv = ['DEBUG','SMTP_AUTH','SMTP_DEBUG'];

# test for required env vars
try {
	$dotenv->required($requiredEnv);
} catch (Exception $e) {
	die("Environment variable validation failed. Please check your .env file and ensure all required variables are set.");
}
# test for require non-empty env vars
try {
	$dotenv->required($notEmptyEnv)->notEmpty();
} catch (Exception $e) {
	die("Environment variable validation failed. Please check your .env file and ensure all required variables are not empty.");
}
# test for required boolean env vars
try {
	$dotenv->required($booleanEnv)->isBoolean();
} catch (Exception $e) {
	die("Environment variable validation failed. Please check your .env file and ensure all boolean variables are set to true or false.");
}

$envvars = array_merge($requiredEnv,$notEmptyEnv,$booleanEnv,array_keys($defaultEnv));

define('HOST',$_SERVER['HTTP_HOST']);
define('URL_ROOT', (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST']);

array_walk($envvars,function($key) use ($defaultEnv) { 
	if (!isset($_ENV[$key])) {
		try {
			define($key,$defaultEnv[$key]);
		} catch (Exception $e) {
			die("Environment variable $key is required but not set. Please check your .env file.");
		}
		return;
	}
	define($key,$_ENV[$key]); 
});

/* set Date/Timezone */
date_default_timezone_set($_ENV['TIMEZONE']);
