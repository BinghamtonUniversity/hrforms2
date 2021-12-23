<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class GroupDepts extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET,POST,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
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
        $qry = "select * from hrforms2_group_departments";
        if (isset($this->req[0])) $qry .= " where group_id = :group_id";
		$stmt = oci_parse($this->db,$qry);
        if (isset($this->req[0])) oci_bind_by_name($stmt, ":group_id", $this->req[0]);
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
        foreach ($this->POSTvars['DEL_DEPTS'] as $dept) {
			$qry = "delete from hrforms2_group_departments where department_code = :department_code and group_id = :group_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":department_code", $dept['DEPARTMENT_CODE']);
			oci_bind_by_name($stmt,":group_id", $this->req[0]);
			$r = oci_execute($stmt);
            if (!$r) $this->raiseError();
			oci_free_statement($stmt);
        }
        foreach ($this->POSTvars['ADD_DEPTS'] as $dept) {
            $qry = "insert into hrforms2_group_departments values(:department_code,:group_id,:department_desc)";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":department_code", $dept['DEPARTMENT_CODE']);
			oci_bind_by_name($stmt,":group_id", $this->req[0]);
			oci_bind_by_name($stmt,":department_desc", $dept['DEPARTMENT_DESC']);
			$r = oci_execute($stmt);
            if (!$r) $this->raiseError();
			oci_free_statement($stmt);
        }
		oci_commit($this->db);
    }
    function PUT() {
        $this->POST();
    }
}
