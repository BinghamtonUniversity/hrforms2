<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Workflow extends HRForms2 {
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
        $qry = "select * from hrforms2_requests_workflow";
        if (isset($this->req[0])) $qry .= " where workflow_id = :id";
		$stmt = oci_parse($this->db,$qry);
        if (isset($this->req[0])) oci_bind_by_name($stmt,":id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			$this->_arr[] = $row;
		}
		oci_free_statement($stmt);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
	function POST() {
		$qry = "insert into hrforms2_requests_workflow values(HRFORMS2_REQUESTS_WORKFLOW_SEQ.nextval,:groups) returning WORKFLOW_ID into :workflow_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":groups", $this->POSTvars['GROUPS']);
		oci_bind_by_name($stmt,":workflow_id", $WORKFLOW_ID,-1,SQLT_INT);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->toJSON(array("WORKFLOW_ID"=>$WORKFLOW_ID));
	}
	function PATCH() {
		if (isset($this->POSTvars['GROUPS'])) {
			$qry = "update hrforms2_requests_workflow set groups = :groups where workflow_id = :workflow_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":groups", $this->POSTvars['GROUPS']);
			oci_bind_by_name($stmt,":workflow_id", $this->req[0]);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			oci_commit($this->db);
			oci_free_statement($stmt);
		}
		$this->done();
	}
	function DELETE() {
		$qry = "delete from hrforms2_requests_workflow where workflow_id = :workflow_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":workflow_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
	}
}
