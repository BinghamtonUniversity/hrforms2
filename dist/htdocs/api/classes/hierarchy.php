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
		//TODO: check this, do regular users need to GET? yes - form submit needs it
		//if (!$this->sessionData['isAdmin']) $this->raiseError(403);
		if (in_array($this->method,array('PUT','PATCH','DELETE')) && !isset($this->req[1])) $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		//TODO: Allow for lookup with groupID
		switch($this->req[0]) {
			case "request": /** Request Hierarchy */
				$qry = "select h.HIERARCHY_ID,h.POSITION_TYPE,h.GROUP_ID,g.GROUP_NAME,h.WORKFLOW_ID,w.GROUPS,w.CONDITIONS
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
					$conditions = (is_object($row['CONDITIONS']))?$row['CONDITIONS']->load():"";
					unset($row['CONDITIONS']);
					$row['CONDITIONS'] = json_decode($conditions);
					$this->_arr[] = $row;
				}
				oci_free_statement($stmt);
				break;

			case "form": /** Form Hierarchy */
				$qry = "select 
					h.HIERARCHY_ID,h.PAYTRANS_ID, 
					p.payroll_code, pay.payroll_title, pay.payroll_description, pay.active as payroll_active,
					p.form_code, f.form_title, f.form_description, f.active as form_code_active,
					p.action_code, a.action_title, a.action_description, a.active as action_code_active,
					p.transaction_code, t.transaction_title, t.transaction_description, t.active as transaction_code_active,
					p.active as paytrans_active, p.available_for,
					h.GROUPS as hierarchy_groups,h.WORKFLOW_ID,
					w.GROUPS as workflow_groups,w.CONDITIONS,w.SENDTOGROUP
					from hrforms2_forms_hierarchy h
					left join (select * from hrforms2_payroll_transactions) p on (h.paytrans_id = p.paytrans_id)
					left join (select * from hrforms2_forms_workflow) w on (h.workflow_id = w.workflow_id)
					left join (select * from hrforms2_payroll_codes) pay on (p.payroll_code = pay.payroll_code)
					left join (select * from hrforms2_form_codes) f on (p.form_code = f.form_code)
					left join (select * from hrforms2_action_codes) a on (p.action_code = a.action_code)
					left join (select * from hrforms2_transaction_codes) t on (p.transaction_code = t.transaction_code)";
				$stmt = oci_parse($this->db,$qry);
				//TODO: what is this for? there is no where clause or bind var defined.
				//if (isset($this->req[1])) oci_bind_by_name($stmt,":id", $id);
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
			default:
				$this->raiseError(E_BAD_REQUEST);
		}
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
	function POST() {
		switch($this->req[0]) {
			case "request": /** Request Hierarchy */
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
				break;
			case "form": /** Form Hierarchy */
				$qry = "insert into hrforms2_forms_hierarchy 
				values(HRFORMS2_FORMS_HIERARCHY_SEQ.nextval, :paytrans_id, :workflow_id, :groups)
				returning HIERARCHY_ID into :hierarchy_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":paytrans_id", $this->POSTvars['formCode']);
				oci_bind_by_name($stmt,":workflow_id", $this->POSTvars['workflowId']);
				oci_bind_by_name($stmt,":groups", $this->POSTvars['groups']);
				oci_bind_by_name($stmt,":hierarchy_id", $HIERARCHY_ID,-1,SQLT_INT);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_free_statement($stmt);
				$this->toJSON(array("HIERARCHY_ID"=>$HIERARCHY_ID));
				break;
		}
	}
	function PATCH() {
		switch($this->req[0]) {
			case "request": /** Request Hierarchy */
				if (isset($this->POSTvars['WORKFLOW_ID'])) {
					$qry = "update hrforms2_requests_hierarchy set workflow_id = :workflow_id where hierarchy_id = :hierarchy_id";
					$stmt = oci_parse($this->db,$qry);
					oci_bind_by_name($stmt,":workflow_id", $this->POSTvars['WORKFLOW_ID']);
					oci_bind_by_name($stmt,":hierarchy_id", $this->req[1]);
					$r = oci_execute($stmt);
					if (!$r) $this->raiseError();
					oci_commit($this->db);
					oci_free_statement($stmt);
				}
				$this->done();
				break;
			case "form": /** Form Hierarchy */
				$qry = "update hrforms2_forms_hierarchy 
					set workflow_id = :workflow_id, groups = :groups
					where hierarchy_id = :hierarchy_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":workflow_id", $this->POSTvars['workflowId']);
				oci_bind_by_name($stmt,":groups", $this->POSTvars['groups']);
				oci_bind_by_name($stmt,":hierarchy_id", $this->req[1]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_commit($this->db);
				oci_free_statement($stmt);
				$this->done();
				break;
		}
	}
	function DELETE() {
		$table = "";
		switch($this->req[0]) {
			case "request": $table = "requests"; break;
			case "form": $table = "forms"; break;
			default: $this->raiseError(400);
		}
		$qry = "delete from hrforms2_{$table}_hierarchy where hierarchy_id = :hierarchy_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":hierarchy_id", $this->req[1]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
	}
}
