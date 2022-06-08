<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Codes extends HRForms2 {
	private $_arr = array();
    private $codes = array("payroll","form","action","transaction");

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
        if (in_array($this->method,array('PUT','PATCH','DELETE'))) {
            if (!$this->sessionData['isAdmin']) $this->raiseError(403);
            if (!isset($this->req[1])) $this->raiseError(400);
        }
        if ($this->method=="POST" && !$this->sessionData['isAdmin']) $this->raiseError(403);
        if (!in_array(strtolower($this->req[0]),$this->codes)) $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		$qry = "SELECT * FROM HRFORMS2_".$this->req[0]."_CODES ORDER BY ORDERBY,".$this->req[0]."_TITLE";
        $stmt = oci_parse($this->db,$qry);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        $this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
    function POST() {
        $qry = "INSERT INTO HRFORMS2_".$this->req[0]."_CODES VALUES(:code,:title,:active,:orderby)";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":code", $this->POSTvars['CODE']);
        oci_bind_by_name($stmt,":title", $this->POSTvars['TITLE']);
        oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
        oci_bind_by_name($stmt,":orderby", $this->POSTvars['ORDERBY']);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }
    function PUT() {
        $qry = "UPDATE HRFORMS2_".$this->req[0]."_CODES SET ".$this->req[0]."_code = :code, ".$this->req[0]."_title = :title,
            active = :active, orderby = :orderby WHERE ".$this->req[0]."_code = :req1";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":code", $this->POSTvars['CODE']);
        oci_bind_by_name($stmt,":title", $this->POSTvars['TITLE']);
        oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
        oci_bind_by_name($stmt,":orderby", $this->POSTvars['ORDERBY']);
        oci_bind_by_name($stmt,":req1", $this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }
    function PATCH() {
        //update active
        if (isset($this->POSTvars['ACTIVE'])) {
            $qry = "UPDATE HRFORMS2_".$this->req[0]."_CODES SET active = :active WHERE ".$this->req[0]."_code = :code";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
			oci_bind_by_name($stmt,":code", $this->req[1]);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			oci_commit($this->db);
			oci_free_statement($stmt);
        }
        //update orderby
        if (isset($this->POSTvars['ORDERBY'])) {
            $qry = "UPDATE HRFORMS2_".$this->req[0]."_CODES SET orderby = :orderby WHERE ".$this->req[0]."_code = :code";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":orderby", $this->POSTvars['ORDERBY']);
			oci_bind_by_name($stmt,":code", $this->req[1]);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			oci_commit($this->db);
			oci_free_statement($stmt);
        }
        $this->done();
    }
    function DELETE() {
        $qry = "DELETE FROM HRFORMS2_".$this->req[0]."_CODES where ".$this->req[0]."_code = :code";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":code", $this->req[1]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
    }
}