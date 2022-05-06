<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class User extends HRForms2 {
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
		if (!isset($this->req[0]) && !$this->sessionData['isAdmin']) $this->raiseError(400);
		// req[0] == session user SUNY ID unless admin; only admin can get other SUNYID
		if ($this->method != "GET" && !$this->sessionData['isAdmin']) $this->raiseError(403);
		if ($this->method == 'PUT' && !isset($this->req[0])) $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		if (!isset($this->req[0])) {
			// TODO: if refresh date < 24 hours use USER_INFO field.  Otherwise fetch from HR tables and update user_info
			// TODO: if no data from HR tables fall back to USER_INFO and do not update.
			$qry = "select p.*, u.suny_id as user_suny_id, u.created_date, u.created_by, u.start_date, u.end_date
			from hrforms2_users u
			left join (select distinct ".$this->BASE_PERSEMP_FIELDS." from buhr.buhr_persemp_mv@banner.cc.binghamton.edu) p on (u.suny_id = p.suny_id)";
			$stmt = oci_parse($this->db,$qry);
		} else {
			$qry = "select ".$this->BASE_PERSEMP_FIELDS.", r.recent_campus_date
			from buhr.buhr_persemp_mv@banner.cc.binghamton.edu p
			left join (select suny_id as recent_suny_id, recent_campus_date from buhr.buhr_general_info_mv@banner.cc.binghamton.edu) r on (r.recent_suny_id = p.suny_id)
			where p.role_status = 'C' and p.suny_id = :suny_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		}
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			//$this->userAttributes($row);
			$this->_arr[] = $row;
		}
		oci_free_statement($stmt);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}

	function PUT() {
		$qry = "update hrforms2_users set start_date = :start_date, end_date = :end_date where suny_id = :suny_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":start_date", $this->POSTvars['START_DATE']);
		oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
		oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		new usergroups(array($this->POSTvars['SUNY_ID']));
		$this->done();
	}

	function POST() {
		//TODO: need to store JSON info of user on last field
		$qry = "insert into hrforms2_users values(:suny_id, sysdate, :created_by, :start_date, :end_date, null, EMPTY_CLOB())";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id", $this->POSTvars['SUNY_ID']);
		oci_bind_by_name($stmt,":created_by", $this->sessionData['EFFECTIVE_SUNY_ID']);
		oci_bind_by_name($stmt,":start_date", $this->POSTvars['START_DATE']);
		oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		new usergroups(array($this->POSTvars['SUNY_ID']));
		$this->done();
	}

	function PATCH() {
		if (isset($this->POSTvars['END_DATE'])) {
			$qry = "update hrforms2_users set end_date = :end_date where suny_id = :suny_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
			oci_bind_by_name($stmt,":suny_id", $this->req[0]);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			oci_commit($this->db);
			oci_free_statement($stmt);
		}
		$this->done();
	}
	function DELETE() {
		$qry = "delete from hrforms2_users where suny_id = :suny_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
	}
}
