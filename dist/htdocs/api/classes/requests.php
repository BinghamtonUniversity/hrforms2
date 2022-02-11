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
		if ($this->method == 'DELETE' && $this->req[1] != $this->sessionData['SUNY_ID']) $this->raiseError(E_FORBIDDEN);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        #$this->raiseError(401);
        if ($this->req[0] == 'draft') {
            $qry = "select DATA from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id and UNIX_TS = :unix_ts";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":suny_id",$this->req[1]);
            oci_bind_by_name($stmt,":unix_ts",$this->req[2]);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
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
        if ($this->POSTvars['data']['reqId'] == '') {
            $qry = "select count(*) from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ARRAY+OCI_RETURN_NULLS);
            oci_free_statement($stmt);
            if ($row[0] > MAX_DRAFTS) {
                $this->raiseError(E_TOO_MANY_DRAFTS);
                return;
            }
            $unix_ts = time();
            $reqId = "draft-".$this->sessionData['SUNY_ID']."-".$unix_ts;
            $this->POSTvars['data']['reqId'] = $reqId;
            $qry = "insert into HRFORMS2_REQUESTS_DRAFTS values(:suny_id, :unix_ts, EMPTY_CLOB()) returning DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt, ":unix_ts", $unix_ts);
            oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save(json_encode($this->POSTvars['data']));
            oci_commit($this->db);
            $this->toJSON($this->POSTvars['data']);
        } else {
            $this->toJSON($this->POSTvars);
            // insert into hrforms2_requests and get reqid
            #$qry = "insert into HRFORMS2_REQUESTS values(HRFORMS2_REQUEST_ID_SEQ.nextval, :suny_id, sysdate, EMPTY_CLOB()) returning REQUEST_ID, DATA into :request_id, :data";
            #$stmt = oci_parse($this->db,$qry);
            #$clob = oci_new_descriptor($this->db, OCI_D_LOB);
            #oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            #oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            #oci_bind_by_name($stmt, ":request_id", $request_id, -1, OCI_B_INT);
            #$r = oci_execute($stmt);
            #if (!$r) $this->raiseError();
            #$clob->save(json_encode($this->POSTvars['data']));
            #oci_commit($this->db);

            // get users group

            // get next group to

            // insert into hrforms2_requests_journal

            #$this->toJSON(array("request_id"=>$request_id));

            // delete from hrforms2_requests_drafts
            
            //$this->done();
        }

        /*
        if ($this->req[0] == 'draft') {
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
            list($mode,$suny_id,$unix_ts) = explode("-",$this->POSTvars['reqId']);
            if ($suny_id != $this->sessionData['SUNY_ID']) {
                //TODO: also check if isAdmin
                $this->raiseError(E_NOT_AUTHORIZED);
                return;
            }
            $qry = "insert into HRFORMS2_REQUESTS_DRAFTS values(:suny_id, :unix_ts, EMPTY_CLOB()) returning DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $suny_id);
            oci_bind_by_name($stmt, ":unix_ts", $unix_ts);
            oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            oci_execute($stmt,OCI_DEFAULT);
            $clob->save(json_encode($this->POSTvars['data']));
            oci_commit($this->db);
            $this->done();
        } else {
            $this->toJSON($this->req);
        }*/

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
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save(json_encode($this->POSTvars['data']));
            oci_commit($this->db);
            $this->done();
        } else {
            $this->toJSON($this->req);
        }
    }

    function DELETE() {
        if ($this->req[0] == 'draft') {
            $qry = "delete from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id and UNIX_TS = :unix_ts";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt, ":unix_ts", $this->req[2]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            oci_commit($this->db);
            $this->done();
        } else {
            $this->done();
        }
    }
}
