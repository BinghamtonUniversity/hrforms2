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
		$this->allowedMethods = "GET,POST,PUT,PATCH,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	/**
	 * validate called from init()
	 */
	function validate() {
		//TODO: check this, do regular users need to GET?
		if (!$this->sessionData['isAdmin']) $this->raiseError(403);
		if (in_array($this->method,array('PUT','PATCH','DELETE')) && !isset($this->req[0])) $this->raiseError(400);		
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		switch($this->req[0]) {
			case "request": /** Request Work Flows */
				$qry = "select * from hrforms2_requests_workflow";
				if (isset($this->req[1])) $qry .= " where workflow_id = :id";
				$stmt = oci_parse($this->db,$qry);
				if (isset($this->req[1])) oci_bind_by_name($stmt,":id", $this->req[1]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					$conditions = (is_object($row['CONDITIONS']))?$row['CONDITIONS']->load():"";
					unset($row['CONDITIONS']);
					$row['CONDITIONS'] = json_decode($conditions);
					$this->_arr[] = $row;
				}		
				oci_free_statement($stmt);
				break;

			case "form": /** Form Work Flows */
				echo "TBD: Forms Work Flows";
				break;

			default:
				$this->raiseError(E_BAD_REQUEST);
		}
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
	function POST() {
		$qry = "insert into hrforms2_requests_workflow values(HRFORMS2_REQUESTS_WORKFLOW_SEQ.nextval,:groups,null) returning WORKFLOW_ID into :workflow_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":groups", $this->POSTvars['GROUPS']);
		oci_bind_by_name($stmt,":workflow_id", $WORKFLOW_ID,-1,SQLT_INT);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->toJSON(array("WORKFLOW_ID"=>$WORKFLOW_ID));
	}
	function PUT() {
		$qry = "update hrforms2_requests_workflow set groups = :groups, CONDITIONS = EMPTY_CLOB()
		where workflow_id = :workflow_id returning CONDITIONS into :conditions";
		$stmt = oci_parse($this->db,$qry);
		$clob = oci_new_descriptor($this->db, OCI_D_LOB);
		oci_bind_by_name($stmt,":groups", $this->POSTvars['GROUPS']);
		oci_bind_by_name($stmt,":workflow_id", $this->req[0]);
		oci_bind_by_name($stmt,":conditions", $clob, -1, OCI_B_CLOB);
		$r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
		if (!$r) $this->raiseError();
		$clob->save(json_encode($this->POSTvars['CONDITIONS']));
		oci_commit($this->db);
		$this->done();
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
