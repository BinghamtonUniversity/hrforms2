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
		$this->reqAuth = false; //default: true - NB: See note above
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
		$qry = "select count(*) from hrforms2_requests_drafts where suny_id = :suny_id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":suny_id",$this->req[0]);
        //oci_bind_by_name($stmt,":suny_id",$suny_id);
        oci_execute($stmt);
		$reqDrafts = oci_fetch_array($stmt,OCI_RETURN_NULLS);
		oci_free_statement($stmt);

		$counts = array(
            "requests" => array(
                "draft"=>$reqDrafts[0],
                "approval"=>0,
                "final"=>0
            ),
            "forms" => array(
                "draft"=>0,
                "approval"=>0,
                "rejection"=>0,
                "final"=>0
            )
        );
        $this->toJSON($counts);
	}
}
