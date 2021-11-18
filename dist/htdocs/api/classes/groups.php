<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Groups extends HRForms2 {
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
        if (!$this->sessionData['isAdmin']) $this->raiseError(403);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        $qry = "select * from hrforms2_groups";
		$stmt = oci_parse($this->db,$qry);
		oci_execute($stmt);
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			$this->_arr[] = $row;
		}
		oci_free_statement($stmt);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
	function PUT() {
		include 'groupusers.php';
		$qry = "update hrforms2_groups set group_name = :group_name, start_date = :start_date, end_date = :end_date where group_id = :group_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":group_name", $this->POSTvars['GROUP_NAME']);
		oci_bind_by_name($stmt,":start_date", $this->POSTvars['START_DATE']);
		oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
		oci_bind_by_name($stmt,":group_id", $this->req[0]);
		oci_execute($stmt);
		oci_commit($this->db);
		oci_free_statement($stmt);
		new GroupUsers(array($this->POSTvars['GROUP_ID']));
	}

	function POST() {
		include 'groupusers.php';
		$qry = "insert into hrforms2_groups values(HRFORMS2_GROUP_ID_SEQ.nextval, :group_name, sysdate, :start_date, :end_date) returning GROUP_ID into :group_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":group_name", $this->POSTvars['GROUP_NAME']);
		oci_bind_by_name($stmt,":start_date", $this->POSTvars['START_DATE']);
		oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
		oci_bind_by_name($stmt,":group_id", $GROUP_ID,-1,SQLT_INT);
		oci_execute($stmt);
		oci_commit($this->db);
		oci_free_statement($stmt);
		new GroupUsers(array($GROUP_ID));
	}
}
