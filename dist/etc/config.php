<?php
/**
 * Configuration for HR Forms 2
 *
**/
include('db.php');
include('email.php');

define('VERSION','2.0.0');
define('REVISION','LOCAL-20250428');
define('BUILD_TIME',1745872147);
define('TITLE','HR Forms 2');
define('API_PATH','/api/api.php/'); //trailing slash required

/* set Date/Timezone */
date_default_timezone_set('America/New_York');

/* Configuration */
$CONFIG = array(
	(0)=>array(					// defaults used when hostname is not matched ** DO NOT DELETE OR MOVE **
		"INSTANCE" => null,		// name of the application instance
		"HOST" => null,			// hostname, used to search for defined constants
		"CAS_HOST" => null,		// hostname of CAS server to authenticate against
		"DATE_FMT" => null,		// database string date format converted to moment syntax (see: https://date-fns.org/docs/format)
		"DEBUG" => false,		// when true will output additional information in the JavaScript console.
	),
	(1)=>array(
		"INSTANCE" => "LOCAL",
		"HOST" => "hrforms2.localhost",
		"CAS_HOST" => null,
		"DATE_FMT" => "DD-MMM-YY",
		"DEBUG" => true,
	),
	(2)=>array(
		"INSTANCE" => "DEV",
		"HOST" => "hrformsdev.binghamton.edu",
		"CAS_HOST" => null,
		"DATE_FMT" => "DD-MMM-YY",
		"DEBUG" => true,
	),
	(3)=>array(
		"INSTANCE" => "TEST",
		"HOST" => "hrformstest.binghamton.edu",
		"CAS_HOST" => null,
		"DATE_FMT" => "DD-MMM-YY",
		"DEBUG" => true,
	),
	(4)=>array(
		"INSTANCE" => "PROD",
		"HOST" => "hrforms.binghamton.edu",
		"CAS_HOST" => null,
		"DATE_FMT" => "DD-MMM-YY",
		"DEBUG" => false,
	)
);

/* ========= DO NOT EDIT BELOW THIS LINE ========= */
$INSTANCES = array(
	array_merge($CONFIG[0],$DBS[0],$EMAIL[0]),
	array_merge($CONFIG[1],$DBS[1],$EMAIL[1]),
	array_merge($CONFIG[2],$DBS[2],$EMAIL[2]),
	array_merge($CONFIG[3],$DBS[3],$EMAIL[3]),
	array_merge($CONFIG[4],$DBS[4],$EMAIL[4])
);
$i = array_search($_SERVER['HTTP_HOST'],array_column($INSTANCES, 'HOST'));
array_walk($INSTANCES[$i],function($v,$k) { define($k,$v); });

function cacheLoader() {
	$qs = "?v=" . VERSION;
	if (!TPL_CACHE) $qs .= "&_=" . time();
	return $qs;
}

function appSettingsJS() {
	echo json_encode(array(
		"title" => TITLE,
		"version" => VERSION,
		"revision" => REVISION,
		"instance" => INSTANCE,
		"apiPath" => API_PATH,
		"debug" => DEBUG,
		)
	);
}
