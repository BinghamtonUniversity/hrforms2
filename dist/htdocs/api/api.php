<?php

set_include_path(implode(PATH_SEPARATOR, array(get_include_path(), './classes/')));

// set autoloader for classes
spl_autoload_register(function ($classname) {
	// see: http://www.php-fig.org/psr/psr-4/
	if (!preg_match('/^Mustache_/',$classname) && !preg_match('/^CAS_/',$classname)) {
		include $classname . '.php';
	}
});

$request = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'],'/')) : null;
if (!$request) { trigger_error('Malformed request') && die(); }

$class = array_shift($request);

$c = new $class($request);
