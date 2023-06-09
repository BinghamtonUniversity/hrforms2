<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Testing extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	/**
	 * validate called from init()
	 */
	function validate() {
		// Validation...
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		//echo json_decode($_COOKIE['hrforms2_local'])->bnumber;
		//print_r($GLOBALS);
		//$m = new Mustache_Engine;
		// get system templates
		//echo $m->render('Hello, {{planet}}!', array('planet' => 'World')); // "Hello, World!"
		/*$template = <<<EOF
{{^PROD}}
This is a test
{{/PROD}}
Last Line
EOF;
		echo $m->render($template, array('PROD'=>false));*/

		$partials = [];
		$email_template = "";
		$templates = (new template(array(),false))->returnData;
		foreach ($templates as $template) {
			if ($template['TEMPLATE_TYPE'] == 'S') $partials[$template['TEMPLATE_SLUG']] = "";
			if ($template['TEMPLATE_TYPE'] == 'R'&&$template['TEMPLATE_STATUS_CODE']=='S') $email_template = $template['TEMPLATE_SLUG'];
		}
		foreach ($partials as $key=>$val) {
			$rv = (new template(array($key),false))->returnData;
			$partials[$key] = $rv['TEMPLATE'];
		}

		$tmpl = (new template(array($email_template),false))->returnData;

		$email_list = [];
		$email_list['mailto'] = array(
			"someone@somewhere.com",
			"another@someplace.org",
			"newperson@there.com"
		);

		$m = new Mustache_Engine(array(
			'partials' => $partials
		));
		$vars = array(
			'PROD' => false,
			'DEBUG' => true,
			'INSTANCE' => INSTANCE,
			'MAILTO' => function() use ($email_list) { return implode(', ',$email_list['mailto']); },
			'SUBJECT' => '['.INSTANCE.']: This is the subject'
		);
		$content = str_replace('{{&gt;','{{>',$tmpl['TEMPLATE']); // fix partial HTML entities 
		echo $m->render($content,$vars);
	}
}
