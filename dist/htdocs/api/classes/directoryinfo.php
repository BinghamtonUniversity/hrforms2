<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class DirectoryInfo extends HRForms2 {
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
		if ($this->method == "GET" && (sizeof($this->req) != 1))  $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		//**** IF NOT SAVED PULL FROM _MV, else pull from hrf2 tables */
		// Get Address
		$qry = "select address_code, address_1, address_2, address_3, address_city, state_code, address_postal_code, create_date
			from buhr_address_mv@banner.cc.binghamton.edu
			where suny_id = :suny_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_fetch_all($stmt,$this->_arr['address'],null,null,OCI_FETCHSTATEMENT_BY_ROW);	
		oci_free_statement($stmt);

		// Get Phone
		$qry = "select phone_type, phone_area_code || phone_exchange || phone_number as phone_number, create_date
			from buhr_phone_mv@banner.cc.binghamton.edu
			where suny_id = :suny_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_fetch_all($stmt,$this->_arr['phone'],null,null,OCI_FETCHSTATEMENT_BY_ROW);	
		oci_free_statement($stmt);

		// Get Email
		$qry = "select email_type, email_address, create_date
		from buhr_email_mv@banner.cc.binghamton.edu
		where suny_id = :suny_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_fetch_all($stmt,$this->_arr['email'],null,null,OCI_FETCHSTATEMENT_BY_ROW);	
		oci_free_statement($stmt);

		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
