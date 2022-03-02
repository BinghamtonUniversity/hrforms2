<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Hierarchy extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET,POST,PATCH,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
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
		if (in_array($this->method,array('PUT','PATCH','DELETE')) && !isset($this->req[0])) $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		//TODO: Handle form vs request hierarchy
		//TODO: Allow for lookup with groupID
		if ($this->req[0] == 'request') {
			$qry = "select h.HIERARCHY_ID,h.POSITION_TYPE,h.GROUP_ID,g.GROUP_NAME,h.WORKFLOW_ID,w.GROUPS
			from hrforms2_requests_hierarchy h
			left join (select * from hrforms2_groups) g on (h.group_id = g.group_id)
			left join (select * from hrforms2_requests_workflow) w on (h.workflow_id = w.workflow_id)";	
			if ($this->req[1] == 'group') {
				$qry .= " where h.group_id = :id";
				$id = $this->req[2];
			} elseif (isset($this->req[1])) {
				$qry .= " where h.hierarchy_id = :id";
				$id = $this->req[1];
			}
			$stmt = oci_parse($this->db,$qry);
			if (isset($this->req[1])) oci_bind_by_name($stmt,":id", $id);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
				$this->_arr[] = $row;
			}
			oci_free_statement($stmt);
			$this->returnData = $this->_arr;
			if ($this->retJSON) $this->toJSON($this->returnData);
			return;
		}
		if ($this->req[0] == 'form') {
			echo "form hierarchy";
		} 
		

        $qry = "select h.HIERARCHY_ID,h.POSITION_TYPE,h.GROUP_ID,g.GROUP_NAME,h.WORKFLOW_ID,w.GROUPS
        from hrforms2_requests_hierarchy h
        left join (select * from hrforms2_groups) g on (h.group_id = g.group_id)
        left join (select * from hrforms2_requests_workflow) w on (h.workflow_id = w.workflow_id)";
		$stmt = oci_parse($this->db,$qry);
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
		$qry = "insert into hrforms2_requests_hierarchy 
		values(HRFORMS2_REQUESTS_HIERARCHY_SEQ.nextval, :position_type, :group_id, :workflow_id)
		returning HIERARCHY_ID into :hierarchy_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":position_type", $this->POSTvars['posType']);
		oci_bind_by_name($stmt,":group_id", $this->POSTvars['groupId']);
		oci_bind_by_name($stmt,":workflow_id", $this->POSTvars['workflowId']);
		oci_bind_by_name($stmt,":hierarchy_id", $HIERARCHY_ID,-1,SQLT_INT);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_free_statement($stmt);
		$this->toJSON(array("HIERARCHY_ID"=>$HIERARCHY_ID));
	}
	function PATCH() {
		if (isset($this->POSTvars['WORKFLOW_ID'])) {
			$qry = "update hrforms2_requests_hierarchy set workflow_id = :workflow_id where hierarchy_id = :hierarchy_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":workflow_id", $this->POSTvars['WORKFLOW_ID']);
			oci_bind_by_name($stmt,":hierarchy_id", $this->req[0]);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			oci_commit($this->db);
			oci_free_statement($stmt);
		}
		$this->done();
	}
	function DELETE() {
		$qry = "delete from hrforms2_requests_hierarchy where hierarchy_id = :hierarchy_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":hierarchy_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
	}
}
