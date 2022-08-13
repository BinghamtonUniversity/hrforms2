<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class PersonDirectory extends HRForms2 {
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
		if (count($this->req) != 2) $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		switch($this->req[0]) {
            case "address":
				$qry = "SELECT * from buhr.BUHR_ADDRESS_MV@banner.cc.binghamton.edu where suny_id = :suny_id";
				break;		
            case "phone":
                $this->done();
                break;
            case "email":
                $this->done();
                break;
            default:
                $this->done();
                break;
        }
		$stmt = oci_parse($this->db,$qry);
		if (isset($this->req[0])) oci_bind_by_name($stmt,":suny_id", $this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        $this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
