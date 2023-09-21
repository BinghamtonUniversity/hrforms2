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
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			$this->_arr[] = $this->null2Empty($row);
		}
		oci_free_statement($stmt);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
	function POST() {
		//include 'groupusers.php';
		//include 'groupdepts.php';
		$qry = "insert into hrforms2_groups values(HRFORMS2_GROUP_ID_SEQ.nextval, :group_name, sysdate, :start_date, :end_date, :description) returning GROUP_ID into :group_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":group_name", $this->POSTvars['GROUP_NAME']);
		oci_bind_by_name($stmt,":start_date", $this->POSTvars['START_DATE']);
		oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
		oci_bind_by_name($stmt,":description", $this->POSTvars['GROUP_DESCRIPTION']);
		oci_bind_by_name($stmt,":group_id", $GROUP_ID,-1,SQLT_INT);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_free_statement($stmt);
		new groupusers(array($GROUP_ID));
		new groupdepts(array($GROUP_ID));
		$this->done();
	}
	function PUT() {
		//include 'groupusers.php';
		//include 'groupdepts.php';
		$qry = "update hrforms2_groups set 
			group_name = :group_name, 
			start_date = :start_date, 
			end_date = :end_date,
			group_description = :description
			where group_id = :group_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":group_name", $this->POSTvars['GROUP_NAME']);
		oci_bind_by_name($stmt,":start_date", $this->POSTvars['START_DATE']);
		oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
		oci_bind_by_name($stmt,":description", $this->POSTvars['GROUP_DESCRIPTION']);
		oci_bind_by_name($stmt,":group_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		new groupusers($this->req);
		new groupdepts($this->req);
		$this->done();
	}
	function PATCH() {
		if (isset($this->POSTvars['END_DATE'])) {
			$qry = "update hrforms2_groups set end_date = :end_date where group_id = :group_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
			oci_bind_by_name($stmt,":group_id", $this->req[0]);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			oci_commit($this->db);
			oci_free_statement($stmt);
		}
		$this->done();
	}
	function DELETE() {
		// Check if group is used in a workflow:
		$qry = "select workflow_id, groups from hrforms2_requests_workflow";
		$stmt = oci_parse($this->db,$qry);
		$r = oci_execute($stmt);
		$workflow_ids = array();
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			if (in_array($this->req[0],explode(',',$row['GROUPS']))) {
				$workflow_ids[] = $row['WORKFLOW_ID'];
			}
		}
		oci_free_statement($stmt);
		if (count($workflow_ids) > 0) $this->raiseError(E_BAD_REQUEST, array('errMsg'=>'Cannot delete group, found in Request Workflow ID: '. implode(',',$workflow_ids)));

		$qry = "select workflow_id, groups from hrforms2_forms_workflow";
		$stmt = oci_parse($this->db,$qry);
		$r = oci_execute($stmt);
		$workflow_ids = array();
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			if (in_array($this->req[0],explode(',',$row['GROUPS']))) {
				$workflow_ids[] = $row['WORKFLOW_ID'];
			}
		}
		oci_free_statement($stmt);
		if (count($workflow_ids) > 0) $this->raiseError(E_BAD_REQUEST, array('errMsg'=>'Cannot delete group, found in Form Workflow ID: '. implode(',',$workflow_ids)));

		$qry = "delete from hrforms2_groups where group_id = :group_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":group_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
	}
}
