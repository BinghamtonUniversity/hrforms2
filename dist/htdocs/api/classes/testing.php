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
		$qry = "select * from hrforms2_payroll_codes";
		$stmt = oci_parse($this->db,$qry);
		//oci_bind_by_name($stmt,":id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		$row = oci_fetch_array($stmt);
		print_r($row);
		echo "<hr>";
		$row = oci_fetch_array($stmt,OCI_RETURN_LOBS);
		print_r($row);
		echo "<hr>";
		$row = oci_fetch_array($stmt,OCI_RETURN_NULLS);
		print_r($row);
		oci_free_statement($stmt);


		/*$settings = (new settings(array(),false))->returnData;
		$email = array_merge(array('from'=>'no-reply'),(array)$settings['requests']['email']);
		print_r($email);*/

		/*$message = "An error occurred while updating the user information in <code>user.php</code> at line <strong>1234</strong>.";
		$ret = $this->sendError($message,'Error Subject');
		var_dump($ret);
		echo "done\n";*/
	}
}
