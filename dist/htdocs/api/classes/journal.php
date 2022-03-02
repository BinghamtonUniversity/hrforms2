<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Journal extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET,POST"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
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
		$this->done();
	}
    function POST() {
        $qry = "insert into HRFORMS2_REQUESTS_JOURNAL 
        values(:request_id, sysdate, :suny_id, :status, :hierarchy_id, :workflow_id, :seq, :group_from, :group_to, EMPTY_CLOB())
        returning COMMENTS into :comments";
        $stmt = oci_parse($this->db,$qry);
        $comments = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt,":request_id", $this->req[0]);
        oci_bind_by_name($stmt,":status", $this->req[1]);
        oci_bind_by_name($stmt,":suny_id", $this->sessionData['SUNY_ID']);
        oci_bind_by_name($stmt,":hierarchy_id", $this->req[2]['hierarchy_id']);
        oci_bind_by_name($stmt,":workflow_id", $this->req[2]['workflow_id']);
        oci_bind_by_name($stmt,":seq", $this->req[2]['seq']);
        oci_bind_by_name($stmt,":group_from", $this->req[2]['group_from']);
        oci_bind_by_name($stmt,":group_to", $this->req[2]['group_to']);
        oci_bind_by_name($stmt,":comments", $comments, -1, OCI_B_CLOB);
        $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        $comments->save($this->POSTvars['data']['comment']);
        oci_commit($this->db);
        if ($this->retJSON) $this->done();
    }
}
