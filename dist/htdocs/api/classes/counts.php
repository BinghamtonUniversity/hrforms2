<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Counts extends HRForms2 {
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
		//TODO: create a view that counts and query that
		$request_drafts = count((new requestlist(array('drafts'),false))->returnData);
		$request_pending = count((new requestlist(array('pending'),false))->returnData);
		$request_approvals = count((new requestlist(array('approvals'),false))->returnData);
		$request_rejections = count((new requestlist(array('rejections'),false))->returnData);
		$request_final = count((new requestlist(array('final'),false))->returnData);

		$counts = array(
            "requests" => array(
                "drafts"=>$request_drafts,
				"pending"=>$request_pending,
                "approvals"=>$request_approvals,
				"rejections"=>$request_rejections,
                "final"=>$request_final
            ),
            "forms" => array(
                "drafts"=>0,
				"pending"=>0,
                "approvals"=>0,
                "rejections"=>0,
                "final"=>0
            )
        );
        $this->toJSON($counts);
	}
}
