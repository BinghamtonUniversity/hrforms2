<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class GroupUsers extends HRForms2 {
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
        if (!isset($this->req[0])) $this->raiseError(400);
		if ($this->method=='PUT' && !$this->sessionData['isAdmin']) $this->raiseError(403);
    }

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		$qry = "select u.suny_id as user_suny_id, u.start_date, u.end_date, 
			u.user_options.notifications as notifications, u.user_info
			from hrforms2_users u, hrforms2_user_groups ug
			where u.suny_id = ug.suny_id
			and ug.group_id = :group_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":group_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			$userInfo = json_decode((is_object($row['USER_INFO']))?$row['USER_INFO']->load():"",true);
			unset($row['USER_INFO']);
			if ($userInfo != null) {
				$row = array_merge($row,$userInfo);
			} else {
				$user = (new user(array($row['USER_SUNY_ID']),false))->returnData[0];
				$row = array_merge($row,(array)$user);
			}
			if (!isset($row['SUNY_ID'])) {
				if (!isset($row['USER_SUNY_ID'])) continue;
				$row['SUNY_ID'] = $row['USER_SUNY_ID'];
				$row['LEGAL_FIRST_NAME'] = $row['USER_SUNY_ID'];
				$row['LEGAL_LAST_NAME'] = null;
			}
			/*if (!isset($row['SUNY_ID'])) {
				$row['SUNY_ID'] = $row['USER_SUNY_ID'];
				$row['LEGAL_FIRST_NAME'] = null;
				$row['LEGAL_LAST_NAME'] = null;
				//continue; // no user data returned
			}*/
			$this->_arr[] = $row;
		}
		oci_free_statement($stmt);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}

	function PUT() {
		foreach ($this->POSTvars['DEL_USERS'] as $user) {
			$qry = "delete from hrforms2_user_groups where suny_id = :suny_id and group_id = :group_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":suny_id", $user);
			oci_bind_by_name($stmt,":group_id", $this->req[0]);
			$r = oci_execute($stmt);
            if (!$r) $this->raiseError();
			oci_free_statement($stmt);
		}
		foreach ($this->POSTvars['ADD_USERS'] as $user) {
			$qry = "insert into hrforms2_user_groups values(:suny_id,:group_id)";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":suny_id", $user);
			oci_bind_by_name($stmt,":group_id", $this->req[0]);
			$r = oci_execute($stmt);
            if (!$r) $this->raiseError();
			oci_free_statement($stmt);
		}
		oci_commit($this->db);
	}
	function POST() {
		$this->PUT();
	}
}
