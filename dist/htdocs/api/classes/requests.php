<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Requests extends HRForms2 {
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
		// Validation...
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        if ($this->req[0] == 'draft') {
            $qry = "select DATA from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id and UNIX_TS = :unix_ts";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":suny_id",$this->req[1]);
            oci_bind_by_name($stmt,":unix_ts",$this->req[2]);
            oci_execute($stmt);
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $this->_arr['DATA'] = (is_object($row['DATA'])) ? $row['DATA']->load() : "";
            oci_free_statement($stmt);
			$this->returnData = json_decode($this->_arr['DATA']);
	        if ($this->retJSON) $this->toJSON($this->returnData);
        } else {
		    $this->done();
        }
	}

    function POST() {
        // POST only drafts?
        $qry = "select count(*) from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt,OCI_ARRAY+OCI_RETURN_NULLS);
        oci_free_statement($stmt);
        if ($row[0] > MAX_DRAFTS) {
            $this->raiseError(E_TOO_MANY_DRAFTS);
            return;
        }

        $now = time();
        $id = 'draft-' . $this->sessionData['SUNY_ID'] . '-' . $now;
        $qry = "insert into HRFORMS2_REQUESTS_DRAFTS values(:suny_id, :unix_ts, EMPTY_CLOB())";
        $stmt = oci_parse($this->db,$qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
        oci_bind_by_name($stmt, ":unix_ts", $now);
        oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
        oci_execute($stmt,OCI_DEFAULT);
        $clob->save(json_encode($this->POSTvars['data']));
        oci_commit($this->db);
        $this->toJSON(array("reqId"=>$id));
    }

    function PUT() {
        if ($this->req[0] == 'draft') {
            $qry = "update HRFORMS2_REQUESTS_DRAFTS set data = EMPTY_CLOB() 
                where SUNY_ID = :suny_id and unix_ts = :unix_ts
                returning DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt, ":unix_ts", $this->req[2]);
            oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            oci_execute($stmt,OCI_DEFAULT);
            $clob->save(json_encode($this->POSTvars['data']));
            oci_commit($this->db);
        } else {
            $this->toJSON($this->req);
        }
        $this->done();
    }

    function DELETE() {
        $this->done();
    }
}
