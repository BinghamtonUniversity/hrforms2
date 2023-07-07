<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Settings extends HRForms2 {
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
		$qry = "select settings from hrforms2_settings";
        $stmt = oci_parse($this->db,$qry);
        oci_execute($stmt);
		$row = oci_fetch_row($stmt);
		$json = (is_object($row[0])) ? $row[0]->load() : "";
        oci_free_statement($stmt);
        $this->_arr = json_decode($json,true);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}

    function PUT() {
		$qry = "update hrforms2_settings set settings = '{}' returning settings into :json";
		$stmt = oci_parse($this->db,$qry);
		$clob = oci_new_descriptor($this->db, OCI_D_LOB);
		oci_bind_by_name($stmt, ":json", $clob, -1, OCI_B_CLOB);
		oci_execute($stmt,OCI_NO_AUTO_COMMIT);
		$clob->save(json_encode($this->POSTvars));
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
    }
}
