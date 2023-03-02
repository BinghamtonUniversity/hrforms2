<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Forms extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET, POST, DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
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
            $qry = "select DATA from HRFORMS2_FORMS_DRAFTS where SUNY_ID = :suny_id and UNIX_TS = :unix_ts";
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
            /*$qry = "select REQUEST_DATA from HRFORMS2_REQUESTS where REQUEST_ID = :request_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":request_id",$this->req[0]);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $this->_arr['REQUEST_DATA'] = (is_object($row['REQUEST_DATA'])) ? $row['REQUEST_DATA']->load() : "";
            oci_free_statement($stmt);
			$this->returnData = json_decode($this->_arr['REQUEST_DATA']);
	        if ($this->retJSON) $this->toJSON($this->returnData);*/
        }
	}

    function POST() {
        //TODO: should this be part of the URL?
        //POST: https://{domain}/api/api.php/requests/draft/... (eq action=="save")
        //POST: https://{domain}/api/api.php/requests/submit/12
        //POST: https://{domain}/api/api.php/requests/approve/12
        //POST: https://{domain}/api/api.php/requests/reject/12
        
        switch($this->POSTvars['action']) {
            case "save":
                //Limit number of drafts a user may have; to prevent "SPAMMING"
                $qry = "select count(*) from HRFORMS2_FORMS_DRAFTS where SUNY_ID = :suny_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $row = oci_fetch_array($stmt,OCI_ARRAY+OCI_RETURN_NULLS);
                oci_free_statement($stmt);
                if ($row[0] > MAX_DRAFTS) {
                    $this->raiseError(E_TOO_MANY_DRAFTS);
                    return;
                }
                $unix_ts = time();
                $formId = 'draft-'.$this->sessionData['EFFECTIVE_SUNY_ID'].'-'.$unix_ts;
                $this->POSTvars['formId'] = $formId;
                //TODO: need to modify POSTvars to use new assigned draft ID; don't use the assigned code... assigned could just be "draft"?
                $qry = "insert into HRFORMS2_FORMS_DRAFTS values(:suny_id, :unix_ts, EMPTY_CLOB()) returning DATA into :data";
                $stmt = oci_parse($this->db,$qry);
                $clob = oci_new_descriptor($this->db, OCI_D_LOB);
                oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
                oci_bind_by_name($stmt, ":unix_ts", $unix_ts);
                oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
                $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
                if (!$r) $this->raiseError();
                $clob->save(json_encode($this->POSTvars));
                oci_commit($this->db);
                if ($this->retJSON) $this->toJSON(array('formId'=>$formId));
                break;

            default:
                $this->raiseError(E_BAD_REUQEST);

        }
    }

    function DELETE() {
        if ($this->req[0] == 'draft') {
            $qry = "delete from HRFORMS2_FORMS_DRAFTS where SUNY_ID = :suny_id and UNIX_TS = :unix_ts";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
            oci_bind_by_name($stmt, ":unix_ts", $this->req[2]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            oci_commit($this->db);
            if ($this->retJSON) $this->done();
        } else {
            //raise error; cannot delete non-drafts.
            $this->raiseError(E_METHOD_NOT_ALLOWED);
        }
    }
}
