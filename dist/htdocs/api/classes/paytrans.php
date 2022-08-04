<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class PayTrans extends HRForms2 {
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
        if (in_array($this->method,array('PUT','PATCH','DELETE'))) {
            if (!$this->sessionData['isAdmin']) $this->raiseError(403);
            if (!isset($this->req[0])) $this->raiseError(400);
        }
        if ($this->method=="POST" && !$this->sessionData['isAdmin']) $this->raiseError(403);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		$qry = "SELECT pt.paytrans_id, pt.payroll_code, p.payroll_title, p.payroll_description,
			pt.form_code, f.form_title, f.form_description,
			pt.action_code, a.action_title, a.action_description,
			pt.transaction_code, t.transaction_title, t.transaction_description,
			pt.active,pt.available_for
			FROM HRFORMS2_PAYROLL_TRANSACTIONS pt
			join (select PAYROLL_CODE, PAYROLL_TITLE, PAYROLL_DESCRIPTION from HRFORMS2_PAYROLL_CODES) p on (pt.PAYROLL_CODE = p.PAYROLL_CODE)
			join (select FORM_CODE, FORM_TITLE, FORM_DESCRIPTION from HRFORMS2_FORM_CODES) f on (pt.FORM_CODE = f.FORM_CODE)
			left join (select ACTION_CODE, ACTION_TITLE, ACTION_DESCRIPTION from HRFORMS2_ACTION_CODES) a on (pt.ACTION_CODE = a.ACTION_CODE)
			left join (select TRANSACTION_CODE, TRANSACTION_TITLE, TRANSACTION_DESCRIPTION from HRFORMS2_TRANSACTION_CODES) t on (pt.TRANSACTION_CODE = t.TRANSACTION_CODE)";
		if (isset($this->req[0])) $qry .= " WHERE pt.payroll_code = :payroll_code";
		if (isset($this->req[1])) $qry .= " AND pt.form_code = :form_code";
		if (isset($this->req[2])) $qry .= " AND pt.action_code = :action_code";
        $stmt = oci_parse($this->db,$qry);
		if (isset($this->req[0])) oci_bind_by_name($stmt,":payroll_code", $this->req[0]);
		if (isset($this->req[1])) oci_bind_by_name($stmt,":form_code", $this->req[1]);
		if (isset($this->req[2])) oci_bind_by_name($stmt,":action_code", $this->req[2]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        $this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}

    function POST() {
        $qry = "INSERT INTO HRFORMS2_PAYROLL_TRANSACTIONS 
            values(HRFORMS2_PAYTRANS_ID_SEQ.nextval,:payroll_code,:form_code,:action_code,:transaction_code,:active,:available_for)
            RETURNING PAYTRANS_ID into :paytrans_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":payroll_code", $this->POSTvars['PAYROLL_CODE']);
		oci_bind_by_name($stmt,":form_code", $this->POSTvars['FORM_CODE']);
		oci_bind_by_name($stmt,":action_code", $this->POSTvars['ACTION_CODE']);
		oci_bind_by_name($stmt,":transaction_code", $this->POSTvars['TRANSACTION_CODE']);
		oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
		oci_bind_by_name($stmt,":available_for", $this->POSTvars['AVAILABLE_FOR']);
        oci_bind_by_name($stmt,":paytrans_id", $PAYTRANS_ID,-1,SQLT_INT);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_free_statement($stmt);
		$this->toJSON(array("PAYTRANS_ID"=>$PAYTRANS_ID));
    }
	function PUT() {
		/* cannot update codes, only active and tabs [TBD] */
		$qry = "UPDATE HRFORMS2_PAYROLL_TRANSACTIONS
			SET active = :active,
			available_for = :available_for
			WHERE paytrans_id = :paytrans_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
		oci_bind_by_name($stmt,":available_for", $this->POSTvars['AVAILABLE_FOR']);
		oci_bind_by_name($stmt,":paytrans_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
	}
	function PATCH() {
		if (isset($this->POSTvars['ACTIVE'])) {
			$qry = "UPDATE HRFORMS2_PAYROLL_TRANSACTIONS SET active = :active WHERE paytrans_id = :paytrans_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
			oci_bind_by_name($stmt,":paytrans_id", $this->req[0]);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			oci_commit($this->db);
			oci_free_statement($stmt);
        }
		$this->done();
	}
	function DELETE() {
		$qry = "DELETE FROM HRFORMS2_PAYROLL_TRANSACTIONS where paytrans_id = :paytrans_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":paytrans_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
	}

}
